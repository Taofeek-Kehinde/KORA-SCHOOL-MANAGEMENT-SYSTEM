const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// PARENT MANAGEMENT
// =============================================
router.get('/schools/:schoolId/parents', authorize('school_admin', 'super_admin'), parentController.getParents);
router.get('/schools/:schoolId/parents/:parentId', authorize('school_admin', 'super_admin'), parentController.getParentById);
router.post('/schools/:schoolId/parents', authorize('school_admin', 'super_admin'), parentController.createParent);
router.put('/schools/:schoolId/parents/:parentId', authorize('school_admin', 'super_admin'), parentController.updateParent);
router.delete('/schools/:schoolId/parents/:parentId', authorize('school_admin', 'super_admin'), parentController.deleteParent);

module.exports = router;