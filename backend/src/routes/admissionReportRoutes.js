const express = require('express');
const router = express.Router();
const admissionReportController = require('../controllers/admissionReportController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// GET ADMISSION REPORTS
// =============================================
router.get('/schools/:schoolId/reports', authorize('school_admin', 'admission_officer'), admissionReportController.getReports);

// =============================================
// GET CAPACITY QUOTAS STATUS
// =============================================
router.get('/schools/:schoolId/capacity', authorize('school_admin', 'admission_officer'), admissionReportController.getCapacityStatus);

// =============================================
// GET ADMISSION TRENDS
// =============================================
router.get('/schools/:schoolId/trends', authorize('school_admin', 'admission_officer'), admissionReportController.getAdmissionTrends);

module.exports = router;