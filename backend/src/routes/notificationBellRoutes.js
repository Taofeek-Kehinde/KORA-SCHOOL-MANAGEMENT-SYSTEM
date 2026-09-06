const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

// All routes require authentication
router.use(authenticate);

// =============================================
// GET USER NOTIFICATIONS (ALL ROLES)
// =============================================
router.get('/users/:userId/notifications', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error, count } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.status(200).json({
      status: 'success',
      data: data || [],
      pagination: { total: count || 0 }
    });
  } catch (error) {
    console.error('Get User Notifications Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get notifications', error: error.message });
  }
});

// =============================================
// GET STUDENT NOTIFICATIONS
// =============================================
router.get('/students/:studentId/notifications', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error, count } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.status(200).json({
      status: 'success',
      data: data || [],
      pagination: { total: count || 0 }
    });
  } catch (error) {
    console.error('Get Student Notifications Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get notifications', error: error.message });
  }
});

// =============================================
// GET PARENT NOTIFICATIONS
// =============================================
router.get('/parents/:parentId/notifications', async (req, res) => {
  try {
    const { parentId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error, count } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.status(200).json({
      status: 'success',
      data: data || [],
      pagination: { total: count || 0 }
    });
  } catch (error) {
    console.error('Get Parent Notifications Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get notifications', error: error.message });
  }
});

// =============================================
// GET TEACHER NOTIFICATIONS
// =============================================
router.get('/teachers/:teacherId/notifications', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error, count } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.status(200).json({
      status: 'success',
      data: data || [],
      pagination: { total: count || 0 }
    });
  } catch (error) {
    console.error('Get Teacher Notifications Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get notifications', error: error.message });
  }
});

// =============================================
// GET UNREAD COUNT (USER)
// =============================================
router.get('/users/:userId/unread-count', async (req, res) => {
  try {
    const { userId } = req.params;

    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    res.status(200).json({
      status: 'success',
      data: { unread_count: count || 0 }
    });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get unread count', error: error.message });
  }
});

// =============================================
// GET UNREAD COUNT (STUDENT)
// =============================================
router.get('/students/:studentId/unread-count', async (req, res) => {
  try {
    const { studentId } = req.params;

    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('is_read', false);

    if (error) throw error;

    res.status(200).json({
      status: 'success',
      data: { unread_count: count || 0 }
    });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get unread count', error: error.message });
  }
});

// =============================================
// GET UNREAD COUNT (PARENT)
// =============================================
router.get('/parents/:parentId/unread-count', async (req, res) => {
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
    res.status(500).json({ status: 'error', message: 'Failed to get unread count', error: error.message });
  }
});

// =============================================
// GET UNREAD COUNT (TEACHER)
// =============================================
router.get('/teachers/:teacherId/unread-count', async (req, res) => {
  try {
    const { teacherId } = req.params;

    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .eq('is_read', false);

    if (error) throw error;

    res.status(200).json({
      status: 'success',
      data: { unread_count: count || 0 }
    });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get unread count', error: error.message });
  }
});

// =============================================
// MARK NOTIFICATION AS READ
// =============================================
router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, read_at: new Date() })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ status: 'success', message: 'Notification marked as read', data });
  } catch (error) {
    console.error('Mark As Read Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to mark notification as read', error: error.message });
  }
});

// =============================================
// MARK ALL AS READ
// =============================================
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, read_at: new Date() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;

    res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark All As Read Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to mark all as read', error: error.message });
  }
});

module.exports = router;