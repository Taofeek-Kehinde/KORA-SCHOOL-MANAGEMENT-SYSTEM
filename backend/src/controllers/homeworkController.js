const { supabaseAdmin } = require('../config/supabase');

class HomeworkController {
  // =============================================
  // CREATE HOMEWORK FOR A CLASS
  // =============================================
  createHomework = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { title, description, classId, subjectId, dueDate, teacherId } = req.body;

      if (!title || !classId) {
        return res.status(400).json({ status: 'error', message: 'Title and class are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('homework')
        .insert({
          school_id: schoolId,
          class_id: classId,
          subject_id: subjectId || null,
          teacher_id: teacherId || adminId,
          title,
          description: description || '',
          due_date: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      // Create homework for each student in the class
      const { data: students } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('class_id', classId)
        .eq('is_active', true);

      if (students && students.length > 0) {
        const studentHomework = students.map(student => ({
          homework_id: data.id,
          student_id: student.id,
          status: 'pending',
          assigned_at: new Date()
        }));
        await supabaseAdmin.from('student_homework').insert(studentHomework);
      }

      res.status(201).json({
        status: 'success',
        message: 'Homework created successfully',
        data
      });
    } catch (error) {
      console.error('Create Homework Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create homework', error: error.message });
    }
  };

  // =============================================
  // GET HOMEWORK FOR A CLASS
  // =============================================
  getClassHomework = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { classId } = req.query;

      const { data, error } = await supabaseAdmin
        .from('homework')
        .select(`
          *,
          subjects!subject_id(name, code),
          teachers!teacher_id(first_name, last_name)
        `)
        .eq('school_id', schoolId)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || []
      });
    } catch (error) {
      console.error('Get Class Homework Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get homework', error: error.message });
    }
  };

  // =============================================
  // GET STUDENT HOMEWORK
  // =============================================
  getStudentHomework = async (req, res) => {
    try {
      const { studentId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('student_homework')
        .select(`
          *,
          homework!homework_id(
            id, title, description, due_date,
            subjects!subject_id(name, code),
            teachers!teacher_id(first_name, last_name)
          )
        `)
        .eq('student_id', studentId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || []
      });
    } catch (error) {
      console.error('Get Student Homework Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get homework', error: error.message });
    }
  };

    // =============================================
  // GET SUBMISSIONS FOR A HOMEWORK (Teacher view)
  // =============================================
  getHomeworkSubmissions = async (req, res) => {
    try {
      const { homeworkId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('student_homework')
        .select(`
          *,
          students!student_id(id, first_name, last_name, admission_number)
        `)
        .eq('homework_id', homeworkId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        data: data || []
      });
    } catch (error) {
      console.error('Get Homework Submissions Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get submissions', error: error.message });
    }
  };

  // =============================================
  // GRADE A STUDENT'S SUBMISSION (Teacher)
  // =============================================
  gradeSubmission = async (req, res) => {
    try {
      const { studentHomeworkId } = req.params;
      const { score, maxScore, feedback } = req.body;
      const { id: graderId } = req.user;

      if (score === undefined || score === null) {
        return res.status(400).json({ status: 'error', message: 'Score is required' });
      }

      const { data, error } = await supabaseAdmin
        .from('student_homework')
        .update({
          score,
          max_score: maxScore || 100,
          teacher_feedback: feedback || '',
          graded_at: new Date(),
          graded_by: graderId,
          updated_at: new Date()
        })
        .eq('id', studentHomeworkId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'Submission graded successfully',
        data
      });
    } catch (error) {
      console.error('Grade Submission Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to grade submission', error: error.message });
    }
  };
  

  // =============================================
  // UPDATE HOMEWORK STATUS (Student)
  // =============================================
    updateHomeworkStatus = async (req, res) => {
    try {
      const { studentHomeworkId } = req.params;
      const { status, submissionText, submissionFileUrl } = req.body;

      const updateData = {
        status,
        submitted_at: status === 'submitted' ? new Date() : null,
        updated_at: new Date()
      };

      if (submissionText !== undefined) updateData.submission_text = submissionText;
      if (submissionFileUrl !== undefined) updateData.submission_file_url = submissionFileUrl;

      const { data, error } = await supabaseAdmin
        .from('student_homework')
        .update(updateData)
        .eq('id', studentHomeworkId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        status: 'success',
        message: 'Homework status updated',
        data
      });
    } catch (error) {
      console.error('Update Homework Status Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update homework status', error: error.message });
    }
  };
  }

module.exports = new HomeworkController();