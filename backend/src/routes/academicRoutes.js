const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// ACADEMIC SESSIONS
// =============================================
router.get('/schools/:schoolId/sessions', authorize('school_admin', 'super_admin'), academicController.getSessions);
router.post('/schools/:schoolId/sessions', authorize('school_admin', 'super_admin'), academicController.createSession);
router.put('/schools/:schoolId/sessions/:sessionId', authorize('school_admin', 'super_admin'), academicController.updateSession);
router.delete('/schools/:schoolId/sessions/:sessionId', authorize('school_admin', 'super_admin'), academicController.deleteSession);

// =============================================
// TERMS
// =============================================
router.get('/schools/:schoolId/terms', authorize('school_admin', 'super_admin'), academicController.getTerms);
router.post('/schools/:schoolId/terms', authorize('school_admin', 'super_admin'), academicController.createTerm);
router.put('/schools/:schoolId/terms/:termId', authorize('school_admin', 'super_admin'), academicController.updateTerm);
router.delete('/schools/:schoolId/terms/:termId', authorize('school_admin', 'super_admin'), academicController.deleteTerm);

// =============================================
// CLASSES
// =============================================
router.get('/schools/:schoolId/classes', authorize('school_admin', 'super_admin'), academicController.getClasses);
router.post('/schools/:schoolId/classes', authorize('school_admin', 'super_admin'), academicController.createClass);
router.put('/schools/:schoolId/classes/:classId', authorize('school_admin', 'super_admin'), academicController.updateClass);
router.delete('/schools/:schoolId/classes/:classId', authorize('school_admin', 'super_admin'), academicController.deleteClass);

// =============================================
// SUBJECTS
// =============================================
router.get('/schools/:schoolId/subjects', authorize('school_admin', 'super_admin'), academicController.getSubjects);
router.post('/schools/:schoolId/subjects', authorize('school_admin', 'super_admin'), academicController.createSubject);
router.put('/schools/:schoolId/subjects/:subjectId', authorize('school_admin', 'super_admin'), academicController.updateSubject);
router.delete('/schools/:schoolId/subjects/:subjectId', authorize('school_admin', 'super_admin'), academicController.deleteSubject);
router.post('/schools/:schoolId/subjects/assign', authorize('school_admin', 'super_admin'), academicController.assignSubjectToClass);
router.post('/schools/:schoolId/subjects/remove', authorize('school_admin', 'super_admin'), academicController.removeSubjectFromClass);

// =============================================
// DEPARTMENTS
// =============================================
router.get('/schools/:schoolId/departments', authorize('school_admin', 'super_admin'), academicController.getDepartments);
router.post('/schools/:schoolId/departments', authorize('school_admin', 'super_admin'), academicController.createDepartment);
router.put('/schools/:schoolId/departments/:departmentId', authorize('school_admin', 'super_admin'), academicController.updateDepartment);
router.delete('/schools/:schoolId/departments/:departmentId', authorize('school_admin', 'super_admin'), academicController.deleteDepartment);

// =============================================
// GRADING SYSTEM
// =============================================
router.get('/schools/:schoolId/grading', authorize('school_admin', 'super_admin'), academicController.getGradingSystem);
router.post('/schools/:schoolId/grading', authorize('school_admin', 'super_admin'), academicController.createGradingRule);
router.put('/schools/:schoolId/grading/:ruleId', authorize('school_admin', 'super_admin'), academicController.updateGradingRule);
router.delete('/schools/:schoolId/grading/:ruleId', authorize('school_admin', 'super_admin'), academicController.deleteGradingRule);

// =============================================
// SCHOOL PROFILE (Colours, Motto, Signature, Report Card)
// =============================================
router.get('/schools/:schoolId/profile', authorize('school_admin', 'super_admin'), academicController.getSchoolProfile);
router.put('/schools/:schoolId/profile', authorize('school_admin', 'super_admin'), academicController.updateSchoolProfile);
router.get('/schools/:schoolId/teachers', authorize('school_admin', 'super_admin'), academicController.getTeachers);

module.exports = router;