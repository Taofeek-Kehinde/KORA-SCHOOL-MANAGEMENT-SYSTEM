const express = require('express');
const router = express.Router();
const studentNotificationController = require('../controllers/studentNotificationController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Send test notification
router.post('/schools/:schoolId/test', studentNotificationController.sendTestNotification);

// Get parent notifications
router.get('/parents/:parentId/notifications', studentNotificationController.getParentNotifications);

// Mark notification as read
router.put('/notifications/:notificationId/read', studentNotificationController.markAsRead);

// Get unread count
router.get('/parents/:parentId/unread-count', studentNotificationController.getUnreadCount);

module.exports = router;