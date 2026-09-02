const { supabaseAdmin } = require('../config/supabase');
const studentNotificationService = require('../services/studentNotificationService');


class StudentController {
  // =============================================
  // GET ALL STUDENTS
  // =============================================
  async getStudents(req, res) {
    try {
      const { schoolId } = req.params;
      const { classId, search, limit = 100, offset = 0 } = req.query;

      let query = supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(name, level),
          parents:student_parents(
            parents!parent_id(first_name, last_name, email, phone)
          )
        `)
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('last_name', { ascending: true });

      if (classId) {
        query = query.eq('class_id', classId);
      }

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_number.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: count
        }
      });
    } catch (error) {
      console.error('Get Students Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch students',
        error: error.message
      });
    }
  }

  // =============================================
  // GET STUDENT BY ID
  // =============================================
  async getStudentById(req, res) {
    try {
      const { schoolId, studentId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          classes!class_id(name, level),
          parents:student_parents(
            parents!parent_id(first_name, last_name, email, phone, relationship)
          ),
          invoices!invoices_student_id_fkey(id, total_amount, status, due_date),
          attendance!attendance_student_id_fkey(id, date, status)
        `)
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      console.error('Get Student Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch student',
        error: error.message
      });
    }
  }

  // =============================================
  // CREATE STUDENT
  // =============================================
  async createStudent(req, res) {
    try {
      const { schoolId } = req.params;
      const {
        firstName,
        lastName,
        middleName,
        dateOfBirth,
        gender,
        admissionNumber,
        classId,
        email,
        phone,
        address,
        emergencyContact,
        medicalInfo,
        parentIds
      } = req.body;
      const { adminId } = req.user;

      // Validation
      if (!firstName || !lastName || !dateOfBirth || !gender) {
        return res.status(400).json({
          status: 'error',
          message: 'First name, last name, date of birth, and gender are required'
        });
      }

      // Generate admission number if not provided
      let admissionNumberFinal = admissionNumber;
      if (!admissionNumberFinal) {
        const year = new Date().getFullYear();
        const { count } = await supabaseAdmin
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', schoolId);

        const sequence = String((count || 0) + 1).padStart(4, '0');
        admissionNumberFinal = `${year}-${sequence}`;
      }

      // Create student
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .insert({
          school_id: schoolId,
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName || '',
          date_of_birth: dateOfBirth,
          gender: gender,
          admission_number: admissionNumberFinal,
          class_id: classId || null,
          email: email || '',
          phone: phone || '',
          address: address || '',
          emergency_contact: emergencyContact || {},
          medical_info: medicalInfo || {},
          is_active: true,
          enrollment_date: new Date(),
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (studentError) throw studentError;

      // Link parents
      if (parentIds && parentIds.length > 0) {
        const parentLinks = parentIds.map(parentId => ({
          student_id: student.id,
          parent_id: parentId,
          is_primary_contact: true,
          created_at: new Date()
        }));

        await supabaseAdmin
          .from('student_parents')
          .insert(parentLinks);

        const { data: school } = await supabaseAdmin
          .from('schools')
          .select('name')
          .eq('id', schoolId)
          .single();

        await studentNotificationService.notifyStudentAdmitted({
          schoolId,
          school,
          student,
          adminName: req.user?.fullName || 'School Administrator'
        });
      }

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'CREATE_STUDENT',
          entity_type: 'student',
          entity_id: student.id,
          new_values: { firstName, lastName, admission_number: admissionNumberFinal }
        });

      res.status(201).json({
        status: 'success',
        message: 'Student created successfully',
        data: student
      });
    } catch (error) {
      console.error('Create Student Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create student',
        error: error.message
      });
    }
  }

  // =============================================
  // UPDATE STUDENT
  // =============================================
  async updateStudent(req, res) {
    try {
      const { schoolId, studentId } = req.params;
      const {
        firstName,
        lastName,
        middleName,
        dateOfBirth,
        gender,
        admissionNumber,
        classId,
        email,
        phone,
        address,
        emergencyContact,
        medicalInfo,
        isActive
      } = req.body;
      const { adminId } = req.user;

      const updateData = {};
      if (firstName !== undefined) updateData.first_name = firstName;
      if (lastName !== undefined) updateData.last_name = lastName;
      if (middleName !== undefined) updateData.middle_name = middleName;
      if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth;
      if (gender !== undefined) updateData.gender = gender;
      if (admissionNumber !== undefined) updateData.admission_number = admissionNumber;
      if (classId !== undefined) updateData.class_id = classId;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (emergencyContact !== undefined) updateData.emergency_contact = emergencyContact;
      if (medicalInfo !== undefined) updateData.medical_info = medicalInfo;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      // After student is updated
try {
  const { data: school } = await supabaseAdmin
    .from('schools')
    .select('name')
    .eq('id', schoolId)
    .single();

  const changedFields = Object.keys(mappedData).join(', ');

  await studentNotificationService.notifyProfileUpdated({
    schoolId,
    school,
    student,
    changes: `Updated fields: ${changedFields}`
  });
} catch (notifError) {
  console.error('Send profile update notification error:', notifError);
}
      const { data: student, error } = await supabaseAdmin
        .from('students')
        .update(updateData)
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'UPDATE_STUDENT',
          entity_type: 'student',
          entity_id: studentId,
          new_values: updateData
        });

      res.status(200).json({
        status: 'success',
        message: 'Student updated successfully',
        data: student
      });
    } catch (error) {
      console.error('Update Student Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update student',
        error: error.message
      });
    }
  }

  // =============================================
  // DELETE STUDENT
  // =============================================
  async deleteStudent(req, res) {
    try {
      const { schoolId, studentId } = req.params;
      const { adminId } = req.user;

      await supabaseAdmin
        .from('students')
        .update({ is_active: false, updated_at: new Date() })
        .eq('id', studentId)
        .eq('school_id', schoolId);

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'DELETE_STUDENT',
          entity_type: 'student',
          entity_id: studentId
        });

      res.status(200).json({
        status: 'success',
        message: 'Student deleted successfully'
      });
    } catch (error) {
      console.error('Delete Student Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete student',
        error: error.message
      });
    }
  }

  // =============================================
  // BULK IMPORT STUDENTS (V2 - Placeholder)
  // =============================================
  async bulkImportStudents(req, res) {
    try {
      res.status(200).json({
        status: 'success',
        message: 'Bulk import feature coming soon in V2',
        data: null
      });
    } catch (error) {
      console.error('Bulk Import Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to import students',
        error: error.message
      });
    }
  }
}

module.exports = new StudentController();