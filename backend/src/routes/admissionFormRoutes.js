const express = require('express');
const router = express.Router();
const admissionFormBuilderController = require('../controllers/admissionFormBuilderController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// GET FORM SETTINGS
// =============================================
router.get('/schools/:schoolId/settings', authorize('school_admin'), admissionFormBuilderController.getFormSettings);

// =============================================
// UPDATE FORM SETTINGS
// =============================================
router.put('/schools/:schoolId/settings', authorize('school_admin'), admissionFormBuilderController.updateFormSettings);

module.exports = router;