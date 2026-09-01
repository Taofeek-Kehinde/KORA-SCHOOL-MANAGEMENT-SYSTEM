const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/schools/:schoolId/staff', authorize('school_admin', 'super_admin'), staffController.getStaff);
router.post('/schools/:schoolId/staff', authorize('school_admin', 'super_admin'), staffController.createStaff);
router.put('/schools/:schoolId/staff/:staffId', authorize('school_admin', 'super_admin'), staffController.updateStaff);
router.delete('/schools/:schoolId/staff/:staffId', authorize('school_admin', 'super_admin'), staffController.deleteStaff);

module.exports = router;