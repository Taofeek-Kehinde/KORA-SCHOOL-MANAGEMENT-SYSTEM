const express = require('express');
const router = express.Router();
const multer = require('multer');
const bulkImportController = require('../controllers/bulkImportController');
const { authenticate } = require('../middleware/auth');

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /xlsx|xls|csv/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only Excel/CSV files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// Upload and parse file
router.post('/schools/:schoolId/upload', upload.single('file'), bulkImportController.uploadAndParse);

// Preview data
router.post('/schools/:schoolId/preview', bulkImportController.previewData);

// Import students
router.post('/schools/:schoolId/import', bulkImportController.importStudents);

// Download template
router.get('/template', bulkImportController.downloadTemplate);

module.exports = router;