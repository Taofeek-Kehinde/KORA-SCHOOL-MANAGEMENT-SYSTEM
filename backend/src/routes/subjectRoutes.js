const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// SUBJECTS
// =============================================
router.get('/schools/:schoolId/subjects', authorize('school_admin', 'super_admin', 'teacher'), subjectController.getSubjects);
router.post('/schools/:schoolId/subjects', authorize('school_admin', 'super_admin'), subjectController.createSubject);
router.put('/schools/:schoolId/subjects/:subjectId', authorize('school_admin', 'super_admin'), subjectController.updateSubject);
router.delete('/schools/:schoolId/subjects/:subjectId', authorize('school_admin', 'super_admin'), subjectController.deleteSubject);

// =============================================
// SUBJECT ASSIGNMENT
// =============================================
router.post('/schools/:schoolId/subjects/assign-teacher', authorize('school_admin', 'super_admin'), subjectController.assignSubjectToTeacher);

// =============================================
// TEACHER WORKLOAD
// =============================================
router.get('/schools/:schoolId/teacher-workload', authorize('school_admin', 'super_admin', 'teacher'), subjectController.getTeacherWorkload);

module.exports = router;