const express = require('express');
const router = express.Router();
const subscriptionConfigController = require('../controllers/subscriptionConfigController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and super_admin role
router.use(authenticate);
router.use(authorize('super_admin'));

// =============================================
// SUBSCRIPTION CONFIGURATION
// =============================================
router.get('/schools/:schoolId/config', subscriptionConfigController.getSchoolConfig);
router.put('/schools/:schoolId/config', subscriptionConfigController.updateSubscriptionConfig);
router.get('/schools/:schoolId/billing-summary', subscriptionConfigController.getBillingSummary);

// =============================================
// BILLING WORKFLOW
// =============================================
router.post('/schools/:schoolId/invoices', subscriptionConfigController.generateInvoice);
router.put('/invoices/:invoiceId/pay', subscriptionConfigController.processPayment);
router.post('/billing/automate', subscriptionConfigController.runBillingAutomation);

module.exports = router;