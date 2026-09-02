const studentNotificationService = require('../services/studentNotificationService');

class StudentNotificationController {
  // =============================================
  // SEND TEST NOTIFICATION
  // =============================================
  sendTestNotification = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { studentId, title, message, channels } = req.body;

      // Get student
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .single();

      if (!student) {
        return res.status(404).json({
          status: 'error',
          message: 'Student not found'
        });
      }

      // Get school
      const { data: school } = await supabaseAdmin
        .from('schools')
        .select('name')
        .eq('id', schoolId)
        .single();

      const results = await studentNotificationService.notifyStudentParents({
        schoolId,
        schoolName: school.name,
        student,
        title: title || 'Test Notification',
        message: message || 'This is a test notification.',
        type: 'test',
        channels: channels || ['in_app', 'email', 'sms']
      });

      res.status(200).json({
        status: 'success',
        message: `Sent ${results.notifications_sent} notifications to ${results.total_parents} parents`,
        data: results
      });
    } catch (error) {
      console.error('Send Test Notification Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to send test notification',
        error: error.message
      });
    }
  };

  // =============================================
  // GET PARENT NOTIFICATIONS
  // =============================================
  getParentNotifications = async (req, res) => {
    try {
      const { parentId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const { data, error, count } = await supabaseAdmin
        .from('notifications')
        .select(`
          *,
          students!student_id(first_name, last_name, admission_number)
        `, { count: 'exact' })
        .eq('parent_id', parentId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: count || 0
        }
      });
    } catch (error) {
      console.error('Get Parent Notifications Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get parent notifications',
        error: error.message
      });
    }
  };

  // =============================================
  // MARK NOTIFICATION AS READ
  // =============================================
  markAsRead = async (req, res) => {
    try {
      const { notificationId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, read_at: new Date() })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'Notification marked as read',
        data
      });
    } catch (error) {
      console.error('Mark As Read Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  };

  // =============================================
  // GET UNREAD COUNT
  // =============================================
  getUnreadCount = async (req, res) => {
    try {
      const { parentId } = req.params;

      const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', parentId)
        .eq('is_read', false);

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: { unread_count: count || 0 }
      });
    } catch (error) {
      console.error('Get Unread Count Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get unread count',
        error: error.message
      });
    }
  };
}

module.exports = new StudentNotificationController();