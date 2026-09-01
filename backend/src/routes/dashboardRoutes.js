const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize, requireSchoolAccess } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// SCHOOL DASHBOARD - Each school gets its own portal
// =============================================
router.get(
  '/schools/:schoolId/dashboard',
  authorize('school_admin', 'super_admin'),
  dashboardController.getSchoolDashboard
);

// =============================================
// CONSOLIDATED REPORT - Multi-campus
// =============================================
router.get(
  '/schools/:schoolId/consolidated-report',
  authorize('school_admin', 'super_admin'),
  dashboardController.getConsolidatedReport
);

// =============================================
// SCHOOL STATS - Quick summary
// =============================================
router.get(
  '/schools/:schoolId/stats',
  authorize('school_admin', 'super_admin'),
  dashboardController.getSchoolStats
);

// =============================================
// CHECK SCHOOL ACCESS
// =============================================
router.get(
  '/schools/:schoolId/access',
  authorize('school_admin', 'super_admin'),
  dashboardController.checkSchoolAccess
);

module.exports = router;