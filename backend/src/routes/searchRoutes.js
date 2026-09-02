const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Search students
router.get('/schools/:schoolId/students/search', searchController.searchStudents);

module.exports = router;