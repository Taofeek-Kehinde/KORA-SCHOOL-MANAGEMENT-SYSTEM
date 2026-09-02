const express = require('express');
const router = express.Router();
const graduationController = require('../controllers/graduationController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get graduation data
router.get('/schools/:schoolId/data', graduationController.getGraduationData);

// Graduate student
router.post('/schools/:schoolId/graduate', graduationController.graduateStudent);

// Get graduated students (alumni)
router.get('/schools/:schoolId/graduated', graduationController.getGraduatedStudents);

// Get graduation report
router.get('/schools/:schoolId/report', graduationController.getGraduationReport);

module.exports = router;