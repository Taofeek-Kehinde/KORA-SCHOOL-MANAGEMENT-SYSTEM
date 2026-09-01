const express = require('express');
const router = express.Router();
const whiteLabelController = require('../controllers/whiteLabelController');
const { authenticate, authorize } = require('../middleware/auth');

// =============================================
// PUBLIC ROUTES (No authentication required)
// =============================================
// Get custom login page (public)
router.get('/schools/:schoolId/white-label/login-page', whiteLabelController.getCustomLoginPage);

// Get school by custom domain (public)
router.get('/domain/:domain', whiteLabelController.getSchoolByDomain);

// =============================================
// PROTECTED ROUTES (Authentication required)
// =============================================
router.use(authenticate);

// =============================================
// WHITE LABEL MANAGEMENT (Page 14)
// =============================================
router.get(
  '/schools/:schoolId/white-label',
  authorize('school_admin', 'super_admin'),
  whiteLabelController.getWhiteLabelConfig
);

router.put(
  '/schools/:schoolId/white-label',
  authorize('school_admin', 'super_admin'),
  whiteLabelController.updateWhiteLabelConfig
);

router.get(
  '/schools/:schoolId/white-label/domain',
  authorize('school_admin', 'super_admin'),
  whiteLabelController.checkCustomDomain
);

// =============================================
// CUSTOM DOMAIN VERIFICATION
// =============================================
router.post(
  '/schools/:schoolId/white-label/domain/verify',
  authorize('school_admin', 'super_admin'),
  whiteLabelController.verifyCustomDomain
);

// =============================================
// CUSTOM LOGIN PAGE
// =============================================
router.post(
  '/schools/:schoolId/white-label/login-page',
  authorize('school_admin', 'super_admin'),
  whiteLabelController.generateCustomLoginPage
);

router.delete(
  '/schools/:schoolId/white-label/login-page',
  authorize('school_admin', 'super_admin'),
  whiteLabelController.deleteCustomLoginPage
);

module.exports = router;