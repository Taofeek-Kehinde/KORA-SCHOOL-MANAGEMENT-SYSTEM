const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and super_admin role
router.use(authenticate);
router.use(authorize('super_admin'));

// =============================================
// BILLING WORKFLOW (All 9 Steps)
// =============================================
// Run full billing workflow (Steps 1-5)
router.post('/schools/:schoolId/billing/workflow', billingController.runFullBillingWorkflow);

// Process payment (Steps 6-9)
router.post('/invoices/:invoiceId/pay', billingController.processPayment);

// Get billing status
router.get('/schools/:schoolId/billing/status', billingController.getBillingStatus);

module.exports = router;