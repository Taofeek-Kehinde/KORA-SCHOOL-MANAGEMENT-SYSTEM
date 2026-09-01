const express = require('express');
const router = express.Router();
const multer = require('multer');
const profileController = require('../controllers/schoolProfileController');
const { authenticate, authorize } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, and images are allowed.'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// Get profile
router.get('/schools/:schoolId/profile', authorize('school_admin', 'super_admin'), profileController.getProfile);

// Update profile
router.put('/schools/:schoolId/profile', authorize('school_admin', 'super_admin'), profileController.updateProfile);

// Get school stats
router.get('/schools/:schoolId/stats', authorize('school_admin', 'super_admin'), profileController.getSchoolStats);

// Upload document
router.post(
  '/schools/:schoolId/documents',
  authorize('school_admin', 'super_admin'),
  upload.single('file'),
  profileController.uploadDocument
);

// Delete document
router.delete(
  '/schools/:schoolId/documents/:documentId',
  authorize('school_admin', 'super_admin'),
  profileController.deleteDocument
);

module.exports = router;