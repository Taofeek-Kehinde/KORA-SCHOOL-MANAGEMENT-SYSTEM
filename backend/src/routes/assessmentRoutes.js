const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// CA COMPONENTS
// =============================================
router.get('/schools/:schoolId/ca-components', authorize('school_admin', 'super_admin', 'teacher'), assessmentController.getCAComponents);
router.post('/schools/:schoolId/ca-components', authorize('school_admin', 'super_admin'), assessmentController.createCAComponent);
router.put('/schools/:schoolId/ca-components/:componentId', authorize('school_admin', 'super_admin'), assessmentController.updateCAComponent);
router.delete('/schools/:schoolId/ca-components/:componentId', authorize('school_admin', 'super_admin'), assessmentController.deleteCAComponent);

// =============================================
// CA SCORES
// =============================================
router.post('/schools/:schoolId/ca-scores', authorize('teacher', 'school_admin'), assessmentController.enterCAScores);
router.get('/schools/:schoolId/ca-scores', authorize('teacher', 'school_admin', 'super_admin'), assessmentController.getCAScores);

// =============================================
// CALCULATE FINAL SCORE
// =============================================
router.post('/schools/:schoolId/calculate-final-score', authorize('teacher', 'school_admin', 'super_admin'), assessmentController.calculateFinalScore);

module.exports = router;