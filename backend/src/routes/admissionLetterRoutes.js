const express = require('express');
const router = express.Router();
const admissionLetterController = require('../controllers/admissionLetterController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// GENERATE ADMISSION LETTER
// =============================================
router.post('/schools/:schoolId/applications/:applicationId/letters', authorize('school_admin', 'admission_officer'), admissionLetterController.generateAdmissionLetter);

// =============================================
// GET APPLICATION LETTERS
// =============================================
router.get('/applications/:applicationId/letters', authorize('school_admin', 'admission_officer', 'parent'), admissionLetterController.getApplicationLetters);

module.exports = router;