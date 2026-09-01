const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');
class StaffController {
  // =============================================
  // GET ALL STAFF
  // =============================================
  async getStaff(req, res) {
    try {
      const { schoolId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('staff')
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
      console.error('Get Staff Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch staff',
        error: error.message
      });
    }
  }

  // =============================================
  // CREATE STAFF
  // =============================================
  async createStaff(req, res) {
    try {
      const { schoolId } = req.params;
      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        position,
        department
      } = req.body;
      const { adminId } = req.user;

      if (!email || !password || !firstName || !lastName || !position) {
        return res.status(400).json({
          status: 'error',
          message: 'Email, password, first name, last name, and position are required'
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
          role: 'staff',
          school_id: schoolId,
          is_active: true,
          is_verified: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create staff record
      const { data: staff, error: staffError } = await supabaseAdmin
        .from('staff')
        .insert({
          user_id: user.id,
          school_id: schoolId,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone || '',
          position: position,
          department: department || '',
          employee_number: `STF-${Date.now()}`,
          is_active: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (staffError) throw staffError;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'CREATE_STAFF',
          entity_type: 'staff',
          entity_id: staff.id,
          new_values: { email, firstName, lastName, position }
        });

      res.status(201).json({
        status: 'success',
        message: 'Staff created successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role
          },
          staff,
          temp_password: password
        }
      });
    } catch (error) {
      console.error('Create Staff Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create staff',
        error: error.message
      });
    }
  }

  // =============================================
  // UPDATE STAFF
  // =============================================
  async updateStaff(req, res) {
    try {
      const { schoolId, staffId } = req.params;
      const { firstName, lastName, phone, position, department, isActive } = req.body;
      const { adminId } = req.user;

      const updateData = {};
      if (firstName !== undefined) updateData.first_name = firstName;
      if (lastName !== undefined) updateData.last_name = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (position !== undefined) updateData.position = position;
      if (department !== undefined) updateData.department = department;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date();

      const { data: staff, error } = await supabaseAdmin
        .from('staff')
        .update(updateData)
        .eq('id', staffId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      // Update user full_name
      if (firstName || lastName) {
        const fullName = `${staff.first_name} ${staff.last_name}`;
        await supabaseAdmin
          .from('users')
          .update({ full_name: fullName })
          .eq('id', staff.user_id);
      }

      res.status(200).json({
        status: 'success',
        message: 'Staff updated successfully',
        data: staff
      });
    } catch (error) {
      console.error('Update Staff Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update staff',
        error: error.message
      });
    }
  }

  // =============================================
  // DELETE STAFF
  // =============================================
  async deleteStaff(req, res) {
    try {
      const { schoolId, staffId } = req.params;
      const { adminId } = req.user;

      const { data: staff } = await supabaseAdmin
        .from('staff')
        .select('user_id')
        .eq('id', staffId)
        .eq('school_id', schoolId)
        .single();

      await supabaseAdmin
        .from('staff')
        .update({ is_active: false })
        .eq('id', staffId)
        .eq('school_id', schoolId);

      await supabaseAdmin
        .from('users')
        .update({ is_active: false })
        .eq('id', staff.user_id);

      res.status(200).json({
        status: 'success',
        message: 'Staff deleted successfully'
      });
    } catch (error) {
      console.error('Delete Staff Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete staff',
        error: error.message
      });
    }
  }
}

module.exports = new StaffController();