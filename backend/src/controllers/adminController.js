const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');

class AdminController {

  // =============================================
  // GET PENDING REGISTRATIONS
  // =============================================
  async getPendingRegistrations(req, res) {
    try {
      const { data, error } = await supabaseAdmin
        .from('school_registration_requests')
        .select(`
          id,
          school_name,
          school_email,
          admin_email,
          admin_full_name,
          created_at,
          status,
          phone_number,
          country,
          state,
          city
        `)
        .in('status', ['pending', 'under_review'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || []
      });
    } catch (error) {
      console.error('Get Pending Registrations Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch pending registrations',
        error: error.message
      });
    }
  }

  // =============================================
// DASHBOARD DATA - COMPLETE FIXED
// =============================================
async getDashboardData(req, res) {
  try {
    // Get school counts
    const { count: totalSchools } = await supabaseAdmin
      .from('schools')
      .select('id', { count: 'exact', head: true });

    const { count: activeSchools } = await supabaseAdmin
      .from('schools')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'active');

    const { count: inactiveSchools } = await supabaseAdmin
      .from('schools')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', false);

    const { count: trialSchools } = await supabaseAdmin
      .from('schools')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'trial');

    const { count: schoolsAwaitingApproval } = await supabaseAdmin
      .from('school_registration_requests')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'under_review']);

    // =============================================
    // EXPIRED SCHOOLS
    // =============================================
    const { count: expiredSchools, error: expiredError } = await supabaseAdmin
      .from('schools')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'expired');

    if (expiredError) {
      console.error('Expired schools error:', expiredError);
    }

    // =============================================
    // SCHOOLS DUE FOR RENEWAL (next 7 days) - ADD THIS! 🔥
    // =============================================
    const { count: schoolsDueForRenewal, error: dueError } = await supabaseAdmin
      .from('schools')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'active')
      .gte('subscription_end_date', new Date().toISOString().split('T')[0])
      .lte('subscription_end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (dueError) {
      console.error('Due for renewal error:', dueError);
    }

    // User counts
    const { count: totalStudents } = await supabaseAdmin
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: totalTeachers } = await supabaseAdmin
      .from('teachers')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: totalStaff } = await supabaseAdmin
      .from('staff')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: totalParents } = await supabaseAdmin
      .from('parents')
      .select('id', { count: 'exact', head: true });

    // Revenue
    const { data: revenueData } = await supabaseAdmin
      .from('subscription_transactions')
      .select('amount, status, created_at')
      .eq('status', 'completed');

    const totalRevenue = revenueData?.reduce((sum, t) => sum + t.amount, 0) || 0;

    const now = new Date();
    const monthlyRevenue = revenueData
      ?.filter(t => {
        const date = new Date(t.created_at);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const yearlyRevenue = revenueData
      ?.filter(t => {
        const date = new Date(t.created_at);
        return date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0) || 0;

    const { count: pendingPayments } = await supabaseAdmin
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: supportTickets } = await supabaseAdmin
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']);

    // Latest Schools
    const { data: latestSchools } = await supabaseAdmin
      .from('schools')
      .select('id, name, email, subscription_status, is_approved, created_at, logo_url')
      .order('created_at', { ascending: false })
      .limit(10);

    // Recent Activities
    const { data: recentActivities } = await supabaseAdmin
      .from('audit_logs')
      .select(`
        id,
        action,
        entity_type,
        entity_id,
        ip_address,
        created_at,
        users:user_id (email, full_name),
        schools:school_id (name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    res.status(200).json({
      status: 'success',
      data: {
        metrics: {
          total_registered_schools: totalSchools || 0,
          active_schools: activeSchools || 0,
          inactive_schools: inactiveSchools || 0,
          trial_schools: trialSchools || 0,
          schools_awaiting_approval: schoolsAwaitingApproval || 0,
          expired_schools: expiredSchools || 0,
          schools_due_for_renewal: schoolsDueForRenewal || 0,  // ✅ NOW DEFINED
          total_active_students: totalStudents || 0,
          total_teachers: totalTeachers || 0,
          total_staff: totalStaff || 0,
          total_parents: totalParents || 0,
          total_platform_revenue: totalRevenue,
          revenue_this_month: monthlyRevenue,
          revenue_this_year: yearlyRevenue,
          pending_payments: pendingPayments || 0,
          support_tickets: supportTickets || 0
        },
        latestSchools: latestSchools || [],
        recentActivities: recentActivities || []
      }
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
}

  // =============================================
  // GET ALL SCHOOLS - FIXED (No join errors)
  // =============================================
  async getSchools(req, res) {
    try {
      const {
        status,
        is_approved,
        school_type,
        search,
        limit = 20,
        offset = 0,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;

      let query = supabaseAdmin
        .from('schools')
        .select('*', { count: 'exact' });

      if (status) {
        query = query.eq('subscription_status', status);
      }

      if (is_approved !== undefined) {
        query = query.eq('is_approved', is_approved === 'true');
      }

      if (school_type) {
        query = query.eq('school_type', school_type);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,registration_number.ilike.%${search}%`);
      }

      const { data, error, count } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
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
      console.error('Get Schools Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch schools',
        error: error.message
      });
    }
  }

  // =============================================
  // GET SINGLE SCHOOL
  // =============================================
  async getSchoolById(req, res) {
    try {
      const { schoolId } = req.params;

      const { data: school, error } = await supabaseAdmin
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      if (error) throw error;

      // Get student count
      const { count: studentCount } = await supabaseAdmin
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true);

      // Get teacher count
      const { count: teacherCount } = await supabaseAdmin
        .from('teachers')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true);

      // Get recent transactions
      const { data: transactions } = await supabaseAdmin
        .from('subscription_transactions')
        .select('*')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })
        .limit(10);

      res.status(200).json({
        status: 'success',
        data: {
          ...school,
          student_count: studentCount || 0,
          teacher_count: teacherCount || 0,
          recent_transactions: transactions || []
        }
      });
    } catch (error) {
      console.error('Get School Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch school details',
        error: error.message
      });
    }
  }

  // =============================================
  // APPROVE SCHOOL
  // =============================================
  async approveSchool(req, res) {
    try {
      const { registrationId } = req.params;
      const { adminId } = req.user;

      const { data: registration, error: fetchError } = await supabaseAdmin
        .from('school_registration_requests')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (fetchError || !registration) {
        return res.status(404).json({
          status: 'error',
          message: 'Registration request not found'
        });
      }

      if (registration.status !== 'pending' && registration.status !== 'under_review') {
        return res.status(400).json({
          status: 'error',
          message: `Registration is already ${registration.status}`
        });
      }

      // Generate password for admin
      const tempPassword = Math.random().toString(36).slice(-8) + 'Kora@2025';
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Create school
      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .insert({
          name: registration.school_name,
          email: registration.school_email,
          phone: registration.phone_number,
          address: registration.school_address,
          country: registration.country || 'Nigeria',
          state: registration.state || '',
          city: registration.city || '',
          school_type: registration.school_type || 'private',
          logo_url: registration.school_logo_url,
          website: registration.website || '',
          registration_number: registration.registration_number || '',
          principal_name: registration.principal_name || '',
          vice_principal_name: registration.vice_principal_name || '',
          is_approved: true,
          is_active: true,
          subscription_status: 'trial',
          trial_start_date: new Date(),
          trial_end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          created_by: adminId,
          approved_by: adminId,
          approved_at: new Date(),
          price_per_student: 800,
          billing_frequency: 'monthly'
        })
        .select()
        .single();

      if (schoolError) throw schoolError;

      // Create school admin user
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          email: registration.admin_email,
          full_name: registration.admin_full_name,
          phone: registration.admin_phone,
          password_hash: hashedPassword,
          role: 'school_admin',
          school_id: school.id,
          is_active: true,
          is_verified: true,
          created_by: adminId
        })
        .select()
        .single();

      if (userError) throw userError;

      // Update registration request
      await supabaseAdmin
        .from('school_registration_requests')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date(),
          approved_at: new Date(),
          school_id: school.id
        })
        .eq('id', registrationId);

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          school_id: school.id,
          user_id: adminId,
          action: 'APPROVE_SCHOOL',
          entity_type: 'school',
          entity_id: school.id,
          new_values: {
            school_name: school.name,
            admin_email: registration.admin_email
          }
        });

      res.status(200).json({
        status: 'success',
        message: 'School approved successfully',
        data: {
          school,
          user,
          temp_password: tempPassword
        }
      });
    } catch (error) {
      console.error('Approve School Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to approve school',
        error: error.message
      });
    }
  }

  // =============================================
  // REJECT SCHOOL
  // =============================================
  async rejectSchool(req, res) {
    try {
      const { registrationId } = req.params;
      const { reason } = req.body;
      const { adminId } = req.user;

      if (!reason) {
        return res.status(400).json({
          status: 'error',
          message: 'Rejection reason is required'
        });
      }

      const { data: registration, error: fetchError } = await supabaseAdmin
        .from('school_registration_requests')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (fetchError || !registration) {
        return res.status(404).json({
          status: 'error',
          message: 'Registration request not found'
        });
      }

      await supabaseAdmin
        .from('school_registration_requests')
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date(),
          rejection_reason: reason
        })
        .eq('id', registrationId);

      res.status(200).json({
        status: 'success',
        message: 'School registration rejected',
        data: { registrationId, reason }
      });
    } catch (error) {
      console.error('Reject School Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to reject school',
        error: error.message
      });
    }
  }

  // =============================================
  // UPDATE SCHOOL STATUS
  // =============================================
  async updateSchoolStatus(req, res) {
    try {
      const { schoolId } = req.params;
      const { action, reason } = req.body;
      const { adminId } = req.user;

      const validActions = ['activate', 'suspend', 'delete', 'approve'];
      if (!validActions.includes(action)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid action. Must be one of: ${validActions.join(', ')}`
        });
      }

      let updateData = {};
      let statusMessage = '';

      switch (action) {
        case 'activate':
          updateData = {
            is_active: true,
            suspended_at: null,
            suspended_by: null,
            suspension_reason: null,
            deleted_at: null
          };
          statusMessage = 'activated';
          break;
        case 'suspend':
          updateData = {
            is_active: false,
            suspended_at: new Date(),
            suspended_by: adminId,
            suspension_reason: reason || 'Suspended by admin'
          };
          statusMessage = 'suspended';
          break;
        case 'delete':
          updateData = {
            deleted_at: new Date(),
            is_active: false,
            subscription_status: 'expired'
          };
          statusMessage = 'deleted';
          break;
        case 'approve':
          updateData = {
            is_approved: true,
            approved_by: adminId,
            approved_at: new Date()
          };
          statusMessage = 'approved';
          break;
      }

      const { data: school, error } = await supabaseAdmin
        .from('schools')
        .update(updateData)
        .eq('id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: `School ${statusMessage} successfully`,
        data: school
      });
    } catch (error) {
      console.error('Update School Status Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update school status',
        error: error.message
      });
    }
  }

  // =============================================
  // TRANSFER SCHOOL OWNERSHIP
  // =============================================
  async transferSchoolOwnership(req, res) {
    try {
      const { schoolId } = req.params;
      const { newOwnerEmail, newOwnerName, newOwnerPhone } = req.body;
      const { adminId } = req.user;

      if (!newOwnerEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'New owner email is required'
        });
      }

      const { data: school, error: schoolError } = await supabaseAdmin
        .from('schools')
        .select('*')
        .eq('id', schoolId)
        .single();

      if (schoolError || !school) {
        return res.status(404).json({
          status: 'error',
          message: 'School not found'
        });
      }

      const { data: existingUser, error: userCheckError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', newOwnerEmail)
        .single();

      let newOwnerId;

      if (existingUser) {
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            role: 'school_admin',
            school_id: schoolId,
            full_name: newOwnerName || existingUser.full_name,
            phone: newOwnerPhone || existingUser.phone,
            updated_at: new Date()
          })
          .eq('id', existingUser.id)
          .select()
          .single();

        if (updateError) throw updateError;
        newOwnerId = updatedUser.id;
      } else {
        const tempPassword = Math.random().toString(36).slice(-8) + 'Kora@2025';
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const { data: newUser, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            email: newOwnerEmail,
            full_name: newOwnerName || 'School Administrator',
            phone: newOwnerPhone || '',
            password_hash: hashedPassword,
            role: 'school_admin',
            school_id: schoolId,
            is_active: true,
            is_verified: true,
            created_by: adminId
          })
          .select()
          .single();

        if (createError) throw createError;
        newOwnerId = newUser.id;
      }

      const { data: updatedSchool, error: updateError } = await supabaseAdmin
        .from('schools')
        .update({
          created_by: newOwnerId,
          updated_at: new Date()
        })
        .eq('id', schoolId)
        .select()
        .single();

      if (updateError) throw updateError;

      res.status(200).json({
        status: 'success',
        message: 'School ownership transferred successfully',
        data: updatedSchool
      });
    } catch (error) {
      console.error('Transfer Ownership Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to transfer ownership',
        error: error.message
      });
    }
  }

  // =============================================
  // RESET SCHOOL ADMIN PASSWORD
  // =============================================
  async resetSchoolPassword(req, res) {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;

      const { data: admin, error: adminError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('school_id', schoolId)
        .eq('role', 'school_admin')
        .single();

      if (adminError) {
        return res.status(404).json({
          status: 'error',
          message: 'School admin not found'
        });
      }

      const newPassword = Math.random().toString(36).slice(-8) + 'Kora@2025';
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          password_hash: hashedPassword,
          updated_at: new Date()
        })
        .eq('id', admin.id)
        .select()
        .single();

      if (updateError) throw updateError;

      res.status(200).json({
        status: 'success',
        message: 'Password reset successfully',
        data: {
          email: admin.email,
          new_password: newPassword
        }
      });
    } catch (error) {
      console.error('Reset Password Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to reset password',
        error: error.message
      });
    }
  }

  // =============================================
  // ASSIGN ACCOUNT MANAGER
  // =============================================
  async assignAccountManager(req, res) {
    try {
      const { schoolId } = req.params;
      const { managerId } = req.body;
      const { adminId } = req.user;

      if (!managerId) {
        return res.status(400).json({
          status: 'error',
          message: 'Manager ID is required'
        });
      }

      const { data: manager, error: managerError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', managerId)
        .in('role', ['super_admin', 'school_admin'])
        .single();

      if (managerError) {
        return res.status(404).json({
          status: 'error',
          message: 'Manager not found or invalid role'
        });
      }

      const { data: school, error: updateError } = await supabaseAdmin
        .from('schools')
        .update({
          account_manager_id: managerId,
          updated_at: new Date()
        })
        .eq('id', schoolId)
        .select()
        .single();

      if (updateError) throw updateError;

      res.status(200).json({
        status: 'success',
        message: 'Account manager assigned successfully',
        data: school
      });
    } catch (error) {
      console.error('Assign Manager Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to assign manager',
        error: error.message
      });
    }
  }

  // =============================================
  // GET SCHOOL ACTIVITY LOGS
  // =============================================
  async getSchoolActivityLogs(req, res) {
    try {
      const { schoolId } = req.params;
      const { limit = 50, offset = 0, action, entity_type } = req.query;

      let query = supabaseAdmin
        .from('audit_logs')
        .select(`
          *,
          users:user_id (email, full_name),
          schools:school_id (name)
        `, { count: 'exact' });

      if (schoolId) {
        query = query.eq('school_id', schoolId);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (entity_type) {
        query = query.eq('entity_type', entity_type);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
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
      console.error('Activity Logs Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch activity logs',
        error: error.message
      });
    }
  }

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

// Add this after expiredSchools
// =============================================
// SCHOOLS DUE FOR RENEWAL (next 7 days)
// =============================================
const { count: schoolsDueForRenewal, error: dueError } = await supabaseAdmin
  .from('schools')
  .select('id', { count: 'exact', head: true })
  .eq('subscription_status', 'active')
  .gte('subscription_end_date', new Date().toISOString().split('T')[0])
  .lte('subscription_end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

if (dueError) {
  console.error('Due for renewal error:', dueError);
}

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
        billing_frequency: billingFrequency || 'monthly'
      })
      .select()
      .single();

    if (schoolError) throw schoolError;

    // Create school admin
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
        created_by: adminId
      })
      .select()
      .single();

    if (userError) throw userError;

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
  // UPDATE SCHOOL SUBSCRIPTION
  // =============================================
  async updateSchoolSubscription(req, res) {
    try {
      const { schoolId } = req.params;
      const updateData = req.body;
      const { adminId } = req.user;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No subscription data to update'
        });
      }

      updateData.updated_at = new Date();

      const { data: school, error } = await supabaseAdmin
        .from('schools')
        .update(updateData)
        .eq('id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'School subscription updated successfully',
        data: school
      });
    } catch (error) {
      console.error('Update Subscription Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update subscription',
        error: error.message
      });
    }
  }
}

module.exports = new AdminController();