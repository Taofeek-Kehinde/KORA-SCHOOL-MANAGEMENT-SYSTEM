const express = require('express');
const router = express.Router();
const schemeOfWorkController = require('../controllers/schemeOfWorkController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// SCHEMES OF WORK
// =============================================
router.get('/schools/:schoolId/schemes-of-work', authorize('teacher', 'school_admin', 'super_admin'), schemeOfWorkController.getSchemesOfWork);
router.post('/schools/:schoolId/schemes-of-work', authorize('teacher', 'school_admin'), schemeOfWorkController.createSchemeOfWork);
router.put('/schools/:schoolId/schemes-of-work/:schemeId', authorize('teacher', 'school_admin'), schemeOfWorkController.updateSchemeOfWork);
router.delete('/schools/:schoolId/schemes-of-work/:schemeId', authorize('teacher', 'school_admin'), schemeOfWorkController.deleteSchemeOfWork);

// =============================================
// APPROVAL
// =============================================
router.put('/schools/:schoolId/schemes-of-work/:schemeId/approve', authorize('school_admin', 'super_admin'), schemeOfWorkController.approveSchemeOfWork);
router.get('/schools/:schoolId/schemes-of-work/pending', authorize('school_admin', 'super_admin'), schemeOfWorkController.getPendingSchemesOfWork);

module.exports = router;