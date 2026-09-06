const { supabaseAdmin } = require('../config/supabase');

class SubjectController {
  // =============================================
  // GET ALL SUBJECTS
  // =============================================
  getSubjects = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { departmentId } = req.query;

      let query = supabaseAdmin
        .from('subjects')
        .select(`
          *,
          departments!department_id(id, name),
          teacher_subjects(
            teacher_id,
            teachers!teacher_id(id, first_name, last_name)
          )
        `)
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (departmentId) query = query.eq('department_id', departmentId);

      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Subjects Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get subjects', error: error.message });
    }
  };

  // =============================================
  // CREATE SUBJECT
  // =============================================
  createSubject = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { name, code, departmentId, classLevel, weeklyPeriods, passMark, maxScore } = req.body;

      if (!name) {
        return res.status(400).json({ status: 'error', message: 'Subject name is required' });
      }

      const subjectCode = code || name.substring(0, 3).toUpperCase() + '-' + Math.floor(Math.random() * 1000);

      const { data, error } = await supabaseAdmin
        .from('subjects')
        .insert({
          school_id: schoolId,
          name,
          code: subjectCode,
          department_id: departmentId || null,
          class_level: classLevel || '',
          weekly_periods: weeklyPeriods || 4,
          pass_mark: passMark || 40,
          max_score: maxScore || 100,
          is_active: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ status: 'success', message: 'Subject created successfully', data });
    } catch (error) {
      console.error('Create Subject Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create subject', error: error.message });
    }
  };

  // =============================================
  // UPDATE SUBJECT
  // =============================================
  updateSubject = async (req, res) => {
    try {
      const { schoolId, subjectId } = req.params;
      const { name, code, departmentId, classLevel, weeklyPeriods, passMark, maxScore, isActive } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (code !== undefined) updateData.code = code;
      if (departmentId !== undefined) updateData.department_id = departmentId;
      if (classLevel !== undefined) updateData.class_level = classLevel;
      if (weeklyPeriods !== undefined) updateData.weekly_periods = weeklyPeriods;
      if (passMark !== undefined) updateData.pass_mark = passMark;
      if (maxScore !== undefined) updateData.max_score = maxScore;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('subjects')
        .update(updateData)
        .eq('id', subjectId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', message: 'Subject updated successfully', data });
    } catch (error) {
      console.error('Update Subject Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update subject', error: error.message });
    }
  };

  // =============================================
  // DELETE SUBJECT
  // =============================================
  deleteSubject = async (req, res) => {
    try {
      const { schoolId, subjectId } = req.params;
      const { error } = await supabaseAdmin
        .from('subjects')
        .delete()
        .eq('id', subjectId)
        .eq('school_id', schoolId);
      if (error) throw error;
      res.status(200).json({ status: 'success', message: 'Subject deleted successfully' });
    } catch (error) {
      console.error('Delete Subject Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete subject', error: error.message });
    }
  };

  // =============================================
  // ASSIGN SUBJECT TO TEACHER
  // =============================================
  assignSubjectToTeacher = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { teacherId, subjectId, classId, armId } = req.body;

      if (!teacherId || !subjectId || !classId) {
        return res.status(400).json({ status: 'error', message: 'Teacher, subject, and class are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('teacher_subjects')
        .insert({
          school_id: schoolId,
          teacher_id: teacherId,
          subject_id: subjectId,
          class_id: classId,
          arm_id: armId || null,
          is_active: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ status: 'success', message: 'Subject assigned to teacher successfully', data });
    } catch (error) {
      console.error('Assign Subject Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to assign subject', error: error.message });
    }
  };

  // =============================================
  // GET TEACHER WORKLOAD
  // =============================================
  getTeacherWorkload = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { teacherId } = req.query;

      let query = supabaseAdmin
        .from('teacher_subjects')
        .select(`
          *,
          subjects!subject_id(id, name, code, weekly_periods),
          classes!class_id(id, name),
          arms:class_arms!arm_id(id, name)
        `)
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (teacherId) query = query.eq('teacher_id', teacherId);

      const { data, error } = await query;
      if (error) throw error;

      const totalSubjects = data?.length || 0;
      const totalWeeklyPeriods = data?.reduce((sum, item) => sum + (item.subjects?.weekly_periods || 0), 0) || 0;
      const uniqueClasses = new Set(data?.map(item => item.class_id)).size || 0;

      const workload = {
        total_subjects: totalSubjects,
        total_weekly_periods: totalWeeklyPeriods,
        total_classes: uniqueClasses,
        assignments: data || []
      };

      res.status(200).json({ status: 'success', data: workload });
    } catch (error) {
      console.error('Get Teacher Workload Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get teacher workload', error: error.message });
    }
  };
}

module.exports = new SubjectController();