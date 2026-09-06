const { supabaseAdmin } = require('../config/supabase');

class AdmissionExamController {
  // =============================================
  // 1. SCHEDULE EXAM
  // =============================================
  scheduleExam = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { applicationId, examType, subjectId, scheduledDate, scheduledTime } = req.body;

      if (!applicationId || !scheduledDate) {
        return res.status(400).json({ status: 'error', message: 'Application ID and scheduled date are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('admission_exams')
        .insert({
          school_id: schoolId,
          application_id: applicationId,
          exam_type: examType || 'paper',
          subject_id: subjectId || null,
          status: 'scheduled',
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime || null,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      // Update application status
      await supabaseAdmin
        .from('admission_applications')
        .update({ status: 'awaiting_exam', updated_at: new Date() })
        .eq('id', applicationId);

      // Create status history
      await supabaseAdmin
        .from('admission_status_history')
        .insert({
          application_id: applicationId,
          new_status: 'awaiting_exam',
          changed_at: new Date()
        });

      res.status(201).json({ status: 'success', message: 'Exam scheduled successfully', data });
    } catch (error) {
      console.error('Schedule Exam Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to schedule exam', error: error.message });
    }
  };

  // =============================================
  // 2. RECORD EXAM SCORE
  // =============================================
  recordExamScore = async (req, res) => {
    try {
      const { schoolId, examId } = req.params;
      const { adminId } = req.user;
      const { score, totalMarks } = req.body;

      if (score === undefined || totalMarks === undefined) {
        return res.status(400).json({ status: 'error', message: 'Score and total marks are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('admission_exams')
        .update({
          score: score,
          total_marks: totalMarks,
          status: 'completed',
          completed_at: new Date()
        })
        .eq('id', examId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      // Calculate percentage
      const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

      res.status(200).json({
        status: 'success',
        message: 'Exam score recorded successfully',
        data: { ...data, percentage }
      });
    } catch (error) {
      console.error('Record Exam Score Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to record exam score', error: error.message });
    }
  };

  // =============================================
  // 3. GET EXAMS FOR APPLICATION
  // =============================================
  getApplicationExams = async (req, res) => {
    try {
      const { applicationId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('admission_exams')
        .select('*')
        .eq('application_id', applicationId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Application Exams Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get exams', error: error.message });
    }
  };

  // =============================================
  // 4. GET ALL SCHEDULED EXAMS
  // =============================================
  getAllScheduledExams = async (req, res) => {
    try {
      const { schoolId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('admission_exams')
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
      console.error('Get All Scheduled Exams Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get scheduled exams', error: error.message });
    }
  };
}

module.exports = new AdmissionExamController();