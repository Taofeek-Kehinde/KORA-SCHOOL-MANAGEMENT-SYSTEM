const express = require('express');
const router = express.Router();
const admissionInterviewController = require('../controllers/admissionInterviewController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// SCHEDULE INTERVIEW
// =============================================
router.post('/schools/:schoolId/interviews', authorize('school_admin', 'admission_officer'), admissionInterviewController.scheduleInterview);

// =============================================
// RECORD INTERVIEW RESULT
// =============================================
router.put('/schools/:schoolId/interviews/:interviewId/result', authorize('school_admin', 'admission_officer'), admissionInterviewController.recordInterviewResult);

// =============================================
// GET APPLICATION INTERVIEWS
// =============================================
router.get('/applications/:applicationId/interviews', authorize('school_admin', 'admission_officer', 'parent'), admissionInterviewController.getApplicationInterviews);

// =============================================
// GET ALL SCHEDULED INTERVIEWS
// =============================================
router.get('/schools/:schoolId/interviews/scheduled', authorize('school_admin', 'admission_officer'), admissionInterviewController.getAllScheduledInterviews);

module.exports = router;