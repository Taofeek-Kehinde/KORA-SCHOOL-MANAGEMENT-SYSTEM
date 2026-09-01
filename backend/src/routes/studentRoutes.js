const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// STUDENT MANAGEMENT
// =============================================
router.get('/schools/:schoolId/students', authorize('school_admin', 'super_admin'), studentController.getStudents);
router.get('/schools/:schoolId/students/:studentId', authorize('school_admin', 'super_admin'), studentController.getStudentById);
router.post('/schools/:schoolId/students', authorize('school_admin', 'super_admin'), studentController.createStudent);
router.put('/schools/:schoolId/students/:studentId', authorize('school_admin', 'super_admin'), studentController.updateStudent);
router.delete('/schools/:schoolId/students/:studentId', authorize('school_admin', 'super_admin'), studentController.deleteStudent);
router.post('/schools/:schoolId/students/bulk-import', authorize('school_admin', 'super_admin'), studentController.bulkImportStudents);

module.exports = router;