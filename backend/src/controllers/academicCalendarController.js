const { supabaseAdmin } = require('../config/supabase');

class AcademicCalendarController {
  // =============================================
  // GET CALENDAR EVENTS
  // =============================================
  getCalendarEvents = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { eventType, startDate, endDate } = req.query;

      let query = supabaseAdmin
        .from('academic_calendar_events')
        .select('*')
        .eq('school_id', schoolId);

      if (eventType) query = query.eq('event_type', eventType);
      if (startDate) query = query.gte('start_date', startDate);
      if (endDate) query = query.lte('end_date', endDate);

      const { data, error } = await query.order('start_date', { ascending: true });
      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Calendar Events Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get calendar events', error: error.message });
    }
  };

  // =============================================
  // CREATE CALENDAR EVENT
  // =============================================
  createCalendarEvent = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { title, eventType, startDate, endDate, description } = req.body;

      if (!title || !startDate) {
        return res.status(400).json({ status: 'error', message: 'Title and start date are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('academic_calendar_events')
        .insert({
          school_id: schoolId,
          title,
          event_type: eventType || 'general',
          start_date: startDate,
          end_date: endDate || startDate,
          description: description || '',
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ status: 'success', message: 'Calendar event created successfully', data });
    } catch (error) {
      console.error('Create Calendar Event Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create calendar event', error: error.message });
    }
  };

  // =============================================
  // UPDATE CALENDAR EVENT
  // =============================================
  updateCalendarEvent = async (req, res) => {
    try {
      const { schoolId, eventId } = req.params;
      const { title, eventType, startDate, endDate, description } = req.body;

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (eventType !== undefined) updateData.event_type = eventType;
      if (startDate !== undefined) updateData.start_date = startDate;
      if (endDate !== undefined) updateData.end_date = endDate;
      if (description !== undefined) updateData.description = description;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('academic_calendar_events')
        .update(updateData)
        .eq('id', eventId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', message: 'Calendar event updated successfully', data });
    } catch (error) {
      console.error('Update Calendar Event Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update calendar event', error: error.message });
    }
  };

  // =============================================
  // DELETE CALENDAR EVENT
  // =============================================
  deleteCalendarEvent = async (req, res) => {
    try {
      const { schoolId, eventId } = req.params;
      const { error } = await supabaseAdmin
        .from('academic_calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('school_id', schoolId);
      if (error) throw error;
      res.status(200).json({ status: 'success', message: 'Calendar event deleted successfully' });
    } catch (error) {
      console.error('Delete Calendar Event Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete calendar event', error: error.message });
    }
  };
}

module.exports = new AcademicCalendarController();