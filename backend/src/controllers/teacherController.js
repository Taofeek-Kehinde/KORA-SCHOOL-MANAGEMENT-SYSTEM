const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');

class TeacherController {
  // =============================================
  // CREATE TEACHER
  // =============================================
    createTeacher = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { firstName, lastName, email, password, phone, specialization, classAssignments } = req.body;

      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ status: 'error', message: 'All fields are required' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          email,
          password_hash: hashedPassword,
          full_name: `${firstName} ${lastName}`,
          phone: phone || '',
          role: 'teacher',
          school_id: schoolId,
          is_active: true,
          is_verified: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (userError) throw userError;

      const { data: teacher, error: teacherError } = await supabaseAdmin
        .from('teachers')
        .insert({
          user_id: user.id,
          school_id: schoolId,
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || '',
          specialization: specialization || '',
          is_active: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (teacherError) throw teacherError;

      if (classAssignments && Array.isArray(classAssignments) && classAssignments.length > 0) {
        const assignments = classAssignments
          .filter(a => a.classId && a.subjectId)
          .map(a => ({
            teacher_id: teacher.id,
            class_id: a.classId,
            subject_id: a.subjectId,
            is_active: true,
            created_at: new Date()
          }));

        if (assignments.length > 0) {
          const { error: assignError } = await supabaseAdmin
            .from('teacher_classes')
            .insert(assignments);
          if (assignError) throw assignError;
        }
      }

      await supabaseAdmin
        .from('users')
        .update({ teacher_id: teacher.id })
        .eq('id', user.id);

      res.status(201).json({
        status: 'success',
        message: 'Teacher created successfully',
        data: { teacher, user, temp_password: password }
      });
    } catch (error) {
      console.error('Create Teacher Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create teacher', error: error.message });
    }
  };

    getAllTeachers = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { search, limit = 100, offset = 0 } = req.query;

      let query = supabaseAdmin
        .from('teachers')
        .select(`
          *,
          classes:teacher_classes(
            class_id,
            subject_id,
            is_active,
            classes!class_id(id, name, level),
            subjects!subject_id(id, name, code)
          )
        `)
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('first_name', { ascending: true });

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (error) throw error;

      const formatted = (data || []).map(t => {
        const activeAssignments = (t.classes || []).filter(c => c.is_active);
        return {
          ...t,
          classIds: activeAssignments.map(c => c.class_id),
          classAssignments: activeAssignments.map(c => ({
            classId: c.class_id,
            subjectId: c.subject_id,
            className: c.classes?.name,
            subjectName: c.subjects?.name
          }))
        };
      });

      res.status(200).json({
        status: 'success',
        data: formatted || [],
        pagination: { limit: parseInt(limit), offset: parseInt(offset), total: count || 0 }
      });
    } catch (error) {
      console.error('Get Teachers Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch teachers', error: error.message });
    }
  };
   updateTeacher = async (req, res) => {
    try {
      const { schoolId, teacherId } = req.params;
      const { firstName, lastName, email, phone, specialization, isActive, classAssignments } = req.body;

      const { data: teacher, error: fetchError } = await supabaseAdmin
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .eq('school_id', schoolId)
        .single();

      if (fetchError) throw fetchError;

      const updateData = {};
      if (firstName !== undefined) updateData.first_name = firstName;
      if (lastName !== undefined) updateData.last_name = lastName;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (specialization !== undefined) updateData.specialization = specialization;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      const { data: updatedTeacher, error: updateError } = await supabaseAdmin
        .from('teachers')
        .update(updateData)
        .eq('id', teacherId)
        .select()
        .single();

      if (updateError) throw updateError;

      if (teacher.user_id) {
        const userUpdate = {};
        if (email) userUpdate.email = email;
        if (firstName || lastName) userUpdate.full_name = `${firstName || teacher.first_name} ${lastName || teacher.last_name}`;
        if (phone) userUpdate.phone = phone;
        userUpdate.updated_at = new Date();
        await supabaseAdmin.from('users').update(userUpdate).eq('id', teacher.user_id);
      }

      // ✅ UPDATE CLASS+SUBJECT ASSIGNMENTS (find-or-reactivate)
      if (classAssignments && Array.isArray(classAssignments)) {
        const valid = classAssignments.filter(a => a.classId && a.subjectId);

        const { data: existingRows, error: fetchRowsError } = await supabaseAdmin
          .from('teacher_classes')
          .select('id, class_id, subject_id, is_active')
          .eq('teacher_id', teacherId);

        if (fetchRowsError) throw fetchRowsError;

        const keyOf = (classId, subjectId) => `${classId}::${subjectId}`;
        const existingByKey = {};
        (existingRows || []).forEach(r => { existingByKey[keyOf(r.class_id, r.subject_id)] = r; });

        const desiredKeys = new Set(valid.map(a => keyOf(a.classId, a.subjectId)));

        // Deactivate rows no longer desired
        const toDeactivate = (existingRows || [])
          .filter(r => r.is_active && !desiredKeys.has(keyOf(r.class_id, r.subject_id)))
          .map(r => r.id);

        if (toDeactivate.length > 0) {
          const { error: deactivateError } = await supabaseAdmin
            .from('teacher_classes')
            .update({ is_active: false })
            .in('id', toDeactivate);
          if (deactivateError) throw deactivateError;
        }

        // Reactivate or insert each desired assignment
        for (const a of valid) {
          const key = keyOf(a.classId, a.subjectId);
          const existing = existingByKey[key];
          if (existing) {
            if (!existing.is_active) {
              const { error: reactivateError } = await supabaseAdmin
                .from('teacher_classes')
                .update({ is_active: true })
                .eq('id', existing.id);
              if (reactivateError) throw reactivateError;
            }
          } else {
            const { error: insertError } = await supabaseAdmin
              .from('teacher_classes')
              .insert({
                teacher_id: teacherId,
                class_id: a.classId,
                subject_id: a.subjectId,
                is_active: true,
                created_at: new Date()
              });
            if (insertError) throw insertError;
          }
        }
      }

      res.status(200).json({
        status: 'success',
        message: 'Teacher updated successfully',
        data: updatedTeacher
      });
    } catch (error) {
      console.error('Update Teacher Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update teacher', error: error.message });
    }
  };
  // =============================================
  // DELETE TEACHER
  // =============================================
  deleteTeacher = async (req, res) => {
    try {
      const { schoolId, teacherId } = req.params;

      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('user_id')
        .eq('id', teacherId)
        .eq('school_id', schoolId)
        .single();

      await supabaseAdmin
        .from('teachers')
        .update({ is_active: false })
        .eq('id', teacherId)
        .eq('school_id', schoolId);

      if (teacher?.user_id) {
        await supabaseAdmin
          .from('users')
          .update({ is_active: false })
          .eq('id', teacher.user_id);
      }

      await supabaseAdmin
        .from('teacher_classes')
        .update({ is_active: false })
        .eq('teacher_id', teacherId);

      res.status(200).json({
        status: 'success',
        message: 'Teacher deleted successfully'
      });
    } catch (error) {
      console.error('Delete Teacher Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete teacher', error: error.message });
    }
  };

  // =============================================
  // GET TEACHER CLASSES
  // =============================================
  getTeacherClasses = async (req, res) => {
    try {
      const { teacherId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('teacher_classes')
        .select(`
          *,
          classes!class_id(id, name, level),
          subjects!subject_id(id, name, code)
        `)
        .eq('teacher_id', teacherId)
        .eq('is_active', true);

      if (error) throw error;

      const classIds = [...new Set((data || []).map(r => r.class_id))];
      let countsByClass = {};

      if (classIds.length > 0) {
        const { data: studentRows, error: studentsError } = await supabaseAdmin
          .from('students')
          .select('id, class_id')
          .in('class_id', classIds)
          .eq('is_active', true);
        if (studentsError) throw studentsError;

        countsByClass = (studentRows || []).reduce((acc, s) => {
          acc[s.class_id] = (acc[s.class_id] || 0) + 1;
          return acc;
        }, {});
      }

      const formatted = (data || []).map(r => ({
        ...r,
        students_count: countsByClass[r.class_id] || 0
      }));

      res.status(200).json({ status: 'success', data: formatted });
    } catch (error) {
      console.error('Get Teacher Classes Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get teacher classes', error: error.message });
    }
  };

  // =============================================
  // GET TEACHER STUDENTS
  // =============================================
  getTeacherStudents = async (req, res) => {
    try {
      const { classId } = req.query;

      const { data, error } = await supabaseAdmin
        .from('students')
        .select('*, classes!class_id(id, name, level)')
        .eq('class_id', classId)
        .eq('is_active', true)
        .order('last_name', { ascending: true });

      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Teacher Students Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get students', error: error.message });
    }
  };

  // =============================================
  // UPDATE ATTENDANCE
  // =============================================
  updateAttendance = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { attendance } = req.body;

      if (!attendance || !Array.isArray(attendance) || attendance.length === 0) {
        return res.status(400).json({ status: 'error', message: 'No attendance records to save' });
      }

      const results = { success: [], failed: [] };
      for (const record of attendance) {
        try {
   const { data, error } = await supabaseAdmin
  .from('attendance')
  .upsert({
    student_id: record.studentId,
    class_id: record.classId,
    date: record.date || new Date().toISOString().split('T')[0],
    status: record.status,
    school_id: schoolId,
    marked_by: adminId
  }, { onConflict: 'student_id,date' })
  .select()
  .single();

          if (error) throw error;
          results.success.push(data);
        } catch (error) {
          results.failed.push({ student_id: record.studentId, error: error.message });
        }
      }

      res.status(200).json({
        status: 'success',
        message: `Updated ${results.success.length} attendance records`,
        data: results
      });
    } catch (error) {
      console.error('Update Attendance Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update attendance', error: error.message });
    }
  };

  // =============================================
  // GET ASSESSMENTS
  // =============================================
  getAssessments = async (req, res) => {
    try {
      const { classId, subjectId } = req.query;

      const { data: students } = await supabaseAdmin
        .from('students')
        .select('id, first_name, last_name, admission_number')
        .eq('class_id', classId)
        .eq('is_active', true)
        .order('last_name', { ascending: true });

      const { data: grades } = await supabaseAdmin
        .from('grades')
        .select('*')
        .eq('class_id', classId)
        .eq('subject_id', subjectId);

      const formatted = (students || []).map(student => {
        const g = grades?.find(x => x.student_id === student.id);
        return {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          admission_number: student.admission_number,
          ca1: g?.ca1 || '',
          ca2: g?.ca2 || '',
          ca3: g?.ca3 || '',
          exam: g?.exam || '',
          total: g?.total || '',
          grade: g?.grade || '',
          remark: g?.remark || ''
        };
      });

      res.status(200).json({ status: 'success', data: formatted || [] });
    } catch (error) {
      console.error('Get Assessments Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get assessments', error: error.message });
    }
  };

  // =============================================
  // UPDATE ASSESSMENTS
  // =============================================
  updateAssessments = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { assessments } = req.body;

      if (!assessments || !Array.isArray(assessments) || assessments.length === 0) {
        return res.status(400).json({ status: 'error', message: 'No assessments to save' });
      }

      const results = { success: [], failed: [] };
      for (const record of assessments) {
        try {
          const ca1 = parseFloat(record.ca1) || 0;
          const ca2 = parseFloat(record.ca2) || 0;
          const ca3 = parseFloat(record.ca3) || 0;
          const exam = parseFloat(record.exam) || 0;
          const total = ca1 + ca2 + ca3 + exam;
          let grade = total >= 70 ? 'A' : total >= 60 ? 'B' : total >= 50 ? 'C' : total >= 45 ? 'D' : total >= 40 ? 'E' : 'F';

          const { data, error } = await supabaseAdmin
  .from('grades')
  .upsert({
    student_id: record.studentId,
    class_id: record.classId,
    subject_id: record.subjectId,
    ca1,
    ca2,
    ca3,
    exam,
    total,
    grade,
    remark: record.remark || '',
    school_id: schoolId,
    term: record.term || 'Term 1',
    session: record.session || '2025/2026',
    updated_by: adminId,
    updated_at: new Date()
  }, { onConflict: 'student_id,subject_id,term,session' })
  .select()
  .single();
          if (error) throw error;
          results.success.push(data);
        } catch (error) {
          results.failed.push({ student_id: record.studentId, error: error.message });
        }
      }

      res.status(200).json({
        status: 'success',
        message: `Updated ${results.success.length} assessments`,
        data: results
      });
    } catch (error) {
      console.error('Update Assessments Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update assessments', error: error.message });
    }
  };

  // =============================================
  // GET ATTENDANCE
  // =============================================
  getAttendance = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { classId, date } = req.query;

      const { data, error } = await supabaseAdmin
        .from('attendance')
        .select('*, students!student_id(first_name, last_name, admission_number)')
        .eq('school_id', schoolId)
        .eq('class_id', classId)
        .eq('date', date || new Date().toISOString().split('T')[0]);

      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Attendance Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get attendance', error: error.message });
    }
  };
}

module.exports = new TeacherController();