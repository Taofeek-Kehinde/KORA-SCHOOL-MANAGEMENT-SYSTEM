const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');

class ParentController {
  // =============================================
  // GET ALL PARENTS
  // =============================================
  async getParents(req, res) {
    try {
      const { schoolId } = req.params;
      const { search, limit = 100, offset = 0 } = req.query;

      let query = supabaseAdmin
        .from('parents')
        .select(`
          *,
          users!user_id(email, full_name, phone),
          children:student_parents(
            students!student_id(first_name, last_name, admission_number, class_id)
          )
        `)
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('last_name', { ascending: true });

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
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
      console.error('Get Parents Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch parents',
        error: error.message
      });
    }
  }

  // =============================================
  // GET PARENT BY ID
  // =============================================
  async getParentById(req, res) {
    try {
      const { schoolId, parentId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('parents')
        .select(`
          *,
          users!user_id(email, full_name, phone),
          children:student_parents(
            students!student_id(first_name, last_name, admission_number, class_id)
          )
        `)
        .eq('id', parentId)
        .eq('school_id', schoolId)
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data
      });
    } catch (error) {
      console.error('Get Parent Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch parent',
        error: error.message
      });
    }
  }

  // =============================================
  // CREATE PARENT
  // =============================================
  async createParent(req, res) {
    try {
      const { schoolId } = req.params;
      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        relationship,
        studentIds
      } = req.body;
      const { adminId } = req.user;

      if (!email || !firstName || !lastName || !phone) {
        return res.status(400).json({
          status: 'error',
          message: 'Email, first name, last name, and phone are required'
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

      let userId = null;

      // If password provided, create user account
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: user, error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            email,
            password_hash: hashedPassword,
            full_name: `${firstName} ${lastName}`,
            phone: phone || '',
            role: 'parent',
            school_id: schoolId,
            is_active: true,
            is_verified: true,
            created_by: adminId,
            created_at: new Date()
          })
          .select()
          .single();

        if (userError) throw userError;
        userId = user.id;
      }

      // Create parent record
      const { data: parent, error: parentError } = await supabaseAdmin
        .from('parents')
        .insert({
          user_id: userId,
          school_id: schoolId,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          relationship: relationship || 'guardian',
          is_primary_contact: true,
          is_active: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (parentError) throw parentError;

      // Link parent to students
      if (studentIds && studentIds.length > 0) {
        const parentLinks = studentIds.map(studentId => ({
          student_id: studentId,
          parent_id: parent.id,
          is_primary_contact: true,
          created_at: new Date()
        }));

        await supabaseAdmin
          .from('student_parents')
          .insert(parentLinks);
      }

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: schoolId,
          user_id: adminId,
          action: 'CREATE_PARENT',
          entity_type: 'parent',
          entity_id: parent.id,
          new_values: { email, firstName, lastName }
        });

      res.status(201).json({
        status: 'success',
        message: 'Parent created successfully',
        data: {
          parent,
          has_user_account: !!userId,
          temp_password: password || null
        }
      });
    } catch (error) {
      console.error('Create Parent Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create parent',
        error: error.message
      });
    }
  }

  // =============================================
// UPDATE PARENT
// =============================================
async updateParent(req, res) {
  try {
    const { schoolId, parentId } = req.params;
    const { firstName, lastName, email, phone, relationship, isActive, studentIds } = req.body;
    const { adminId } = req.user;

    const updateData = {};
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (relationship !== undefined) updateData.relationship = relationship;
    if (isActive !== undefined) updateData.is_active = isActive;
    updateData.updated_at = new Date();

    const { data: parent, error } = await supabaseAdmin
      .from('parents')
      .update(updateData)
      .eq('id', parentId)
      .eq('school_id', schoolId)
      .select()
      .single();

    if (error) throw error;

    // Update user if exists
    if (parent.user_id) {
      await supabaseAdmin
        .from('users')
        .update({
          email: email,
          full_name: `${firstName} ${lastName}`,
          phone: phone
        })
        .eq('id', parent.user_id);
    }

    // ← ADD THIS: Update student-parent links
    if (studentIds) {
      // Remove existing links
      await supabaseAdmin
        .from('student_parents')
        .delete()
        .eq('parent_id', parentId);

      // Add new links
      if (studentIds.length > 0) {
        const parentLinks = studentIds.map(studentId => ({
          student_id: studentId,
          parent_id: parentId,
          is_primary_contact: true,
          created_at: new Date()
        }));

        await supabaseAdmin
          .from('student_parents')
          .insert(parentLinks);
      }
    }

    // Create audit log
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        school_id: schoolId,
        user_id: adminId,
        action: 'UPDATE_PARENT',
        entity_type: 'parent',
        entity_id: parentId,
        new_values: updateData
      });

    res.status(200).json({
      status: 'success',
      message: 'Parent updated successfully',
      data: parent
    });
  } catch (error) {
    console.error('Update Parent Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update parent',
      error: error.message
    });
  }
}
  // =============================================
  // DELETE PARENT
  // =============================================
  async deleteParent(req, res) {
    try {
      const { schoolId, parentId } = req.params;
      const { adminId } = req.user;

      const { data: parent } = await supabaseAdmin
        .from('parents')
        .select('user_id')
        .eq('id', parentId)
        .eq('school_id', schoolId)
        .single();

      await supabaseAdmin
        .from('parents')
        .update({ is_active: false })
        .eq('id', parentId)
        .eq('school_id', schoolId);

      if (parent.user_id) {
        await supabaseAdmin
          .from('users')
          .update({ is_active: false })
          .eq('id', parent.user_id);
      }

      res.status(200).json({
        status: 'success',
        message: 'Parent deleted successfully'
      });
    } catch (error) {
      console.error('Delete Parent Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete parent',
        error: error.message
      });
    }
  }
}

module.exports = new ParentController();