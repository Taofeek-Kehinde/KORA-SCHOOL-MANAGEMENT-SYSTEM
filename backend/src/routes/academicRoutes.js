const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const academicController = require('../controllers/academicController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// ACADEMIC SESSIONS
// =============================================
router.get('/schools/:schoolId/sessions', authorize('school_admin', 'super_admin', 'teacher'), academicController.getSessions);
router.post('/schools/:schoolId/sessions', authorize('school_admin', 'super_admin'), academicController.createSession);
router.put('/schools/:schoolId/sessions/:sessionId', authorize('school_admin', 'super_admin'), academicController.updateSession);
router.delete('/schools/:schoolId/sessions/:sessionId', authorize('school_admin', 'super_admin'), academicController.deleteSession);

// =============================================
// TERMS
// =============================================
router.get('/schools/:schoolId/terms', authorize('school_admin', 'super_admin', 'teacher'), academicController.getTerms);
router.post('/schools/:schoolId/terms', authorize('school_admin', 'super_admin'), academicController.createTerm);
router.put('/schools/:schoolId/terms/:termId', authorize('school_admin', 'super_admin'), academicController.updateTerm);
router.delete('/schools/:schoolId/terms/:termId', authorize('school_admin', 'super_admin'), academicController.deleteTerm);

// =============================================
// TEACHERS (for dropdowns)
// =============================================
router.get('/schools/:schoolId/teachers', authorize('school_admin', 'super_admin', 'teacher'), academicController.getTeachers);

// =============================================
// CLASSES
// =============================================
router.get('/schools/:schoolId/classes', authorize('school_admin', 'super_admin', 'teacher', 'parent'), academicController.getClasses);
router.post('/schools/:schoolId/classes', authorize('school_admin', 'super_admin'), academicController.createClass);
router.put('/schools/:schoolId/classes/:classId', authorize('school_admin', 'super_admin'), academicController.updateClass);
router.delete('/schools/:schoolId/classes/:classId', authorize('school_admin', 'super_admin'), academicController.deleteClass);

// =============================================
// SUBJECTS
// =============================================
router.get('/schools/:schoolId/subjects', authorize('school_admin', 'super_admin', 'teacher'), subjectController.getSubjects);
router.post('/schools/:schoolId/subjects', authorize('school_admin', 'super_admin'), subjectController.createSubject);
router.put('/schools/:schoolId/subjects/:subjectId', authorize('school_admin', 'super_admin'), subjectController.updateSubject);
router.delete('/schools/:schoolId/subjects/:subjectId', authorize('school_admin', 'super_admin'), subjectController.deleteSubject);

// =============================================
// SUBJECT ASSIGNMENT (class-subject linking)
// =============================================
router.post('/schools/:schoolId/subjects/assign', authorize('school_admin', 'super_admin'), academicController.assignSubjectToClass);
router.post('/schools/:schoolId/subjects/remove', authorize('school_admin', 'super_admin'), academicController.removeSubjectFromClass);
router.post('/schools/:schoolId/subjects/assign-teacher', authorize('school_admin', 'super_admin'), subjectController.assignSubjectToTeacher);

// =============================================
// TEACHER WORKLOAD
// =============================================
router.get('/schools/:schoolId/teacher-workload', authorize('school_admin', 'super_admin', 'teacher'), subjectController.getTeacherWorkload);

// =============================================
// DEPARTMENTS
// =============================================
router.get('/schools/:schoolId/departments', authorize('school_admin', 'super_admin', 'teacher'), academicController.getDepartments);
router.post('/schools/:schoolId/departments', authorize('school_admin', 'super_admin'), academicController.createDepartment);
router.put('/schools/:schoolId/departments/:departmentId', authorize('school_admin', 'super_admin'), academicController.updateDepartment);
router.delete('/schools/:schoolId/departments/:departmentId', authorize('school_admin', 'super_admin'), academicController.deleteDepartment);

// =============================================
// GRADING SYSTEM
// =============================================
router.get('/schools/:schoolId/grading-system', authorize('school_admin', 'super_admin', 'teacher'), academicController.getGradingSystem);
router.post('/schools/:schoolId/grading-system', authorize('school_admin', 'super_admin'), academicController.createGradingRule);
router.put('/schools/:schoolId/grading-system/:ruleId', authorize('school_admin', 'super_admin'), academicController.updateGradingRule);
router.delete('/schools/:schoolId/grading-system/:ruleId', authorize('school_admin', 'super_admin'), academicController.deleteGradingRule);

// =============================================
// SCHOOL PROFILE
// =============================================
router.get('/schools/:schoolId/profile', authorize('school_admin', 'super_admin'), academicController.getSchoolProfile);
router.put('/schools/:schoolId/profile', authorize('school_admin', 'super_admin'), academicController.updateSchoolProfile);

module.exports = router;