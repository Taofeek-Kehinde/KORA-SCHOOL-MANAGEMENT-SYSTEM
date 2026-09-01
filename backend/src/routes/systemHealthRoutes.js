const express = require('express');
const router = express.Router();
const systemHealthController = require('../controllers/systemHealthController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// SYSTEM HEALTH
// =============================================
router.get('/health', authorize('super_admin'), systemHealthController.getSystemHealth);
router.get('/health/history', authorize('super_admin'), systemHealthController.getSystemHealthHistory);
router.get('/storage', authorize('super_admin'), systemHealthController.getStorageDetails);

module.exports = router;