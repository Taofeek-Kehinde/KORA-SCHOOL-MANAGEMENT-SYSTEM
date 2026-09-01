const { supabaseAdmin } = require('../config/supabase');

class AcademicController {
  // =============================================
  // ACADEMIC SESSION MANAGEMENT
  // =============================================

  // Get academic sessions
  async getSessions(req, res) {
    try {
      const { schoolId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('academic_sessions')
        .select('*')
        .eq('school_id', schoolId)
        .order('start_date', { ascending: false });

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || []
      });
    } catch (error) {
      console.error('Get Sessions Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch academic sessions',
        error: error.message
      });
    }
  }

  // =============================================
// CREATE ACADEMIC SESSION - FIXED
// =============================================
async createSession(req, res) {
  try {
    const { schoolId } = req.params;
    const { name, startDate, endDate, isCurrent } = req.body;
    
    console.log('=== CREATE SESSION ===');
    console.log('School ID:', schoolId);
    console.log('Body:', req.body);
    console.log('User:', req.user);

    // Get admin ID from user
    const adminId = req.user?.id;
    if (!adminId) {
      console.error('No admin ID found in request');
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Name, start date, and end date are required'
      });
    }

    // If setting as current, unset other current sessions
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
        is_current: isCurrent || false,
        is_active: true,
        created_by: adminId,
        created_at: new Date()
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }

    // Update school's academic session
    if (isCurrent) {
      await supabaseAdmin
        .from('schools')
        .update({
          academic_session: name,
          updated_at: new Date()
        })
        .eq('id', schoolId);
    }

    console.log('Session created:', data);

    res.status(201).json({
      status: 'success',
      message: 'Academic session created successfully',
      data
    });
  } catch (error) {
    console.error('Create Session Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create academic session',
      error: error.message
    });
  }
}
  // Update academic session
  async updateSession(req, res) {
    try {
      const { schoolId, sessionId } = req.params;
      const {
        name,
        startDate,
        endDate,
        isCurrent,
        isActive
      } = req.body;
      const { adminId } = req.user;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (startDate !== undefined) updateData.start_date = startDate;
      if (endDate !== undefined) updateData.end_date = endDate;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      // If setting as current, unset other current sessions
      if (isCurrent) {
        await supabaseAdmin
          .from('academic_sessions')
          .update({ is_current: false })
          .eq('school_id', schoolId)
          .neq('id', sessionId);
        updateData.is_current = true;
      } else if (isCurrent === false) {
        updateData.is_current = false;
      }

      const { data, error } = await supabaseAdmin
        .from('academic_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      // Update school's academic session if current
      if (isCurrent && name) {
        await supabaseAdmin
          .from('schools')
          .update({
            academic_session: name,
            updated_at: new Date()
          })
          .eq('id', schoolId);
      }

      res.status(200).json({
        status: 'success',
        message: 'Academic session updated successfully',
        data
      });
    } catch (error) {
      console.error('Update Session Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update academic session',
        error: error.message
      });
    }
  }

  // Delete academic session
  async deleteSession(req, res) {
    try {
      const { schoolId, sessionId } = req.params;
      const { adminId } = req.user;

      const { error } = await supabaseAdmin
        .from('academic_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('school_id', schoolId);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'Academic session deleted successfully'
      });
    } catch (error) {
      console.error('Delete Session Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete academic session',
        error: error.message
      });
    }
  }

  // =============================================
  // TERMS MANAGEMENT
  // =============================================

  // =============================================
// GET TERMS - FIXED
// =============================================
async getTerms(req, res) {
  try {
    const { schoolId } = req.params;
    const { sessionId } = req.query;

    let query = supabaseAdmin
      .from('terms')
      .select('*')
      .eq('school_id', schoolId);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    // Try ordering by 'order' column, fallback to 'created_at'
    const { data, error } = await query
      .order('order', { ascending: true, nullsLast: true });

    if (error) {
      // If 'order' column doesn't exist, order by name
      const { data: fallbackData, error: fallbackError } = await query
        .order('name', { ascending: true });

      if (fallbackError) throw fallbackError;
      
      return res.status(200).json({
        status: 'success',
        data: fallbackData || []
      });
    }

    res.status(200).json({
      status: 'success',
      data: data || []
    });
  } catch (error) {
    console.error('Get Terms Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch terms',
      error: error.message
    });
  }
}

// =============================================
// GET TEACHERS (For dropdown in modals)
// =============================================
async getTeachers(req, res) {
  try {
    const { schoolId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('teachers')
      .select('id, first_name, last_name, email')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('first_name', { ascending: true });

    if (error) throw error;

    res.status(200).json({
      status: 'success',
      data: data || []
    });
  } catch (error) {
    console.error('Get Teachers Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch teachers',
      error: error.message
    });
  }
}

  // =============================================
// CREATE TERM - FIXED
// =============================================
async createTerm(req, res) {
  try {
    const { schoolId } = req.params;
    const { sessionId, name, order, startDate, endDate, isCurrent } = req.body;
    
    console.log('=== CREATE TERM ===');
    console.log('School ID:', schoolId);
    console.log('Body:', req.body);
    console.log('User:', req.user);

    const adminId = req.user?.id;
    if (!adminId) {
      console.error('No admin ID found in request');
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    if (!name || !sessionId) {
      return res.status(400).json({
        status: 'error',
        message: 'Name and session ID are required'
      });
    }

    // If setting as current, unset other current terms
    if (isCurrent) {
      await supabaseAdmin
        .from('terms')
        .update({ is_current: false })
        .eq('school_id', schoolId);
    }

    const { data, error } = await supabaseAdmin
      .from('terms')
      .insert({
        school_id: schoolId,
        session_id: sessionId,
        name,
        order: order || 0,
        start_date: startDate || null,
        end_date: endDate || null,
        is_current: isCurrent || false,
        is_active: true,
        created_by: adminId,
        created_at: new Date()
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }

    // Update school's current term
    if (isCurrent) {
      await supabaseAdmin
        .from('schools')
        .update({
          current_term: name,
          updated_at: new Date()
        })
        .eq('id', schoolId);
    }

    console.log('Term created:', data);

    res.status(201).json({
      status: 'success',
      message: 'Term created successfully',
      data
    });
  } catch (error) {
    console.error('Create Term Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create term',
      error: error.message
    });
  }
}

  // Update term
  async updateTerm(req, res) {
    try {
      const { schoolId, termId } = req.params;
      const {
        name,
        order,
        startDate,
        endDate,
        isCurrent,
        isActive
      } = req.body;
      const { adminId } = req.user;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (order !== undefined) updateData.order = order;
      if (startDate !== undefined) updateData.start_date = startDate;
      if (endDate !== undefined) updateData.end_date = endDate;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      if (isCurrent) {
        await supabaseAdmin
          .from('terms')
          .update({ is_current: false })
          .eq('school_id', schoolId)
          .neq('id', termId);
        updateData.is_current = true;
      } else if (isCurrent === false) {
        updateData.is_current = false;
      }

      const { data, error } = await supabaseAdmin
        .from('terms')
        .update(updateData)
        .eq('id', termId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      if (isCurrent && name) {
        await supabaseAdmin
          .from('schools')
          .update({
            current_term: name,
            updated_at: new Date()
          })
          .eq('id', schoolId);
      }

      res.status(200).json({
        status: 'success',
        message: 'Term updated successfully',
        data
      });
    } catch (error) {
      console.error('Update Term Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update term',
        error: error.message
      });
    }
  }

  // Delete term
  async deleteTerm(req, res) {
    try {
      const { schoolId, termId } = req.params;
      const { adminId } = req.user;

      const { error } = await supabaseAdmin
        .from('terms')
        .delete()
        .eq('id', termId)
        .eq('school_id', schoolId);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'Term deleted successfully'
      });
    } catch (error) {
      console.error('Delete Term Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete term',
        error: error.message
      });
    }
  }

  // =============================================
  // CLASSES MANAGEMENT
  // =============================================

  // Get classes
  async getClasses(req, res) {
    try {
      const { schoolId } = req.params;
      const { activeOnly = 'true' } = req.query;

      let query = supabaseAdmin
        .from('classes')
        .select(`
          *,
          teachers!class_teacher_id(id, first_name, last_name, email)
        `)
        .eq('school_id', schoolId);

      if (activeOnly === 'true') {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query
        .order('level', { ascending: true });

      if (error) throw error;

      // Get student count for each class
      const classesWithCounts = await Promise.all((data || []).map(async (cls) => {
        const { count, error: countError } = await supabaseAdmin
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', cls.id)
          .eq('is_active', true);

        return {
          ...cls,
          student_count: count || 0
        };
      }));

      res.status(200).json({
        status: 'success',
        data: classesWithCounts
      });
    } catch (error) {
      console.error('Get Classes Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch classes',
        error: error.message
      });
    }
  }

  // Create class
  async createClass(req, res) {
    try {
      const { schoolId } = req.params;
      const {
        name,
        level,
        classTeacherId,
        capacity,
        campusId
      } = req.body;
      const { adminId } = req.user;

      if (!name || !level) {
        return res.status(400).json({
          status: 'error',
          message: 'Name and level are required'
        });
      }

      // Check if class already exists
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('classes')
        .select('id')
        .eq('school_id', schoolId)
        .eq('name', name)
        .single();

      if (existing) {
        return res.status(400).json({
          status: 'error',
          message: 'Class with this name already exists'
        });
      }

      const { data, error } = await supabaseAdmin
        .from('classes')
        .insert({
          school_id: schoolId,
          name,
          level,
          class_teacher_id: classTeacherId || null,
          capacity: capacity || 50,
          campus_id: campusId || null,
          is_active: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        status: 'success',
        message: 'Class created successfully',
        data
      });
    } catch (error) {
      console.error('Create Class Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create class',
        error: error.message
      });
    }
  }

  // Update class
  async updateClass(req, res) {
    try {
      const { schoolId, classId } = req.params;
      const {
        name,
        level,
        classTeacherId,
        capacity,
        campusId,
        isActive
      } = req.body;
      const { adminId } = req.user;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (level !== undefined) updateData.level = level;
      if (classTeacherId !== undefined) updateData.class_teacher_id = classTeacherId;
      if (capacity !== undefined) updateData.capacity = capacity;
      if (campusId !== undefined) updateData.campus_id = campusId;
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

      res.status(200).json({
        status: 'success',
        message: 'Class updated successfully',
        data
      });
    } catch (error) {
      console.error('Update Class Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update class',
        error: error.message
      });
    }
  }

  // Delete class
  async deleteClass(req, res) {
    try {
      const { schoolId, classId } = req.params;
      const { adminId } = req.user;

      // Check if class has students
      const { count: studentCount, error: countError } = await supabaseAdmin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', classId)
        .eq('is_active', true);

      if (countError) throw countError;

      if (studentCount > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Cannot delete class. ${studentCount} students are assigned to this class.`
        });
      }

      const { error } = await supabaseAdmin
        .from('classes')
        .delete()
        .eq('id', classId)
        .eq('school_id', schoolId);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'Class deleted successfully'
      });
    } catch (error) {
      console.error('Delete Class Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete class',
        error: error.message
      });
    }
  }

  // =============================================
  // SUBJECTS MANAGEMENT
  // =============================================

  // Get subjects
  async getSubjects(req, res) {
    try {
      const { schoolId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('subjects')
        .select('*')
        .eq('school_id', schoolId)
        .order('name', { ascending: true });

      if (error) throw error;

      // Get class count for each subject
      const subjectsWithCounts = await Promise.all((data || []).map(async (subject) => {
        const { count, error: countError } = await supabaseAdmin
          .from('class_subjects')
          .select('class_id', { count: 'exact', head: true })
          .eq('subject_id', subject.id);

        return {
          ...subject,
          class_count: count || 0
        };
      }));

      res.status(200).json({
        status: 'success',
        data: subjectsWithCounts
      });
    } catch (error) {
      console.error('Get Subjects Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch subjects',
        error: error.message
      });
    }
  }

  // Create subject
  async createSubject(req, res) {
    try {
      const { schoolId } = req.params;
      const {
        name,
        code,
        description,
        isCore,
        isElective
      } = req.body;
      const { adminId } = req.user;

      if (!name) {
        return res.status(400).json({
          status: 'error',
          message: 'Subject name is required'
        });
      }

      // Generate code if not provided
      let subjectCode = code;
      if (!subjectCode) {
        subjectCode = name.substring(0, 3).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
      }

      const { data, error } = await supabaseAdmin
        .from('subjects')
        .insert({
          school_id: schoolId,
          name,
          code: subjectCode,
          description: description || '',
          is_core: isCore || false,
          is_elective: isElective || false,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

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
  }

  // Update subject
  async updateSubject(req, res) {
    try {
      const { schoolId, subjectId } = req.params;
      const {
        name,
        code,
        description,
        isCore,
        isElective
      } = req.body;
      const { adminId } = req.user;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (code !== undefined) updateData.code = code;
      if (description !== undefined) updateData.description = description;
      if (isCore !== undefined) updateData.is_core = isCore;
      if (isElective !== undefined) updateData.is_elective = isElective;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('subjects')
        .update(updateData)
        .eq('id', subjectId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

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
  }

  // Delete subject
  async deleteSubject(req, res) {
    try {
      const { schoolId, subjectId } = req.params;
      const { adminId } = req.user;

      // Check if subject is assigned to classes
      const { count: classCount, error: countError } = await supabaseAdmin
        .from('class_subjects')
        .select('class_id', { count: 'exact', head: true })
        .eq('subject_id', subjectId);

      if (countError) throw countError;

      if (classCount > 0) {
        return res.status(400).json({
          status: 'error',
          message: `Cannot delete subject. It is assigned to ${classCount} classes.`
        });
      }

      const { error } = await supabaseAdmin
        .from('subjects')
        .delete()
        .eq('id', subjectId)
        .eq('school_id', schoolId);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'Subject deleted successfully'
      });
    } catch (error) {
      console.error('Delete Subject Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete subject',
        error: error.message
      });
    }
  }

  // Assign subject to class
  async assignSubjectToClass(req, res) {
    try {
      const { schoolId } = req.params;
      const {
        classId,
        subjectId,
        teacherId,
        isCompulsory
      } = req.body;
      const { adminId } = req.user;

      if (!classId || !subjectId) {
        return res.status(400).json({
          status: 'error',
          message: 'Class ID and Subject ID are required'
        });
      }

      // Check if already assigned
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('class_subjects')
        .select('class_id, subject_id')
        .eq('class_id', classId)
        .eq('subject_id', subjectId)
        .single();

      if (existing) {
        return res.status(400).json({
          status: 'error',
          message: 'Subject is already assigned to this class'
        });
      }

      const { data, error } = await supabaseAdmin
        .from('class_subjects')
        .insert({
          class_id: classId,
          subject_id: subjectId,
          teacher_id: teacherId || null,
          is_compulsory: isCompulsory !== undefined ? isCompulsory : true,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        status: 'success',
        message: 'Subject assigned to class successfully',
        data
      });
    } catch (error) {
      console.error('Assign Subject Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to assign subject to class',
        error: error.message
      });
    }
  }

  // Remove subject from class
  async removeSubjectFromClass(req, res) {
    try {
      const { schoolId } = req.params;
      const { classId, subjectId } = req.body;
      const { adminId } = req.user;

      const { error } = await supabaseAdmin
        .from('class_subjects')
        .delete()
        .eq('class_id', classId)
        .eq('subject_id', subjectId);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'Subject removed from class successfully'
      });
    } catch (error) {
      console.error('Remove Subject Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to remove subject from class',
        error: error.message
      });
    }
  }

  // =============================================
  // DEPARTMENTS MANAGEMENT
  // =============================================

  // Get departments
  async getDepartments(req, res) {
    try {
      const { schoolId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('departments')
        .select(`
          *,
          teachers!head_of_department_id(id, first_name, last_name, email)
        `)
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || []
      });
    } catch (error) {
      console.error('Get Departments Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch departments',
        error: error.message
      });
    }
  }

  // Create department
  async createDepartment(req, res) {
    try {
      const { schoolId } = req.params;
      const {
        name,
        headOfDepartmentId,
        description
      } = req.body;
      const { adminId } = req.user;

      if (!name) {
        return res.status(400).json({
          status: 'error',
          message: 'Department name is required'
        });
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

      res.status(201).json({
        status: 'success',
        message: 'Department created successfully',
        data
      });
    } catch (error) {
      console.error('Create Department Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create department',
        error: error.message
      });
    }
  }

  // Update department
  async updateDepartment(req, res) {
    try {
      const { schoolId, departmentId } = req.params;
      const {
        name,
        headOfDepartmentId,
        description,
        isActive
      } = req.body;
      const { adminId } = req.user;

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

      res.status(200).json({
        status: 'success',
        message: 'Department updated successfully',
        data
      });
    } catch (error) {
      console.error('Update Department Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update department',
        error: error.message
      });
    }
  }

  // Delete department
  async deleteDepartment(req, res) {
    try {
      const { schoolId, departmentId } = req.params;
      const { adminId } = req.user;

      const { error } = await supabaseAdmin
        .from('departments')
        .delete()
        .eq('id', departmentId)
        .eq('school_id', schoolId);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'Department deleted successfully'
      });
    } catch (error) {
      console.error('Delete Department Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete department',
        error: error.message
      });
    }
  }

  // =============================================
  // GRADING SYSTEM
  // =============================================

  // Get grading system
  async getGradingSystem(req, res) {
    try {
      const { schoolId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('grading_systems')
        .select('*')
        .eq('school_id', schoolId)
        .order('min_score', { ascending: false });

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || []
      });
    } catch (error) {
      console.error('Get Grading System Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch grading system',
        error: error.message
      });
    }
  }

  // Create grading rule
  async createGradingRule(req, res) {
    try {
      const { schoolId } = req.params;
      const {
        grade,
        minScore,
        maxScore,
        description,
        isPass
      } = req.body;
      const { adminId } = req.user;

      if (!grade || minScore === undefined || maxScore === undefined) {
        return res.status(400).json({
          status: 'error',
          message: 'Grade, min score, and max score are required'
        });
      }

      const { data, error } = await supabaseAdmin
        .from('grading_systems')
        .insert({
          school_id: schoolId,
          grade,
          min_score: minScore,
          max_score: maxScore,
          description: description || '',
          is_pass: isPass !== undefined ? isPass : true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        status: 'success',
        message: 'Grading rule created successfully',
        data
      });
    } catch (error) {
      console.error('Create Grading Rule Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create grading rule',
        error: error.message
      });
    }
  }

  // Update grading rule
  async updateGradingRule(req, res) {
    try {
      const { schoolId, ruleId } = req.params;
      const {
        grade,
        minScore,
        maxScore,
        description,
        isPass
      } = req.body;
      const { adminId } = req.user;

      const updateData = {};
      if (grade !== undefined) updateData.grade = grade;
      if (minScore !== undefined) updateData.min_score = minScore;
      if (maxScore !== undefined) updateData.max_score = maxScore;
      if (description !== undefined) updateData.description = description;
      if (isPass !== undefined) updateData.is_pass = isPass;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('grading_systems')
        .update(updateData)
        .eq('id', ruleId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'Grading rule updated successfully',
        data
      });
    } catch (error) {
      console.error('Update Grading Rule Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update grading rule',
        error: error.message
      });
    }
  }

  // Delete grading rule
  async deleteGradingRule(req, res) {
    try {
      const { schoolId, ruleId } = req.params;
      const { adminId } = req.user;

      const { error } = await supabaseAdmin
        .from('grading_systems')
        .delete()
        .eq('id', ruleId)
        .eq('school_id', schoolId);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'Grading rule deleted successfully'
      });
    } catch (error) {
      console.error('Delete Grading Rule Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete grading rule',
        error: error.message
      });
    }
  }

  // =============================================
  // SCHOOL PROFILE - COLOURS, MOTTO, SIGNATURE, REPORT CARD
  // =============================================

  // Update school profile settings
  async updateSchoolProfile(req, res) {
    try {
      const { schoolId } = req.params;
      const {
        schoolColours,
        motto,
        signature,
        reportCardDesign
      } = req.body;
      const { adminId } = req.user;

      const updateData = {};
      if (schoolColours !== undefined) updateData.school_colours = schoolColours;
      if (motto !== undefined) updateData.motto = motto;
      if (signature !== undefined) updateData.signature_url = signature;
      if (reportCardDesign !== undefined) updateData.report_card_design = reportCardDesign;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('schools')
        .update(updateData)
        .eq('id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'School profile updated successfully',
        data
      });
    } catch (error) {
      console.error('Update School Profile Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update school profile',
        error: error.message
      });
    }
  }

  // Get school profile settings
  async getSchoolProfile(req, res) {
    try {
      const { schoolId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('schools')
        .select('school_colours, motto, signature_url, report_card_design')
        .eq('id', schoolId)
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || {}
      });
    } catch (error) {
      console.error('Get School Profile Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch school profile',
        error: error.message
      });
    }
  }
}

module.exports = new AcademicController();