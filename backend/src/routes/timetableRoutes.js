const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Set timetable
router.post('/schools/:schoolId/timetable', authorize('teacher', 'school_admin'), timetableController.setTimetable);

// Get class timetable
router.get('/schools/:schoolId/timetable', authorize('teacher', 'school_admin', 'student'), timetableController.getClassTimetable);

// Get student timetable
router.get('/students/:studentId/timetable', authorize('student', 'teacher', 'school_admin'), timetableController.getStudentTimetable);

module.exports = router;