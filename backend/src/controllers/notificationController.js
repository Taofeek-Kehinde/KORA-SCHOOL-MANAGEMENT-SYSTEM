const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');

class NotificationController {
  // =============================================
  // GET USER NOTIFICATIONS
  // =============================================
  async getNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const result = await notificationService.getUserNotifications(userId, limit, offset);

      if (!result.success) {
        return res.status(500).json({
          status: 'error',
          message: result.error
        });
      }

      // Get unread count
      const unreadResult = await notificationService.getUnreadCount(userId);

      res.status(200).json({
        status: 'success',
        data: result.data,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: result.count
        },
        unread_count: unreadResult.count || 0
      });
    } catch (error) {
      console.error('Get Notifications Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }
  }

  // =============================================
  // MARK NOTIFICATION AS READ
  // =============================================
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const result = await notificationService.markAsRead(notificationId, userId);

      if (!result.success) {
        return res.status(500).json({
          status: 'error',
          message: result.error
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Notification marked as read',
        data: result.data
      });
    } catch (error) {
      console.error('Mark As Read Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  // =============================================
  // MARK ALL AS READ
  // =============================================
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      const result = await notificationService.markAllAsRead(userId);

      if (!result.success) {
        return res.status(500).json({
          status: 'error',
          message: result.error
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Mark All As Read Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to mark all as read',
        error: error.message
      });
    }
  }

  // =============================================
  // GET UNREAD COUNT
  // =============================================
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;

      const result = await notificationService.getUnreadCount(userId);

      if (!result.success) {
        return res.status(500).json({
          status: 'error',
          message: result.error
        });
      }

      res.status(200).json({
        status: 'success',
        data: { unread_count: result.count || 0 }
      });
    } catch (error) {
      console.error('Get Unread Count Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get unread count',
        error: error.message
      });
    }
  }

  // =============================================
  // SEND NOTIFICATION (Admin only)
  // =============================================
  async sendNotification(req, res) {
    try {
      const { schoolId, userId, title, message, type, link } = req.body;
      const { adminId } = req.user;

      if (!title || !message) {
        return res.status(400).json({
          status: 'error',
          message: 'Title and message are required'
        });
      }

      const result = await notificationService.createNotification({
        schoolId: schoolId || null,
        userId: userId || null,
        title,
        message,
        type: type || 'in_app',
        link: link || null
      });

      if (!result.success) {
        return res.status(500).json({
          status: 'error',
          message: result.error
        });
      }

      res.status(201).json({
        status: 'success',
        message: 'Notification sent successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Send Notification Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send notification',
        error: error.message
      });
    }
  }
}

module.exports = new NotificationController();