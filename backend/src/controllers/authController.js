const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');
const emailService = require('../services/emailService');

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

      // INLINE TOKEN CREATION
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          schoolId: user.school_id,
          studentId: user.student_id
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

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
  // LOGIN - FIXED with inline token
  // =============================================
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email and password are required'
        });
      }

      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !user) {
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

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }

      await supabaseAdmin
        .from('users')
        .update({ last_login: new Date() })
        .eq('id', user.id);

      // =============================================
      // INLINE TOKEN - NO METHOD CALL
      // =============================================
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          schoolId: user.school_id,
          studentId: user.student_id
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

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
            studentId: user.student_id,
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


  // Add this method if it doesn't exist
async getMe(req, res) {
  try {
    const user = req.user;
    
    // Get user with student_id
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    res.status(200).json({
      status: 'success',
      data: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        role: userData.role,
        schoolId: userData.school_id,
        studentId: userData.student_id,  // ← Make sure this is returned
        isVerified: userData.is_verified
      }
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user',
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
  // CHANGE PASSWORD
  // =============================================
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password and new password are required'
        });
      }

      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('password_hash')
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
  // RESET PASSWORD
  // =============================================
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Token and new password are required'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, reset_token, reset_token_expires')
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
        .select('id, is_verified')
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

      // INLINE TOKEN
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          schoolId: user.school_id,
          studentId: user.student_id
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.status(200).json({
        status: 'success',
        data: { token }
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
  // AUTHENTICATE MIDDLEWARE
  // =============================================
  async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error);
      res.status(401).json({
        status: 'error',
        message: 'Authentication failed'
      });
    }
  }
}

module.exports = new AuthController();