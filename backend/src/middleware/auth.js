const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

const findUserByToken = async (decoded) => {
  if (!decoded) return null;

  const candidateIds = [decoded.userId, decoded.id, decoded.sub].filter(Boolean);
  const candidateEmails = [decoded.email].filter(Boolean);

  const selectFields = `
    id,
    email,
    full_name,
    phone,
    role,
    school_id,
    campus_id,
    student_id,
    parent_id,
    is_active,
    is_verified,
    last_login,
    profile_pic_url
  `;

  for (const userId of candidateIds) {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(selectFields)
      .eq('id', userId)
      .maybeSingle();

    if (!error && user) return user;
  }

  for (const email of candidateEmails) {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select(selectFields)
      .eq('email', email)
      .maybeSingle();

    if (!error && user) return user;
  }

  return null;
};

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

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token. Please login again.'
      });
    }

    // ✅ CHECK DATABASE FIRST - User must exist
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .maybeSingle();

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found. Account may have been deleted.'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        status: 'error',
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // ✅ Set req.user from DATABASE (not token)
    req.user = {
      id: user.id,
      adminId: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      schoolId: user.school_id,
      campusId: user.campus_id,
      studentId: user.student_id || null,
      parentId: user.parent_id || null,
      isActive: user.is_active,
      isVerified: user.is_verified,
      lastLogin: user.last_login,
      profilePicUrl: user.profile_pic_url
    };

    next();
  } catch (error) {
    console.error('Auth Error:', error);
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

    if (user.role === 'super_admin') {
      return next();
    }

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