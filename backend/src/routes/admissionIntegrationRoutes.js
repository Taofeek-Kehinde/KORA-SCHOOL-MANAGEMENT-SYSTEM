// backend/src/routes/admissionIntegrationRoutes.js
const express = require('express');
const router = express.Router();
const admissionIntegrationService = require('../services/admissionIntegrationService');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// ENROLL STUDENT (After approval)
// =============================================
router.post('/schools/:schoolId/applications/:applicationId/enroll', authorize('school_admin', 'admission_officer'), async (req, res) => {
  try {
    const { schoolId, applicationId } = req.params;

    // Get application
    const { data: application } = await supabaseAdmin
      .from('admission_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('school_id', schoolId)
      .single();

    if (!application) {
      return res.status(404).json({ status: 'error', message: 'Application not found' });
    }

    const result = await admissionIntegrationService.enrollStudent(schoolId, application);

    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }

    // Notify parent
    await admissionIntegrationService.notifyStatusChange(
      schoolId,
      applicationId,
      application.status,
      'enrolled'
    );

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        studentId: result.studentId,
        admissionNumber: result.admissionNumber
      }
    });
  } catch (error) {
    console.error('Enroll Route Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to enroll student', error: error.message });
  }
});

// =============================================
// PROCESS ACCEPTANCE FEE
// =============================================
router.post('/schools/:schoolId/applications/:applicationId/pay-acceptance-fee', authorize('parent', 'school_admin'), async (req, res) => {
  try {
    const { schoolId, applicationId } = req.params;
    const paymentData = req.body;

    const result = await admissionIntegrationService.processAcceptanceFee(schoolId, applicationId, paymentData);

    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }

    // Notify parent
    await admissionIntegrationService.notifyStatusChange(
      schoolId,
      applicationId,
      'pending_payment',
      'payment_received',
      'Acceptance fee received'
    );

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: result
    });
  } catch (error) {
    console.error('Acceptance Fee Route Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to process acceptance fee', error: error.message });
  }
});

// =============================================
// GET PARENT'S CHILDREN (Parent Portal)
// =============================================
router.get('/parents/:parentId/children', authorize('parent', 'school_admin'), async (req, res) => {
  try {
    const { parentId } = req.params;

    const result = await admissionIntegrationService.getParentChildren(parentId);

    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }

    res.status(200).json({
      status: 'success',
      data: result.data
    });
  } catch (error) {
    console.error('Get Children Route Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get children', error: error.message });
  }
});

// =============================================
// NOTIFY STATUS CHANGE
// =============================================
router.post('/applications/:applicationId/notify-status', authorize('school_admin', 'admission_officer'), async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { previousStatus, newStatus, reason } = req.body;

    const result = await admissionIntegrationService.notifyStatusChange(
      req.user.schoolId,
      applicationId,
      previousStatus,
      newStatus,
      reason
    );

    if (!result.success) {
      return res.status(500).json({ status: 'error', message: result.error });
    }

    res.status(200).json({
      status: 'success',
      message: result.message
    });
  } catch (error) {
    console.error('Notify Status Route Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to notify status', error: error.message });
  }
});

module.exports = router;