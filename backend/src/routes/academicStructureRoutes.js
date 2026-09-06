const express = require('express');
const router = express.Router();
const academicStructureController = require('../controllers/academicStructureController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// SESSIONS
// =============================================
router.get('/schools/:schoolId/sessions', authorize('school_admin', 'super_admin', 'teacher'), academicStructureController.getSessions);
router.post('/schools/:schoolId/sessions', authorize('school_admin', 'super_admin'), academicStructureController.createSession);
router.put('/schools/:schoolId/sessions/:sessionId', authorize('school_admin', 'super_admin'), academicStructureController.updateSession);
router.delete('/schools/:schoolId/sessions/:sessionId', authorize('school_admin', 'super_admin'), academicStructureController.deleteSession);

// =============================================
// TERMS
// =============================================
router.get('/schools/:schoolId/terms', authorize('school_admin', 'super_admin', 'teacher'), academicStructureController.getTerms);
router.post('/schools/:schoolId/terms', authorize('school_admin', 'super_admin'), academicStructureController.createTerm);
router.put('/schools/:schoolId/terms/:termId', authorize('school_admin', 'super_admin'), academicStructureController.updateTerm);
router.delete('/schools/:schoolId/terms/:termId', authorize('school_admin', 'super_admin'), academicStructureController.deleteTerm);

// =============================================
// DEPARTMENTS
// =============================================
router.get('/schools/:schoolId/departments', authorize('school_admin', 'super_admin', 'teacher'), academicStructureController.getDepartments);
router.post('/schools/:schoolId/departments', authorize('school_admin', 'super_admin'), academicStructureController.createDepartment);
router.put('/schools/:schoolId/departments/:departmentId', authorize('school_admin', 'super_admin'), academicStructureController.updateDepartment);
router.delete('/schools/:schoolId/departments/:departmentId', authorize('school_admin', 'super_admin'), academicStructureController.deleteDepartment);

// =============================================
// CLASSES
// =============================================
router.get('/schools/:schoolId/classes', authorize('school_admin', 'super_admin', 'teacher'), academicStructureController.getClasses);
router.post('/schools/:schoolId/classes', authorize('school_admin', 'super_admin'), academicStructureController.createClass);
router.put('/schools/:schoolId/classes/:classId', authorize('school_admin', 'super_admin'), academicStructureController.updateClass);
router.delete('/schools/:schoolId/classes/:classId', authorize('school_admin', 'super_admin'), academicStructureController.deleteClass);

// =============================================
// CLASS ARMS
// =============================================
router.get('/schools/:schoolId/arms', authorize('school_admin', 'super_admin', 'teacher'), academicStructureController.getClassArms);
router.post('/schools/:schoolId/arms', authorize('school_admin', 'super_admin'), academicStructureController.createClassArm);
router.put('/schools/:schoolId/arms/:armId', authorize('school_admin', 'super_admin'), academicStructureController.updateClassArm);
router.delete('/schools/:schoolId/arms/:armId', authorize('school_admin', 'super_admin'), academicStructureController.deleteClassArm);

module.exports = router;