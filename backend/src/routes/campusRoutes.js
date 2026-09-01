const express = require('express');
const router = express.Router();
const campusController = require('../controllers/campusController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// CAMPUS MANAGEMENT
// =============================================
router.get('/schools/:schoolId/campuses', authorize('school_admin', 'super_admin'), campusController.getCampuses);
router.get('/schools/:schoolId/campuses/:campusId', authorize('school_admin', 'super_admin'), campusController.getCampus);
router.post('/schools/:schoolId/campuses', authorize('school_admin', 'super_admin'), campusController.createCampus);
router.put('/schools/:schoolId/campuses/:campusId', authorize('school_admin', 'super_admin'), campusController.updateCampus);
router.delete('/schools/:schoolId/campuses/:campusId', authorize('school_admin', 'super_admin'), campusController.deleteCampus);

// =============================================
// REPORTS
// =============================================
router.get('/schools/:schoolId/consolidated-report', authorize('school_admin', 'super_admin'), campusController.getConsolidatedReport);
router.get('/schools/:schoolId/campuses/:campusId/report', authorize('school_admin', 'super_admin'), campusController.getCampusReport);

module.exports = router;