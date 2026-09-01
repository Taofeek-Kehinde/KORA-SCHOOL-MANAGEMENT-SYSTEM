const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');
const emailService = require('../services/emailService');
const auditService = require('../services/auditService');

class AuthController {
  // =============================================
  // REGISTER
  // =============================================
  async register(req, res) {
    try {
      const { email, password, fullName, phone, role, schoolId } = req.body;

      if (!email || !password || !fullName) {
        return res.status(400).json({
          status: 'error',
          message: 'Email, password, and full name are required'
        });
      }

      const { data: existingUser, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: 'User with this email already exists'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          email,
          password_hash: hashedPassword,
          full_name: fullName,
          phone: phone || '',
          role: role || 'parent',
          school_id: schoolId || null,
          is_active: true,
          is_verified: false,
          created_at: new Date()
        })
        .select()
        .single();

      if (userError) throw userError;

      const verificationToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      await emailService.sendVerificationEmail(user.email, verificationToken);

      const token = this.generateToken(user);

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully. Please verify your email.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role
          },
          token
        }
      });
    } catch (error) {
      console.error('Registration Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to register user',
        error: error.message
      });
    }
  }

  // =============================================
  // LOGIN - WITH AUDIT LOGGING
  // =============================================
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email and password are required'
        });
      }

      // Get user
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      // LOG: Login failed - User not found
      if (userError || !user) {
        await auditService.logLoginFailed(email, ipAddress, userAgent);
        
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          status: 'error',
          message: 'Account is deactivated. Please contact support.'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      // LOG: Login failed - Invalid password
      if (!isValidPassword) {
        await auditService.logLoginFailed(email, ipAddress, userAgent);
        
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }

      // Update last login
      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date() })
        .eq('id', user.id);

      // Generate token
      const token = this.generateToken(user);

      // LOG: Login successful (optional - can be added if needed)
      // await auditService.logAction({
      //   schoolId: user.school_id,
      //   userId: user.id,
      //   action: 'LOGIN_SUCCESS',
      //   entityType: 'auth',
      //   ipAddress,
      //   userAgent,
      //   newValues: { email: user.email }
      // });

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            schoolId: user.school_id,
            isVerified: user.is_verified
          },
          token
        }
      });
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to login',
        error: error.message
      });
    }
  }

  // =============================================
  // GET PROFILE
  // =============================================
  async getProfile(req, res) {
    try {
      const user = req.user;

      res.status(200).json({
        status: 'success',
        data: user
      });
    } catch (error) {
      console.error('Get Profile Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get profile',
        error: error.message
      });
    }
  }

  // =============================================
  // UPDATE PROFILE
  // =============================================
  async updateProfile(req, res) {
    try {
      const { fullName, phone, profilePicUrl } = req.body;
      const userId = req.user.id;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const updateData = {};
      if (fullName) updateData.full_name = fullName;
      if (phone) updateData.phone = phone;
      if (profilePicUrl) updateData.profile_pic_url = profilePicUrl;
      updateData.updated_at = new Date();

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // LOG: Profile updated
      await auditService.logAction({
        schoolId: user.school_id,
        userId: userId,
        action: 'PROFILE_UPDATED',
        entityType: 'user',
        entityId: userId,
        newValues: updateData,
        ipAddress,
        userAgent
      });

      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      console.error('Update Profile Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }

  // =============================================
  // CHANGE PASSWORD - WITH AUDIT LOGGING
  // =============================================
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password and new password are required'
        });
      }

      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('password_hash, school_id, email')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await supabaseAdmin
        .from('users')
        .update({
          password_hash: hashedPassword,
          updated_at: new Date()
        })
        .eq('id', userId);

      // LOG: Password changed (not reset, but changed by user)
      await auditService.logAction({
        schoolId: user.school_id,
        userId: userId,
        action: 'PASSWORD_CHANGED',
        entityType: 'user',
        entityId: userId,
        newValues: { changed_at: new Date() },
        ipAddress,
        userAgent
      });

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change Password Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to change password',
        error: error.message
      });
    }
  }

  // =============================================
  // FORGOT PASSWORD
  // =============================================
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is required'
        });
      }

      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single();

      if (userError || !user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      await supabaseAdmin
        .from('users')
        .update({
          reset_token: resetToken,
          reset_token_expires: new Date(Date.now() + 3600000)
        })
        .eq('id', user.id);

      await emailService.sendPasswordResetEmail(user.email, resetToken);

      res.status(200).json({
        status: 'success',
        message: 'Password reset link sent to your email'
      });
    } catch (error) {
      console.error('Forgot Password Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process forgot password request',
        error: error.message
      });
    }
  }

  // =============================================
  // RESET PASSWORD - WITH AUDIT LOGGING
  // =============================================
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      if (!token || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Token and new password are required'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, reset_token, reset_token_expires, school_id, email')
        .eq('id', decoded.userId)
        .single();

      if (userError || !user) {
        return res.status(404).json({
          status: 'error',
          message: 'Invalid token'
        });
      }

      if (user.reset_token !== token || new Date(user.reset_token_expires) < new Date()) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid or expired token'
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await supabaseAdmin
        .from('users')
        .update({
          password_hash: hashedPassword,
          reset_token: null,
          reset_token_expires: null,
          updated_at: new Date()
        })
        .eq('id', user.id);

      // LOG: Password reset - using auditService
      await auditService.logPasswordReset(
        user.school_id,
        user.id,
        {
          userId: user.id,
          email: user.email
        },
        ipAddress,
        userAgent
      );

      res.status(200).json({
        status: 'success',
        message: 'Password reset successfully'
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
  // VERIFY EMAIL
  // =============================================
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          status: 'error',
          message: 'Verification token is required'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, is_verified, school_id')
        .eq('id', decoded.userId)
        .single();

      if (userError || !user) {
        return res.status(404).json({
          status: 'error',
          message: 'Invalid token'
        });
      }

      if (user.is_verified) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already verified'
        });
      }

      await supabaseAdmin
        .from('users')
        .update({
          is_verified: true,
          updated_at: new Date()
        })
        .eq('id', user.id);

      res.status(200).json({
        status: 'success',
        message: 'Email verified successfully'
      });
    } catch (error) {
      console.error('Verify Email Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to verify email',
        error: error.message
      });
    }
  }

  // =============================================
  // REFRESH TOKEN
  // =============================================
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          status: 'error',
          message: 'Refresh token is required'
        });
      }

      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (userError || !user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid refresh token'
        });
      }

      const newToken = this.generateToken(user);

      res.status(200).json({
        status: 'success',
        data: { token: newToken }
      });
    } catch (error) {
      console.error('Refresh Token Error:', error);
      res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }
  }

  // =============================================
  // LOGOUT
  // =============================================
  async logout(req, res) {
    try {
      // Client-side token removal is handled by frontend
      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to logout',
        error: error.message
      });
    }
  }

  // =============================================
// EXPORT AUDIT LOGS
// =============================================
async exportAuditLogs(req, res) {
  try {
    const { schoolId } = req.params;
    const { startDate, endDate, format = 'csv' } = req.query;

    let query = supabaseAdmin
      .from('audit_logs')
      .select(`
        *,
        users:user_id(email, full_name),
        schools:school_id(name)
      `)
      .order('created_at', { ascending: false });

    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (format === 'csv') {
      const headers = ['ID', 'School', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Created At'];
      const rows = data.map(log => [
        log.id,
        log.schools?.name || '',
        log.users?.full_name || log.users?.email || '',
        log.action,
        log.entity_type,
        log.entity_id || '',
        log.ip_address || '',
        new Date(log.created_at).toLocaleString()
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } else {
      res.status(200).json({
        status: 'success',
        data
      });
    }
  } catch (error) {
    console.error('Export Audit Logs Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export audit logs',
      error: error.message
    });
  }
}

// =============================================
// GET AUDIT STATISTICS - FIXED
// =============================================
async getAuditStatistics(req, res) {
  try {
    const { schoolId } = req.query;

    console.log('=== GET AUDIT STATISTICS ===');
    console.log('SchoolId:', schoolId);

    // Build base query
    let query = supabaseAdmin
      .from('audit_logs')
      .select('id', { count: 'exact', head: false });

    if (schoolId) {
      query = query.eq('school_id', schoolId);
    }

    // Get total logs
    const { count: totalLogs, error: totalError } = await supabaseAdmin
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .eq(schoolId ? 'school_id' : 'id', schoolId || 'id');

    if (totalError) console.error('Total logs error:', totalError);

    // Get last 24 hours
    const { count: last24Hours, error: recentError } = await supabaseAdmin
      .from('audit_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .eq(schoolId ? 'school_id' : 'id', schoolId || 'id');

    if (recentError) console.error('Recent logs error:', recentError);

    // Get unique users
    let userQuery = supabaseAdmin
      .from('audit_logs')
      .select('user_id')
      .not('user_id', 'is', null);

    if (schoolId) {
      userQuery = userQuery.eq('school_id', schoolId);
    }

    const { data: userData, error: userError } = await userQuery;
    if (userError) console.error('User data error:', userError);

    const uniqueUsers = new Set(userData?.map(u => u.user_id) || []).size;

    // Get distinct actions
    let actionQuery = supabaseAdmin
      .from('audit_logs')
      .select('action');

    if (schoolId) {
      actionQuery = actionQuery.eq('school_id', schoolId);
    }

    const { data: actionData, error: actionError } = await actionQuery;
    if (actionError) console.error('Action data error:', actionError);

    const actions = new Set(actionData?.map(a => a.action) || []).size;

    console.log('Total Logs:', totalLogs);
    console.log('Last 24 Hours:', last24Hours);
    console.log('Unique Users:', uniqueUsers);
    console.log('Actions:', actions);

    res.status(200).json({
      status: 'success',
      data: {
        total_logs: totalLogs || 0,
        last_24_hours: last24Hours || 0,
        unique_users: uniqueUsers || 0,
        actions: actions || 0
      }
    });
  } catch (error) {
    console.error('Get Audit Statistics Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch audit statistics',
      error: error.message
    });
  }
}

  // =============================================
  // HELPER: Generate JWT
  // =============================================
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.school_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }
}

module.exports = new AuthController();