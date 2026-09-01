const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');

class TeacherController {
  // =============================================
  // GET ALL TEACHERS
  // =============================================
  async getTeachers(req, res) {
    try {
      const { schoolId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('teachers')
        .select(`
          *,
          users!user_id(email, full_name, phone)
        `)
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
  // GET SINGLE TEACHER
  // =============================================
  async getTeacherById(req, res) {
    try {
      const { schoolId, teacherId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('teachers')
        .select(`
          *,
          users!user_id(email, full_name, phone)
        `)
        .eq('id', teacherId)
        .eq('school_id', schoolId)
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      console.error('Get Teacher Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch teacher',
        error: error.message
      });
    }
  }

  // =============================================
  // CREATE TEACHER
  // =============================================
  async createTeacher(req, res) {
    try {
      const { schoolId } = req.params;
      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        specialization,
        qualifications
      } = req.body;
      const { adminId } = req.user;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          status: 'error',
          message: 'Email, password, first name, and last name are required'
        });
      }

      // Check if user exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user account
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

      // Create teacher record
      const { data: teacher, error: teacherError } = await supabaseAdmin
        .from('teachers')
        .insert({
          user_id: user.id,
          school_id: schoolId,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone || '',
          specialization: specialization || '',
          qualifications: qualifications || [],
          employee_number: `TCH-${Date.now()}`,
          is_active: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (teacherError) throw teacherError;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'CREATE_TEACHER',
          entity_type: 'teacher',
          entity_id: teacher.id,
          new_values: { email, firstName, lastName }
        });

      res.status(201).json({
        status: 'success',
        message: 'Teacher created successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role
          },
          teacher,
          temp_password: password
        }
      });
    } catch (error) {
      console.error('Create Teacher Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create teacher',
        error: error.message
      });
    }
  }

  // =============================================
  // UPDATE TEACHER
  // =============================================
  async updateTeacher(req, res) {
    try {
      const { schoolId, teacherId } = req.params;
      const { firstName, lastName, phone, specialization, qualifications, isActive } = req.body;
      const { adminId } = req.user;

      const updateData = {};
      if (firstName !== undefined) updateData.first_name = firstName;
      if (lastName !== undefined) updateData.last_name = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (specialization !== undefined) updateData.specialization = specialization;
      if (qualifications !== undefined) updateData.qualifications = qualifications;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      const { data: teacher, error } = await supabaseAdmin
        .from('teachers')
        .update(updateData)
        .eq('id', teacherId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      // Update user full_name
      if (firstName || lastName) {
        const fullName = `${teacher.first_name} ${teacher.last_name}`;
        await supabaseAdmin
          .from('users')
          .update({ full_name: fullName })
          .eq('id', teacher.user_id);
      }

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'UPDATE_TEACHER',
          entity_type: 'teacher',
          entity_id: teacherId,
          new_values: updateData
        });

      res.status(200).json({
        status: 'success',
        message: 'Teacher updated successfully',
        data: teacher
      });
    } catch (error) {
      console.error('Update Teacher Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update teacher',
        error: error.message
      });
    }
  }

  // =============================================
  // DELETE TEACHER
  // =============================================
  async deleteTeacher(req, res) {
    try {
      const { schoolId, teacherId } = req.params;
      const { adminId } = req.user;

      // Get teacher
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('user_id')
        .eq('id', teacherId)
        .eq('school_id', schoolId)
        .single();

      // Soft delete teacher
      await supabaseAdmin
        .from('teachers')
        .update({ is_active: false })
        .eq('id', teacherId)
        .eq('school_id', schoolId);

      // Deactivate user
      await supabaseAdmin
        .from('users')
        .update({ is_active: false })
        .eq('id', teacher.user_id);

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'DELETE_TEACHER',
          entity_type: 'teacher',
          entity_id: teacherId
        });

      res.status(200).json({
        status: 'success',
        message: 'Teacher deleted successfully'
      });
    } catch (error) {
      console.error('Delete Teacher Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete teacher',
        error: error.message
      });
    }
  }
}

module.exports = new TeacherController();