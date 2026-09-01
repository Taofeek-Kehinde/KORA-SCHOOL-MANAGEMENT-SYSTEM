const { supabaseAdmin } = require('../config/supabase');
const auditService = require('../services/auditService');

class AttendanceController {
  // =============================================
  // UPDATE ATTENDANCE - Log: Attendance modified
  // =============================================
  async updateAttendance(req, res) {
    try {
      const { attendanceId } = req.params;
      const { status, reason } = req.body;
      const { user } = req;

      // Get old values
      const { data: oldAttendance, error: fetchError } = await supabaseAdmin
        .from('attendance')
        .select('*')
        .eq('id', attendanceId)
        .single();

      if (fetchError) throw fetchError;

      // Update attendance
      const updateData = {};
      if (status !== undefined) updateData.status = status;
      if (reason !== undefined) updateData.reason = reason;
      updateData.updated_at = new Date();

      const { data: updatedAttendance, error } = await supabaseAdmin
        .from('attendance')
        .update(updateData)
        .eq('id', attendanceId)
        .select()
        .single();

      if (error) throw error;

      // LOG: Attendance modified
      await auditService.logAttendanceModified(
        oldAttendance.school_id,
        user.id,
        {
          attendanceId: attendanceId,
          oldValues: {
            status: oldAttendance.status,
            reason: oldAttendance.reason
          },
          newValues: updateData
        },
        req.ip,
        req.headers['user-agent']
      );

      res.status(200).json({
        status: 'success',
        message: 'Attendance updated successfully',
        data: updatedAttendance
      });
    } catch (error) {
      console.error('Update Attendance Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update attendance',
        error: error.message
      });
    }
  }
}