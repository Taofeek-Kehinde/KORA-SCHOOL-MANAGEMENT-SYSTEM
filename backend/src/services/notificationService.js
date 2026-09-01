const { supabaseAdmin } = require('../config/supabase');

class NotificationService {
  // =============================================
  // CREATE IN-APP NOTIFICATION
  // =============================================
  async createNotification({ schoolId, userId, title, message, type = 'in_app', link = null }) {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert({
          school_id: schoolId,
          user_id: userId,
          title,
          message,
          type,
          link,
          is_read: false,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Create notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // GET USER NOTIFICATIONS
  // =============================================
  async getUserNotifications(userId, limit = 20, offset = 0) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { success: true, data, count };
    } catch (error) {
      console.error('Get notifications error:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // MARK NOTIFICATION AS READ
  // =============================================
  async markAsRead(notificationId, userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, read_at: new Date() })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Mark as read error:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // MARK ALL NOTIFICATIONS AS READ
  // =============================================
  async markAllAsRead(userId) {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true, read_at: new Date() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Mark all as read error:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // GET UNREAD COUNT
  // =============================================
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Get unread count error:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // SEND SCHOOL NOTIFICATION (To all admins)
  // =============================================
  async sendSchoolNotification(schoolId, title, message, type = 'in_app') {
    try {
      // Get all school admins
      const { data: admins, error: adminError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('school_id', schoolId)
        .in('role', ['school_admin', 'teacher']);

      if (adminError) throw adminError;

      for (const admin of admins || []) {
        await this.createNotification({
          schoolId,
          userId: admin.id,
          title,
          message,
          type
        });
      }

      return { success: true, count: admins?.length || 0 };
    } catch (error) {
      console.error('Send school notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // =============================================
  // SEND PARENT NOTIFICATION
  // =============================================
  async sendParentNotification(schoolId, parentId, title, message, type = 'in_app') {
    return this.createNotification({
      schoolId,
      userId: parentId,
      title,
      message,
      type
    });
  }

  // =============================================
  // SEND STUDENT NOTIFICATION
  // =============================================
  async sendStudentNotification(schoolId, studentId, title, message, type = 'in_app') {
    // Get student's user ID
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .single();

    if (studentError) {
      console.error('Student not found:', studentError);
      return { success: false, error: 'Student not found' };
    }

    if (!student.user_id) {
      return { success: false, error: 'Student has no user account' };
    }

    return this.createNotification({
      schoolId,
      userId: student.user_id,
      title,
      message,
      type
    });
  }
}

module.exports = new NotificationService();