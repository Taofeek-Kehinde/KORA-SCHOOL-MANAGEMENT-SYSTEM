const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get promotion data
router.get('/schools/:schoolId/data', promotionController.getPromotionData);

// Promote students
router.post('/schools/:schoolId/promote', promotionController.promoteStudents);

// Hold promotion pending approval
router.post('/schools/:schoolId/hold', promotionController.holdPromotion);

// Approve/Reject promotion
router.put('/schools/:schoolId/approve', promotionController.approvePromotion);

// Get pending promotions
router.get('/schools/:schoolId/pending', promotionController.getPendingPromotions);

// Generate promotion report
router.get('/schools/:schoolId/report', promotionController.generatePromotionReport);

module.exports = router;