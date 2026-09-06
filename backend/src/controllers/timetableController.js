const { supabaseAdmin } = require('../config/supabase');

class TimetableController {
  setTimetable = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { classId, entries } = req.body;

      if (!classId || !entries || !Array.isArray(entries)) {
        return res.status(400).json({ status: 'error', message: 'Class ID and timetable entries are required' });
      }

      // Remove old entries
      await supabaseAdmin
        .from('timetable_entries')
        .delete()
        .eq('class_id', classId);
      const missingTeacher = entries.some(entry => !entry.teacherId);
      if (missingTeacher) {
        return res.status(400).json({
          status: 'error',
          message: 'Every timetable entry must have a teacherId'
        });
      }
const newEntries = entries.map(entry => ({
        school_id: schoolId,
        class_id: classId,
        subject_id: entry.subjectId || null,
        teacher_id: entry.teacherId,
        day_of_week: entry.day,
        start_time: entry.startTime,
        end_time: entry.endTime,
        is_active: true,
        created_by: adminId,
        created_at: new Date()
      }));

      const { data, error } = await supabaseAdmin
        .from('timetable_entries')
        .insert(newEntries)
        .select();

      if (error) throw error;

      res.status(201).json({
        status: 'success',
        message: 'Timetable set successfully',
        data: data || []
      });
    } catch (error) {
      console.error('Set Timetable Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to set timetable', error: error.message });
    }
  };

  getClassTimetable = async (req, res) => {
    try {
      const { classId } = req.query;

      const { data, error } = await supabaseAdmin
        .from('timetable_entries')
        .select(`
          *,
          subjects!subject_id(id, name, code),
          teachers!teacher_id(first_name, last_name)
        `)
        .eq('class_id', classId)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const timetable = daysOfWeek.map(day => ({
        day,
        periods: (data || []).filter(t => t.day_of_week === day)
      }));

      res.status(200).json({
        status: 'success',
        data: timetable
      });
    } catch (error) {
      console.error('Get Class Timetable Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get timetable', error: error.message });
    }
  };

    getStudentTimetable = async (req, res) => {
    try {
      const { studentId } = req.params;

      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('class_id')
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      if (!student?.class_id) {
        return res.status(200).json({ status: 'success', data: [] });
      }

      const { data, error } = await supabaseAdmin
        .from('timetable_entries')
        .select(`
          *,
          subjects!subject_id(id, name, code),
          teachers!teacher_id(first_name, last_name)
        `)
        .eq('class_id', student.class_id)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const timetable = daysOfWeek.map(day => ({
        day,
        periods: (data || []).filter(t => t.day_of_week === day)
      }));

      res.status(200).json({
        status: 'success',
        data: timetable
      });
    } catch (error) {
      console.error('Get Student Timetable Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get student timetable', error: error.message });
    }
  };
}

module.exports = new TimetableController();