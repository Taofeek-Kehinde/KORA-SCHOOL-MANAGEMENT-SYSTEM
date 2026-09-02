const express = require('express');
const router = express.Router();
const accountantController = require('../controllers/accountantController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);
router.use(authorize('accountant', 'school_admin', 'super_admin'));

// Get accountant dashboard
router.get('/schools/:schoolId/dashboard', accountantController.getDashboard);

// Get all invoices
router.get('/schools/:schoolId/invoices', accountantController.getInvoices);

// Process payment
router.post('/schools/:schoolId/payments', accountantController.processPayment);

// Get payment history
router.get('/schools/:schoolId/payments', accountantController.getPaymentHistory);

// Get outstanding fees
router.get('/schools/:schoolId/outstanding', accountantController.getOutstandingFees);

// Get financial report
router.get('/schools/:schoolId/report', accountantController.getFinancialReport);

module.exports = router;