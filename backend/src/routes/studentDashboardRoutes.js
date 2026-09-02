const express = require('express');
const router = express.Router();
const studentDashboardController = require('../controllers/studentDashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

const requireStudentSelfAccess = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. Students can only access their own dashboard.'
    });
  }

  if (req.user.studentId && req.params.studentId && req.user.studentId !== req.params.studentId) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. You cannot access another student record.'
    });
  }

  next();
};

router.get('/students/:studentId/dashboard', authorize('student'), requireStudentSelfAccess, studentDashboardController.getStudentDashboard);

module.exports = router;