const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Create exam (Teacher)
router.post('/schools/:schoolId/exams', authorize('teacher', 'school_admin'), examController.createExam);

// Get exams for class
router.get('/schools/:schoolId/exams', authorize('teacher', 'school_admin', 'student'), examController.getClassExams);

// Get exam details (with questions)
router.get('/schools/:schoolId/exams/:examId', authorize('teacher', 'school_admin', 'student'), examController.getExamDetails);

// Submit exam (Student)
router.post('/schools/:schoolId/exams/:examId/submit', authorize('student'), examController.submitExam);

// Get class exam results (Teacher)
router.get('/schools/:schoolId/exams/:examId/results', authorize('teacher', 'school_admin'), examController.getClassExamResults);

// Get student exam results
router.get('/schools/:schoolId/students/:studentId/results', authorize('student', 'teacher', 'school_admin'), examController.getStudentExamResults);

module.exports = router;