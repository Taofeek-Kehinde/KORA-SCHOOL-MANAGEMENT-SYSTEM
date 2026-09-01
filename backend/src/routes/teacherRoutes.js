const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// TEACHER MANAGEMENT
// =============================================
router.get('/schools/:schoolId/teachers', authorize('school_admin', 'super_admin'), teacherController.getTeachers);
router.get('/schools/:schoolId/teachers/:teacherId', authorize('school_admin', 'super_admin'), teacherController.getTeacherById);
router.post('/schools/:schoolId/teachers', authorize('school_admin', 'super_admin'), teacherController.createTeacher);
router.put('/schools/:schoolId/teachers/:teacherId', authorize('school_admin', 'super_admin'), teacherController.updateTeacher);
router.delete('/schools/:schoolId/teachers/:teacherId', authorize('school_admin', 'super_admin'), teacherController.deleteTeacher);

module.exports = router;