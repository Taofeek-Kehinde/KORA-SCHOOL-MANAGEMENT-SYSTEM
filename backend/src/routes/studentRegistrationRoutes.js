const express = require('express');
const router = express.Router();
const multer = require('multer');
const studentRegistrationController = require('../controllers/studentRegistrationController');
const { authenticate, authorize } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// All routes require authentication
router.use(authenticate);

// =============================================
// STUDENT REGISTRATION (V2)
// =============================================
router.get('/schools/:schoolId/students', authorize('school_admin', 'super_admin'), studentRegistrationController.getStudents);
router.get('/schools/:schoolId/students/:studentId', authorize('school_admin', 'super_admin'), studentRegistrationController.getStudentById);
router.post('/schools/:schoolId/students/register', authorize('school_admin', 'super_admin'), upload.array('files'), studentRegistrationController.registerStudent);
router.put('/schools/:schoolId/students/:studentId', authorize('school_admin', 'super_admin'), studentRegistrationController.updateStudent);
router.delete('/schools/:schoolId/students/:studentId', authorize('school_admin', 'super_admin'), studentRegistrationController.deleteStudent);

// =============================================
// STUDENT HISTORY
// =============================================
router.get('/schools/:schoolId/students/:studentId/history', authorize('school_admin', 'super_admin'), studentRegistrationController.getStudentHistory);

// =============================================
// STUDENT DOCUMENTS
// =============================================
router.post('/schools/:schoolId/students/:studentId/documents', authorize('school_admin', 'super_admin'), upload.single('file'), studentRegistrationController.uploadStudentDocument);
router.delete('/schools/:schoolId/students/:studentId/documents/:documentId', authorize('school_admin', 'super_admin'), studentRegistrationController.deleteStudentDocument);

module.exports = router;