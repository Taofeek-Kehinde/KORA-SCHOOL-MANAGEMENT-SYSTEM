const express = require('express');
const router = express.Router();
const studentLifecycleController = require('../controllers/studentLifecycleController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Get lifecycle dashboard
router.get('/schools/:schoolId/dashboard', authorize('school_admin', 'super_admin'), studentLifecycleController.getLifecycleDashboard);

// Get students by stage
router.get('/schools/:schoolId/students', authorize('school_admin', 'super_admin', 'teacher'), studentLifecycleController.getStudentsByStage);

// Update lifecycle stage
router.post('/schools/:schoolId/update', authorize('school_admin', 'super_admin'), studentLifecycleController.updateLifecycleStage);

// Get lifecycle status for a student
router.get('/schools/:schoolId/status', authorize('school_admin', 'super_admin', 'teacher'), studentLifecycleController.getLifecycleStatus);

module.exports = router;