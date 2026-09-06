const express = require('express');
const router = express.Router();
const academicReportController = require('../controllers/academicReportController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// ACADEMIC REPORTS
// =============================================
router.get('/schools/:schoolId/class-performance', authorize('school_admin', 'super_admin', 'teacher'), academicReportController.getClassPerformance);
router.get('/schools/:schoolId/department-performance', authorize('school_admin', 'super_admin'), academicReportController.getDepartmentPerformance);
router.get('/schools/:schoolId/subject-enrollment', authorize('school_admin', 'super_admin'), academicReportController.getSubjectEnrollment);
router.get('/schools/:schoolId/teacher-workload-report', authorize('school_admin', 'super_admin'), academicReportController.getTeacherWorkloadReport);

module.exports = router;