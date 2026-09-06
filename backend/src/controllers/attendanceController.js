const { supabaseAdmin } = require('../config/supabase');
const notificationService = require('../services/notificationService');

class AttendanceController {
  // =============================================
  // BULK UPDATE ATTENDANCE (For Teacher)
  // =============================================
  bulkUpdateAttendance = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { attendance, classId } = req.body;

      if (!attendance || !Array.isArray(attendance)) {
        return res.status(400).json({ status: 'error', message: 'Attendance data is required' });
      }

      const results = { success: [], failed: [] };

      for (const record of attendance) {
        try {
          const { data, error } = await supabaseAdmin
            .from('attendance')
            .upsert({
              student_id: record.studentId,
              class_id: classId || record.classId,
              date: record.date || new Date().toISOString().split('T')[0],
              status: record.status || 'present',
              school_id: schoolId,
              recorded_by: adminId,
              updated_at: new Date()
            }, { onConflict: 'student_id,date' })
            .select()
            .single();

          if (error) throw error;
          results.success.push(data);

          // Notify student about attendance
          if (record.status && record.status !== 'present') {
            await notificationService.sendStudentNotification(
              schoolId,
              record.studentId,
              'Attendance Update',
              `You were marked ${record.status} today.`
            );
          }
        } catch (error) {
          results.failed.push({ student_id: record.studentId, error: error.message });
        }
      }

      res.status(200).json({
        status: 'success',
        message: `Updated ${results.success.length} attendance records`,
        data: results
      });
    } catch (error) {
      console.error('Bulk Update Attendance Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update attendance', error: error.message });
    }
  };
}

module.exports = new AttendanceController();