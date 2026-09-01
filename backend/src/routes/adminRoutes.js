const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and super_admin role
router.use(authenticate);
router.use(authorize('super_admin'));

// =============================================
// DASHBOARD
// =============================================
router.get('/dashboard', adminController.getDashboardData);

// =============================================
// PENDING REGISTRATIONS - ADD THIS! 🔥
// =============================================
router.get('/registrations/pending', adminController.getPendingRegistrations);

// =============================================
// SCHOOL MANAGEMENT
// =============================================
router.get('/schools', adminController.getSchools);
router.get('/schools/:schoolId', adminController.getSchoolById);
router.put('/schools/:schoolId/status', adminController.updateSchoolStatus);
router.put('/schools/:schoolId/transfer', adminController.transferSchoolOwnership);
router.put('/schools/:schoolId/reset-password', adminController.resetSchoolPassword);
router.put('/schools/:schoolId/assign-manager', adminController.assignAccountManager);
router.get('/schools/:schoolId/logs', adminController.getSchoolActivityLogs);

// =============================================
// SCHOOL REGISTRATION
// =============================================
router.put('/registrations/:registrationId/approve', adminController.approveSchool);
router.put('/registrations/:registrationId/reject', adminController.rejectSchool);

// =============================================
// SUBSCRIPTION MANAGEMENT
// =============================================
router.put('/schools/:schoolId/subscription', adminController.updateSchoolSubscription);

// =============================================
// ACTIVITY LOGS
// =============================================
router.get('/activity-logs', adminController.getSchoolActivityLogs);

router.post('/schools', adminController.createSchool);

module.exports = router;