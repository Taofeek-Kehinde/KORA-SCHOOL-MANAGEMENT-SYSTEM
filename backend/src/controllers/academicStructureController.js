const { supabaseAdmin } = require('../config/supabase');

class AcademicStructureController {
  // =============================================
  // SESSIONS
  // =============================================
  getSessions = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { data, error } = await supabaseAdmin
        .from('academic_sessions')
        .select('*')
        .eq('school_id', schoolId)
        .order('start_date', { ascending: false });
      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Sessions Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get sessions', error: error.message });
    }
  };

  createSession = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { name, startDate, endDate, status, isCurrent } = req.body;

      if (!name || !startDate || !endDate) {
        return res.status(400).json({ status: 'error', message: 'Name, start date, and end date are required' });
      }

      if (isCurrent) {
        await supabaseAdmin
          .from('academic_sessions')
          .update({ is_current: false })
          .eq('school_id', schoolId);
      }

      const { data, error } = await supabaseAdmin
        .from('academic_sessions')
        .insert({
          school_id: schoolId,
          name,
          start_date: startDate,
          end_date: endDate,
          status: status || 'upcoming',
          is_current: isCurrent || false,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ status: 'success', message: 'Session created successfully', data });
    } catch (error) {
      console.error('Create Session Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create session', error: error.message });
    }
  };

  updateSession = async (req, res) => {
    try {
      const { schoolId, sessionId } = req.params;
      const { name, startDate, endDate, status, isCurrent } = req.body;

      if (isCurrent) {
        await supabaseAdmin
          .from('academic_sessions')
          .update({ is_current: false })
          .eq('school_id', schoolId)
          .neq('id', sessionId);
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (startDate !== undefined) updateData.start_date = startDate;
      if (endDate !== undefined) updateData.end_date = endDate;
      if (status !== undefined) updateData.status = status;
      if (isCurrent !== undefined) updateData.is_current = isCurrent;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('academic_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', message: 'Session updated successfully', data });
    } catch (error) {
      console.error('Update Session Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update session', error: error.message });
    }
  };

  deleteSession = async (req, res) => {
    try {
      const { schoolId, sessionId } = req.params;
      const { error } = await supabaseAdmin
        .from('academic_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('school_id', schoolId);
      if (error) throw error;
      res.status(200).json({ status: 'success', message: 'Session deleted successfully' });
    } catch (error) {
      console.error('Delete Session Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete session', error: error.message });
    }
  };

  // =============================================
  // TERMS
  // =============================================
  getTerms = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { sessionId } = req.query;

      let query = supabaseAdmin
        .from('academic_terms')
        .select('*')
        .eq('school_id', schoolId);

      if (sessionId) query = query.eq('session_id', sessionId);

      const { data, error } = await query
        .order('opening_date', { ascending: true });

      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Terms Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get terms', error: error.message });
    }
  };

  createTerm = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { sessionId, name, openingDate, closingDate, midTermBreakStart, midTermBreakEnd, examinationStart, examinationEnd, isCurrent } = req.body;

      if (!sessionId || !name) {
        return res.status(400).json({ status: 'error', message: 'Session ID and term name are required' });
      }

      if (isCurrent) {
        await supabaseAdmin
          .from('academic_terms')
          .update({ is_current: false })
          .eq('school_id', schoolId);
      }

      const { data, error } = await supabaseAdmin
        .from('academic_terms')
        .insert({
          school_id: schoolId,
          session_id: sessionId,
          name,
          opening_date: openingDate || null,
          closing_date: closingDate || null,
          mid_term_break_start: midTermBreakStart || null,
          mid_term_break_end: midTermBreakEnd || null,
          examination_start: examinationStart || null,
          examination_end: examinationEnd || null,
          is_current: isCurrent || false,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ status: 'success', message: 'Term created successfully', data });
    } catch (error) {
      console.error('Create Term Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create term', error: error.message });
    }
  };

  updateTerm = async (req, res) => {
    try {
      const { schoolId, termId } = req.params;
      const { name, openingDate, closingDate, midTermBreakStart, midTermBreakEnd, examinationStart, examinationEnd, isCurrent } = req.body;

      if (isCurrent) {
        await supabaseAdmin
          .from('academic_terms')
          .update({ is_current: false })
          .eq('school_id', schoolId)
          .neq('id', termId);
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (openingDate !== undefined) updateData.opening_date = openingDate;
      if (closingDate !== undefined) updateData.closing_date = closingDate;
      if (midTermBreakStart !== undefined) updateData.mid_term_break_start = midTermBreakStart;
      if (midTermBreakEnd !== undefined) updateData.mid_term_break_end = midTermBreakEnd;
      if (examinationStart !== undefined) updateData.examination_start = examinationStart;
      if (examinationEnd !== undefined) updateData.examination_end = examinationEnd;
      if (isCurrent !== undefined) updateData.is_current = isCurrent;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('academic_terms')
        .update(updateData)
        .eq('id', termId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', message: 'Term updated successfully', data });
    } catch (error) {
      console.error('Update Term Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update term', error: error.message });
    }
  };

  deleteTerm = async (req, res) => {
    try {
      const { schoolId, termId } = req.params;
      const { error } = await supabaseAdmin
        .from('academic_terms')
        .delete()
        .eq('id', termId)
        .eq('school_id', schoolId);
      if (error) throw error;
      res.status(200).json({ status: 'success', message: 'Term deleted successfully' });
    } catch (error) {
      console.error('Delete Term Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete term', error: error.message });
    }
  };

  // =============================================
  // DEPARTMENTS
  // =============================================
  getDepartments = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { data, error } = await supabaseAdmin
        .from('departments')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Departments Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get departments', error: error.message });
    }
  };

  createDepartment = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { name, headOfDepartmentId, description } = req.body;

      if (!name) {
        return res.status(400).json({ status: 'error', message: 'Department name is required' });
      }

      const { data, error } = await supabaseAdmin
        .from('departments')
        .insert({
          school_id: schoolId,
          name,
          head_of_department_id: headOfDepartmentId || null,
          description: description || '',
          is_active: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ status: 'success', message: 'Department created successfully', data });
    } catch (error) {
      console.error('Create Department Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create department', error: error.message });
    }
  };

  updateDepartment = async (req, res) => {
    try {
      const { schoolId, departmentId } = req.params;
      const { name, headOfDepartmentId, description, isActive } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (headOfDepartmentId !== undefined) updateData.head_of_department_id = headOfDepartmentId;
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('departments')
        .update(updateData)
        .eq('id', departmentId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', message: 'Department updated successfully', data });
    } catch (error) {
      console.error('Update Department Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update department', error: error.message });
    }
  };

  deleteDepartment = async (req, res) => {
    try {
      const { schoolId, departmentId } = req.params;
      const { error } = await supabaseAdmin
        .from('departments')
        .delete()
        .eq('id', departmentId)
        .eq('school_id', schoolId);
      if (error) throw error;
      res.status(200).json({ status: 'success', message: 'Department deleted successfully' });
    } catch (error) {
      console.error('Delete Department Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete department', error: error.message });
    }
  };

  // =============================================
  // CLASSES
  // =============================================
  getClasses = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { data, error } = await supabaseAdmin
        .from('classes')
        .select(`
          *,
          departments!department_id(id, name),
          teachers!class_teacher_id(id, first_name, last_name)
        `)
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('level', { ascending: true });
      if (error) throw error;

      const classesWithCounts = await Promise.all((data || []).map(async (cls) => {
        const { count } = await supabaseAdmin
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', cls.id)
          .eq('is_active', true);
        return { ...cls, student_count: count || 0 };
      }));

      res.status(200).json({ status: 'success', data: classesWithCounts || [] });
    } catch (error) {
      console.error('Get Classes Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get classes', error: error.message });
    }
  };

  createClass = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { name, level, departmentId, capacity, classTeacherId } = req.body;

      if (!name || !level) {
        return res.status(400).json({ status: 'error', message: 'Class name and level are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('classes')
        .insert({
          school_id: schoolId,
          name,
          level,
          department_id: departmentId || null,
          capacity: capacity || 50,
          class_teacher_id: classTeacherId || null,
          is_active: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ status: 'success', message: 'Class created successfully', data });
    } catch (error) {
      console.error('Create Class Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create class', error: error.message });
    }
  };

  updateClass = async (req, res) => {
    try {
      const { schoolId, classId } = req.params;
      const { name, level, departmentId, capacity, classTeacherId, isActive } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (level !== undefined) updateData.level = level;
      if (departmentId !== undefined) updateData.department_id = departmentId;
      if (capacity !== undefined) updateData.capacity = capacity;
      if (classTeacherId !== undefined) updateData.class_teacher_id = classTeacherId;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('classes')
        .update(updateData)
        .eq('id', classId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', message: 'Class updated successfully', data });
    } catch (error) {
      console.error('Update Class Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update class', error: error.message });
    }
  };

  deleteClass = async (req, res) => {
    try {
      const { schoolId, classId } = req.params;
      const { error } = await supabaseAdmin
        .from('classes')
        .delete()
        .eq('id', classId)
        .eq('school_id', schoolId);
      if (error) throw error;
      res.status(200).json({ status: 'success', message: 'Class deleted successfully' });
    } catch (error) {
      console.error('Delete Class Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete class', error: error.message });
    }
  };

  // =============================================
  // CLASS ARMS
  // =============================================
// =============================================
// GET CLASS ARMS
// =============================================
getClassArms = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { classId } = req.query;

    // Get class arms first
    let query = supabaseAdmin
      .from('class_arms')
      .select('*')
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (classId) query = query.eq('class_id', classId);

    const { data: arms, error: armsError } = await query.order('name', { ascending: true });
    if (armsError) throw armsError;

    // Get classes separately
    const classIds = [...new Set(arms?.map(a => a.class_id).filter(Boolean))];
    let classMap = {};
    if (classIds.length > 0) {
      const { data: classes } = await supabaseAdmin
        .from('classes')
        .select('id, name, level')
        .in('id', classIds);
      classes?.forEach(c => { classMap[c.id] = c; });
    }

    // Get teachers separately
    const teacherIds = [...new Set(arms?.map(a => a.class_teacher_id).filter(Boolean))];
    let teacherMap = {};
    if (teacherIds.length > 0) {
      const { data: teachers } = await supabaseAdmin
        .from('teachers')
        .select('id, first_name, last_name')
        .in('id', teacherIds);
      teachers?.forEach(t => { teacherMap[t.id] = t; });
    }

    // Combine data
    const result = (arms || []).map(arm => ({
      ...arm,
      classes: classMap[arm.class_id] || null,
      teachers: teacherMap[arm.class_teacher_id] || null
    }));

    res.status(200).json({ status: 'success', data: result || [] });
  } catch (error) {
    console.error('Get Class Arms Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get class arms', error: error.message });
  }
};
  createClassArm = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { classId, name, capacity, classTeacherId } = req.body;

      if (!classId || !name) {
        return res.status(400).json({ status: 'error', message: 'Class ID and arm name are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('class_arms')
        .insert({
          school_id: schoolId,
          class_id: classId,
          name,
          capacity: capacity || 40,
          class_teacher_id: classTeacherId || null,
          is_active: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ status: 'success', message: 'Class arm created successfully', data });
    } catch (error) {
      console.error('Create Class Arm Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create class arm', error: error.message });
    }
  };

  updateClassArm = async (req, res) => {
    try {
      const { schoolId, armId } = req.params;
      const { name, capacity, classTeacherId, isActive } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (capacity !== undefined) updateData.capacity = capacity;
      if (classTeacherId !== undefined) updateData.class_teacher_id = classTeacherId;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('class_arms')
        .update(updateData)
        .eq('id', armId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', message: 'Class arm updated successfully', data });
    } catch (error) {
      console.error('Update Class Arm Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update class arm', error: error.message });
    }
  };

  deleteClassArm = async (req, res) => {
    try {
      const { schoolId, armId } = req.params;
      const { error } = await supabaseAdmin
        .from('class_arms')
        .delete()
        .eq('id', armId)
        .eq('school_id', schoolId);
      if (error) throw error;
      res.status(200).json({ status: 'success', message: 'Class arm deleted successfully' });
    } catch (error) {
      console.error('Delete Class Arm Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete class arm', error: error.message });
    }
  };
}

module.exports = new AcademicStructureController();