const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and super_admin role
router.use(authenticate);
router.use(authorize('super_admin'));

// =============================================
// SCHOOL MANAGEMENT
// =============================================
router.post('/schools', schoolController.createSchool);

module.exports = router;