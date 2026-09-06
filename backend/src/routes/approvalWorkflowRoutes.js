const express = require('express');
const router = express.Router();
const approvalWorkflowController = require('../controllers/approvalWorkflowController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// APPROVAL WORKFLOWS
// =============================================
router.get('/schools/:schoolId/approval-workflows', authorize('school_admin', 'super_admin'), approvalWorkflowController.getApprovalWorkflows);
router.post('/schools/:schoolId/approval-workflows/configure', authorize('school_admin', 'super_admin'), approvalWorkflowController.configureApprovalWorkflow);

// =============================================
// APPROVAL RECORDS
// =============================================
router.get('/schools/:schoolId/approval-records', authorize('school_admin', 'super_admin'), approvalWorkflowController.getApprovalRecords);
router.post('/schools/:schoolId/approval-records/submit', authorize('school_admin', 'super_admin'), approvalWorkflowController.submitForApproval);
router.put('/schools/:schoolId/approval-records/:approvalId/process', authorize('school_admin', 'super_admin'), approvalWorkflowController.processApproval);

module.exports = router;