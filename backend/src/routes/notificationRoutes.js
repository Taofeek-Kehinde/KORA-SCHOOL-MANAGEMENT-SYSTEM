const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// NOTIFICATIONS
// =============================================
router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.put('/notifications/:notificationId/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);
router.post('/notifications/send', authorize('super_admin', 'school_admin'), notificationController.sendNotification);

module.exports = router;