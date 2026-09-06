const express = require('express');
const router = express.Router();
const admissionExamController = require('../controllers/admissionExamController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// SCHEDULE EXAM
// =============================================
router.post('/schools/:schoolId/exams', authorize('school_admin', 'admission_officer'), admissionExamController.scheduleExam);

// =============================================
// RECORD EXAM SCORE
// =============================================
router.put('/schools/:schoolId/exams/:examId/score', authorize('school_admin', 'admission_officer'), admissionExamController.recordExamScore);

// =============================================
// GET APPLICATION EXAMS
// =============================================
router.get('/applications/:applicationId/exams', authorize('school_admin', 'admission_officer', 'parent'), admissionExamController.getApplicationExams);

// =============================================
// GET ALL SCHEDULED EXAMS
// =============================================
router.get('/schools/:schoolId/exams/scheduled', authorize('school_admin', 'admission_officer'), admissionExamController.getAllScheduledExams);

module.exports = router;