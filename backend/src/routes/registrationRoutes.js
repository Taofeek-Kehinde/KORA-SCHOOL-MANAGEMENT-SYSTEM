const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { authenticate, authorize } = require('../middleware/auth');

// =============================================
// PUBLIC ROUTES (School Registration)
// =============================================
router.post('/start', registrationController.startRegistration);
router.post('/details', registrationController.enterSchoolDetails);
router.post('/verify-email', registrationController.verifyEmail);
router.post('/resend-email', registrationController.resendEmailVerification);
router.post('/verify-phone', registrationController.verifyPhone);
router.post('/resend-phone', registrationController.resendPhoneVerification);
router.post('/submit-review', registrationController.submitForReview);

// =============================================
// PROTECTED ROUTES (Admin)
// =============================================
router.put(
  '/registrations/:registrationId/approve',
  authenticate,
  authorize('super_admin'),
  registrationController.approveRegistration
);
router.put(
  '/registrations/:registrationId/reject',
  authenticate,
  authorize('super_admin'),
  registrationController.rejectRegistration
);

// =============================================
// SCHOOL PROFILE (Pages 11-12)
// =============================================
router.put(
  '/schools/:schoolId/profile',
  authenticate,
  authorize('school_admin', 'super_admin'),
  registrationController.configureSchoolProfile
);
router.get(
  '/schools/:schoolId/profile',
  authenticate,
  authorize('school_admin', 'super_admin'),
  registrationController.getSchoolProfile
);

module.exports = router;