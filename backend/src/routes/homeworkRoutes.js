const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homeworkController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Create homework
router.post('/schools/:schoolId/homework', authorize('teacher', 'school_admin'), homeworkController.createHomework);

// Get class homework
router.get('/schools/:schoolId/homework', authorize('teacher', 'school_admin'), homeworkController.getClassHomework);

// Get student homework
router.get('/students/:studentId/homework', authorize('student', 'teacher', 'school_admin'), homeworkController.getStudentHomework);

// Update homework status
router.put('/student-homework/:studentHomeworkId', authorize('student'), homeworkController.updateHomeworkStatus);

// Get submissions for a homework (teacher)
router.get('/:homeworkId/submissions', authorize('teacher', 'school_admin'), homeworkController.getHomeworkSubmissions);

// Grade a submission (teacher)
router.put('/student-homework/:studentHomeworkId/grade', authorize('teacher', 'school_admin'), homeworkController.gradeSubmission);

module.exports = router;