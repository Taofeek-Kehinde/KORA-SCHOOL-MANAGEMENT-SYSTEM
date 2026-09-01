const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// AI ASSISTANT (Pages 15-16)
// =============================================
router.post('/schools/:schoolId/query', aiController.processQuery);
router.get('/schools/:schoolId/history', aiController.getQueryHistory);
router.get('/schools/:schoolId/suggestions', aiController.getSuggestions);

module.exports = router;