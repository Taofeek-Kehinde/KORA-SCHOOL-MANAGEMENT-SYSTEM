const express = require('express');
const router = express.Router();
const accountantController = require('../controllers/accountantController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// ACCOUNTANT MANAGEMENT (School Admin only)
// =============================================
router.get('/schools/:schoolId/accountants', authorize('school_admin', 'super_admin'), accountantController.getAccountants);
router.post('/schools/:schoolId/accountants', authorize('school_admin', 'super_admin'), accountantController.createAccountant);
router.put('/schools/:schoolId/accountants/:accountantId', authorize('school_admin', 'super_admin'), accountantController.updateAccountant);
router.delete('/schools/:schoolId/accountants/:accountantId', authorize('school_admin', 'super_admin'), accountantController.deleteAccountant);

// =============================================
// ACCOUNTANT DASHBOARD & FEATURES (Accountant role)
// =============================================
router.get('/schools/:schoolId/dashboard', authorize('accountant', 'school_admin', 'super_admin'), accountantController.getDashboard);
router.get('/schools/:schoolId/invoices', authorize('accountant', 'school_admin', 'super_admin'), accountantController.getInvoices);
router.post('/schools/:schoolId/payments', authorize('accountant', 'school_admin', 'super_admin'), accountantController.processPayment);
router.get('/schools/:schoolId/payments', authorize('accountant', 'school_admin', 'super_admin'), accountantController.getPaymentHistory);
router.get('/schools/:schoolId/outstanding', authorize('accountant', 'school_admin', 'super_admin'), accountantController.getOutstandingFees);
router.get('/schools/:schoolId/report', authorize('accountant', 'school_admin', 'super_admin'), accountantController.getFinancialReport);

module.exports = router;