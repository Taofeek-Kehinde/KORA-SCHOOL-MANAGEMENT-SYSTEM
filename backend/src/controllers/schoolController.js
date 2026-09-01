const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');

class SchoolController {
  // =============================================
  // CREATE SCHOOL (Super Admin)
  // =============================================
  async createSchool(req, res) {
    try {
      const {
        name,
        email,
        phone,
        address,
        country,
        state,
        city,
        schoolType,
        principalName,
        pricePerStudent,
        billingFrequency,
        adminEmail,
        adminPassword,
        adminFullName
      } = req.body;
      const { adminId } = req.user;

      // Validation
      if (!name || !email || !adminEmail || !adminPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'School name, email, and admin credentials are required'
        });
      }

      // Check if school exists
      const { data: existingSchool } = await supabaseAdmin
        .from('schools')
        .select('id')
        .eq('email', email)
        .single();

      if (existingSchool) {
        return res.status(400).json({
          status: 'error',
          message: 'School with this email already exists'
        });
      }

      // Check if admin email exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', adminEmail)
        .single();

      if (existingUser) {
        return res.status(400).json({
          status: 'error',
          message: 'Admin email already registered'
        });
      }

      // Hash admin password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create school
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .insert({
          name,
          email,
          phone: phone || '',
          address: address || '',
          country: country || 'Nigeria',
          state: state || '',
          city: city || '',
          school_type: schoolType || 'private',
          principal_name: principalName || '',
          is_approved: true,
          is_active: true,
          subscription_status: 'trial',
          trial_start_date: new Date(),
          trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          created_by: adminId,
          approved_by: adminId,
          approved_at: new Date(),
          price_per_student: pricePerStudent || 800,
          billing_frequency: billingFrequency || 'monthly',
          created_at: new Date()
        })
        .select()
        .single();

      if (schoolError) throw schoolError;

      // Create school admin user
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          email: adminEmail,
          full_name: adminFullName || 'School Administrator',
          phone: '',
          password_hash: hashedPassword,
          role: 'school_admin',
          school_id: school.id,
          is_active: true,
          is_verified: true,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: school.id,
          user_id: adminId,
          action: 'CREATE_SCHOOL',
          entity_type: 'school',
          entity_id: school.id,
          new_values: { school_name: name, admin_email: adminEmail }
        });

      res.status(201).json({
        status: 'success',
        message: 'School created successfully',
        data: {
          school,
          admin: {
            id: user.id,
            email: user.email,
            role: user.role
          },
          temp_password: adminPassword
        }
      });
    } catch (error) {
      console.error('Create School Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create school',
        error: error.message
      });
    }
  }

  // =============================================
  // GET SCHOOLS (Already in adminController)
  // =============================================
}

module.exports = new SchoolController();