const express = require('express');
const router = express.Router();
const admissionController = require('../controllers/admissionController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// CREATE APPLICATION (Parent)
// =============================================
router.post('/schools/:schoolId/applications', authorize('parent', 'school_admin'), admissionController.createApplication);

// =============================================
// GET ALL APPLICATIONS (Admission Officer)
// =============================================
router.get('/schools/:schoolId/applications', authorize('school_admin', 'admission_officer'), admissionController.getApplications);

// =============================================
// GET APPLICATION BY ID
// =============================================
router.get('/schools/:schoolId/applications/:applicationId', authorize('school_admin', 'admission_officer', 'parent'), admissionController.getApplicationById);

// =============================================
// UPDATE APPLICATION STATUS
// =============================================
router.put('/schools/:schoolId/applications/:applicationId/status', authorize('school_admin', 'admission_officer'), admissionController.updateApplicationStatus);

// =============================================
// UPLOAD DOCUMENT
// =============================================
router.post('/schools/:schoolId/applications/:applicationId/documents', authorize('parent', 'school_admin'), admissionController.uploadDocument);

// =============================================
// GET ADMISSION DASHBOARD STATS
// =============================================
router.get('/schools/:schoolId/dashboard', authorize('school_admin', 'admission_officer'), admissionController.getDashboardStats);

// =============================================
// GET PARENT'S APPLICATIONS
// =============================================
router.get('/my-applications', authorize('parent'), admissionController.getMyApplications);

// =============================================
// DELETE APPLICATION
// =============================================
router.delete('/schools/:schoolId/applications/:applicationId', authorize('parent', 'school_admin'), admissionController.deleteApplication);

module.exports = router;