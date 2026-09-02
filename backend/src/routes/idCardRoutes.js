const express = require('express');
const router = express.Router();
const idCardController = require('../controllers/idCardController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get ID card data
router.get('/schools/:schoolId/data', idCardController.getIDCardData);

// Generate barcode
router.get('/students/:studentId/barcode', idCardController.generateBarcode);

// Generate QR code
router.get('/students/:studentId/qrcode', idCardController.generateQRCode);

// Generate full ID card
router.get('/schools/:schoolId/card', idCardController.generateIDCard);

module.exports = router;