const express = require('express');
const router = express.Router();
const withdrawalController = require('../controllers/withdrawalController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get withdrawal data
router.get('/schools/:schoolId/data', withdrawalController.getWithdrawalData);

// Withdraw student
router.post('/schools/:schoolId/withdraw', withdrawalController.withdrawStudent);

// Get withdrawn students
router.get('/schools/:schoolId/withdrawn', withdrawalController.getWithdrawnStudents);

// Reinstate student
router.post('/schools/:schoolId/reinstate', withdrawalController.reinstateStudent);

module.exports = router;