const { supabaseAdmin } = require('../config/supabase');

class SubjectController {
  // =============================================
  // GET ALL SUBJECTS
  // =============================================
  getSubjects = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { departmentId, includeInactive } = req.query;

      console.log('=== GET SUBJECTS ===');
      console.log('School ID:', schoolId);

      let query = supabaseAdmin
        .from('subjects')
        .select('*')
        .eq('school_id', schoolId);

      if (includeInactive !== 'true') {
        query = query.eq('is_active', true);
      }

      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      const { data: subjects, error: subjectsError } = await query.order('name', { ascending: true });
      
      if (subjectsError) {
        console.error('Subjects query error:', subjectsError);
        return res.status(500).json({ 
          status: 'error', 
          message: 'Failed to fetch subjects',
          error: subjectsError.message 
        });
      }

      console.log(`Found ${subjects?.length || 0} subjects`);

      res.status(200).json({ 
        status: 'success', 
        data: subjects || [] 
      });
    } catch (error) {
      console.error('Get Subjects Error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to get subjects', 
        error: error.message 
      });
    }
  };

  // =============================================
  // CREATE SUBJECT
  // =============================================
  createSubject = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { name, code, weeklyPeriods, passMark, maxScore, departmentId, classLevel, isCore, isElective } = req.body;

      console.log('=== CREATE SUBJECT ===');
      console.log('School ID:', schoolId);

      if (!name) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Subject name is required' 
        });
      }

      const subjectCode = code || name.substring(0, 3).toUpperCase() + '-' + Math.floor(Math.random() * 1000);

      const { data, error } = await supabaseAdmin
        .from('subjects')
        .insert({
          school_id: schoolId,
          name,
          code: subjectCode,
          weekly_periods: weeklyPeriods || 4,
          pass_mark: passMark || 40,
          max_score: maxScore || 100,
          department_id: departmentId || null,
          class_level: classLevel || '',
          is_core: isCore || false,
          is_elective: isElective || false,
          is_active: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        return res.status(500).json({ 
          status: 'error', 
          message: 'Failed to create subject',
          error: error.message 
        });
      }

      res.status(201).json({ 
        status: 'success', 
        message: 'Subject created successfully', 
        data 
      });
    } catch (error) {
      console.error('Create Subject Error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to create subject', 
        error: error.message 
      });
    }
  };

  // =============================================
  // UPDATE SUBJECT
  // =============================================
  updateSubject = async (req, res) => {
    try {
      const { schoolId, subjectId } = req.params;
      const { name, code, weeklyPeriods, passMark, maxScore, departmentId, classLevel, isCore, isElective, isActive } = req.body;

      const { data: existing, error: checkError } = await supabaseAdmin
        .from('subjects')
        .select('id')
        .eq('id', subjectId)
        .eq('school_id', schoolId)
        .single();

      if (checkError) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Subject not found' 
        });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (code !== undefined) updateData.code = code;
      if (weeklyPeriods !== undefined) updateData.weekly_periods = weeklyPeriods;
      if (passMark !== undefined) updateData.pass_mark = passMark;
      if (maxScore !== undefined) updateData.max_score = maxScore;
      if (departmentId !== undefined) updateData.department_id = departmentId;
      if (classLevel !== undefined) updateData.class_level = classLevel;
      if (isCore !== undefined) updateData.is_core = isCore;
      if (isElective !== undefined) updateData.is_elective = isElective;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('subjects')
        .update(updateData)
        .eq('id', subjectId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        return res.status(500).json({ 
          status: 'error', 
          message: 'Failed to update subject',
          error: error.message 
        });
      }

      res.status(200).json({ 
        status: 'success', 
        message: 'Subject updated successfully', 
        data 
      });
    } catch (error) {
      console.error('Update Subject Error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to update subject', 
        error: error.message 
      });
    }
  };

  // =============================================
  // DELETE SUBJECT
  // =============================================
  deleteSubject = async (req, res) => {
    try {
      const { schoolId, subjectId } = req.params;

      const { data: existing, error: checkError } = await supabaseAdmin
        .from('subjects')
        .select('id, is_active')
        .eq('id', subjectId)
        .eq('school_id', schoolId)
        .single();

      if (checkError) {
        return res.status(404).json({ 
          status: 'error', 
          message: 'Subject not found' 
        });
      }

      if (!existing.is_active) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Subject is already deactivated' 
        });
      }

      const { data, error } = await supabaseAdmin
        .from('subjects')
        .update({ 
          is_active: false,
          updated_at: new Date()
        })
        .eq('id', subjectId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) {
        console.error('Delete error:', error);
        return res.status(500).json({ 
          status: 'error', 
          message: 'Failed to delete subject',
          error: error.message 
        });
      }

      res.status(200).json({ 
        status: 'success', 
        message: 'Subject deleted successfully',
        data 
      });
    } catch (error) {
      console.error('Delete Subject Error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to delete subject', 
        error: error.message 
      });
    }
  };

  // =============================================
  // ASSIGN SUBJECT TO TEACHER - WORKING
  // =============================================
  assignSubjectToTeacher = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { teacherId, subjectId, classId, armId } = req.body;

      console.log('=== ASSIGN SUBJECT TO TEACHER ===');
      console.log('School ID:', schoolId);
      console.log('Teacher ID:', teacherId);
      console.log('Subject ID:', subjectId);
      console.log('Class ID:', classId);

      if (!teacherId || !subjectId || !classId) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Teacher, subject, and class are required' 
        });
      }

      // Check if assignment already exists
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('teacher_subjects')
        .select('id')
        .eq('school_id', schoolId)
        .eq('teacher_id', teacherId)
        .eq('subject_id', subjectId)
        .eq('class_id', classId)
        .eq('is_active', true)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Check error:', checkError);
        return res.status(500).json({ 
          status: 'error', 
          message: 'Failed to check existing assignment',
          error: checkError.message 
        });
      }

      if (existing) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'This subject is already assigned to this teacher for this class' 
        });
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

      if (error) {
        console.error('Insert error:', error);
        return res.status(500).json({ 
          status: 'error', 
          message: 'Failed to assign subject',
          error: error.message 
        });
      }

      console.log('Assignment created successfully:', data);

      res.status(201).json({ 
        status: 'success', 
        message: 'Subject assigned to teacher successfully', 
        data 
      });
    } catch (error) {
      console.error('Assign Subject Error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to assign subject', 
        error: error.message 
      });
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
          subjects:subject_id (
            id, name, code, weekly_periods
          ),
          classes:class_id (
            id, name
          )
        `)
        .eq('school_id', schoolId)
        .eq('is_active', true);

      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }

      const { data: assignments, error: assignmentsError } = await query;
      
      if (assignmentsError) {
        console.error('Assignments query error:', assignmentsError);
        return res.status(500).json({ 
          status: 'error', 
          message: 'Failed to get workload',
          error: assignmentsError.message 
        });
      }

      const totalSubjects = assignments?.length || 0;
      const totalWeeklyPeriods = assignments?.reduce((sum, item) => {
        return sum + (item.subjects?.weekly_periods || 0);
      }, 0) || 0;
      const uniqueClasses = new Set(assignments?.map(item => item.class_id)).size || 0;

      res.status(200).json({ 
        status: 'success', 
        data: {
          total_subjects: totalSubjects,
          total_weekly_periods: totalWeeklyPeriods,
          total_classes: uniqueClasses,
          assignments: assignments || []
        }
      });
    } catch (error) {
      console.error('Get Teacher Workload Error:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to get teacher workload', 
        error: error.message 
      });
    }
  };
}

module.exports = new SubjectController();