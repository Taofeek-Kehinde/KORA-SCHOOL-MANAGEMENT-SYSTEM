const express = require('express');
const router = express.Router();
const studentDashboardController = require('../controllers/studentDashboardController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get complete student dashboard
router.get('/students/:studentId/dashboard', studentDashboardController.getStudentDashboard);

module.exports = router;