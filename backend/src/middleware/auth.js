const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please provide a valid token.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        school_id,
        campus_id,
        is_active,
        is_verified,
        last_login,
        profile_pic_url
      `)
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        status: 'error',
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      adminId: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      schoolId: user.school_id,
      campusId: user.campus_id,
      isActive: user.is_active,
      isVerified: user.is_verified,
      lastLogin: user.last_login,
      profilePicUrl: user.profile_pic_url
    };

    next();
  } catch (error) {
    console.error('Auth Error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please login again.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired. Please login again.'
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Authentication failed',
      error: error.message
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

const requireSchoolAccess = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const user = req.user;

    // Super admin has access to all schools
    if (user.role === 'super_admin') {
      return next();
    }

    // Check if user belongs to the school
    if (user.schoolId !== schoolId) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. You do not have permission to access this school.'
      });
    }

    next();
  } catch (error) {
    console.error('School Access Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify school access',
      error: error.message
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  requireSchoolAccess
};