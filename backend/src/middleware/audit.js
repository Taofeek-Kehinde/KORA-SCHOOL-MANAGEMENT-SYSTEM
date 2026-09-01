const auditService = require('../services/auditService');

// =============================================
// AUDIT MIDDLEWARE - Automatically logs actions
// =============================================

const auditMiddleware = (action, entityType) => {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;
    const originalJson = res.json;

    // Capture request data
    const schoolId = req.params.schoolId || req.body.schoolId || req.user?.schoolId;
    const userId = req.user?.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Store old values if available
    const oldValues = req.oldValues || null;

    // Override json method to capture response
    res.json = function(data) {
      // Check if operation was successful
      if (data && data.status === 'success') {
        const newValues = data.data || null;
        
        // Log the action
        auditService.logAction({
          schoolId,
          userId,
          action,
          entityType,
          entityId: data.data?.id || req.params.id || null,
          oldValues,
          newValues,
          ipAddress,
          userAgent
        });
      }
      
      // Call original json
      return originalJson.call(this, data);
    };

    // Override send method
    res.send = function(data) {
      // Try to parse JSON data
      try {
        const parsedData = JSON.parse(data);
        if (parsedData && parsedData.status === 'success') {
          auditService.logAction({
            schoolId,
            userId,
            action,
            entityType,
            entityId: parsedData.data?.id || req.params.id || null,
            oldValues,
            newValues: parsedData.data || null,
            ipAddress,
            userAgent
          });
        }
      } catch (e) {
        // Not JSON, ignore
      }
      
      return originalSend.call(this, data);
    };

    next();
  };
};

// =============================================
// SPECIFIC AUDIT MIDDLEWARE FUNCTIONS
// =============================================

const auditTeacherEditedResult = auditMiddleware('TEACHER_EDITED_RESULT', 'grade');
const auditStudentDeleted = auditMiddleware('STUDENT_DELETED', 'student');
const auditPaymentApproved = auditMiddleware('PAYMENT_APPROVED', 'payment');
const auditAttendanceModified = auditMiddleware('ATTENDANCE_MODIFIED', 'attendance');
const auditAdminChangedSettings = auditMiddleware('ADMIN_CHANGED_SETTINGS', 'settings');
const auditPasswordReset = auditMiddleware('PASSWORD_RESET', 'user');

// =============================================
// LOGIN FAILED - Special middleware
// =============================================
const auditLoginFailed = async (req, res, next) => {
  const { email } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  await auditService.logLoginFailed(email, ipAddress, userAgent);
  next();
};

module.exports = {
  auditMiddleware,
  auditTeacherEditedResult,
  auditStudentDeleted,
  auditPaymentApproved,
  auditAttendanceModified,
  auditAdminChangedSettings,
  auditPasswordReset,
  auditLoginFailed,
  auditService
};