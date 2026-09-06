const { supabaseAdmin } = require('../config/supabase');

class AdmissionInterviewController {
  // =============================================
  // 1. SCHEDULE INTERVIEW
  // =============================================
  scheduleInterview = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { applicationId, panelMembers, scheduledDate, scheduledTime } = req.body;

      if (!applicationId || !scheduledDate) {
        return res.status(400).json({ status: 'error', message: 'Application ID and scheduled date are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('admission_interviews')
        .insert({
          school_id: schoolId,
          application_id: applicationId,
          panel_members: panelMembers || [],
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime || null,
          status: 'scheduled',
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      // Update application status
      await supabaseAdmin
        .from('admission_applications')
        .update({ status: 'awaiting_interview', updated_at: new Date() })
        .eq('id', applicationId);

      // Create status history
      await supabaseAdmin
        .from('admission_status_history')
        .insert({
          application_id: applicationId,
          new_status: 'awaiting_interview',
          changed_at: new Date()
        });

      res.status(201).json({ status: 'success', message: 'Interview scheduled successfully', data });
    } catch (error) {
      console.error('Schedule Interview Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to schedule interview', error: error.message });
    }
  };

  // =============================================
  // 2. RECORD INTERVIEW RESULT
  // =============================================
  recordInterviewResult = async (req, res) => {
    try {
      const { schoolId, interviewId } = req.params;
      const { adminId } = req.user;
      const { observations, score, recommendation } = req.body;

      if (!recommendation) {
        return res.status(400).json({ status: 'error', message: 'Recommendation is required' });
      }

      const { data, error } = await supabaseAdmin
        .from('admission_interviews')
        .update({
          observations: observations || '',
          score: score || 0,
          recommendation: recommendation,
          status: 'completed',
          completed_at: new Date()
        })
        .eq('id', interviewId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      // Update application based on recommendation
      if (recommendation === 'approve') {
        await supabaseAdmin
          .from('admission_applications')
          .update({ status: 'approved', reviewed_by: adminId, reviewed_at: new Date(), updated_at: new Date() })
          .eq('id', data.application_id);
      } else if (recommendation === 'reject') {
        await supabaseAdmin
          .from('admission_applications')
          .update({ status: 'rejected', rejected_reason: 'Interview: Not recommended', reviewed_by: adminId, reviewed_at: new Date(), updated_at: new Date() })
          .eq('id', data.application_id);
      } else if (recommendation === 'waitlist') {
        await supabaseAdmin
          .from('admission_applications')
          .update({ status: 'waitlist', reviewed_by: adminId, reviewed_at: new Date(), updated_at: new Date() })
          .eq('id', data.application_id);
      }

      res.status(200).json({ status: 'success', message: 'Interview result recorded successfully', data });
    } catch (error) {
      console.error('Record Interview Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to record interview result', error: error.message });
    }
  };

  // =============================================
  // 3. GET APPLICATION INTERVIEWS
  // =============================================
  getApplicationInterviews = async (req, res) => {
    try {
      const { applicationId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('admission_interviews')
        .select('*')
        .eq('application_id', applicationId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Application Interviews Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get interviews', error: error.message });
    }
  };

  // =============================================
  // 4. GET ALL SCHEDULED INTERVIEWS
  // =============================================
  getAllScheduledInterviews = async (req, res) => {
    try {
      const { schoolId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('admission_interviews')
        .select(`
          *,
          admission_applications!application_id(
            application_number,
            student_first_name,
            student_last_name,
            classes!class_applying_for(name)
          )
        `)
        .eq('school_id', schoolId)
        .eq('status', 'scheduled')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get All Scheduled Interviews Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get scheduled interviews', error: error.message });
    }
  };
}

module.exports = new AdmissionInterviewController();