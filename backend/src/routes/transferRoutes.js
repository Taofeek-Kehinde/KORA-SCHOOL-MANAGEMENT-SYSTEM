const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get transfer data
router.get('/schools/:schoolId/data', transferController.getTransferData);

// Internal transfer
router.post('/schools/:schoolId/internal', transferController.internalTransfer);

// External transfer
router.post('/schools/:schoolId/external', transferController.externalTransfer);

// Get transfer history
router.get('/schools/:schoolId/history', transferController.getTransferHistory);

module.exports = router;