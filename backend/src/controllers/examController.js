const { supabaseAdmin } = require('../config/supabase');

class ExamController {
  // =============================================
  // CREATE EXAM (Teacher)
  // =============================================
  createExam = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { title, subjectId, classId, termId, examDate, duration, totalMarks, instructions, questions } = req.body;

      if (!title || !subjectId || !classId) {
        return res.status(400).json({ status: 'error', message: 'Title, subject, and class are required' });
      }

      const { data: exam, error: examError } = await supabaseAdmin
        .from('exams')
        .insert({
          school_id: schoolId,
          title,
          subject_id: subjectId,
          class_id: classId,
          term_id: termId || null,
          exam_date: examDate || new Date(),
          duration: duration || 60,
          total_marks: totalMarks || 100,
          instructions: instructions || '',
          created_by: adminId,
          status: 'published',
          created_at: new Date()
        })
        .select()
        .single();

      if (examError) throw examError;

      // Add questions
      if (questions && questions.length > 0) {
        const questionRecords = questions.map((q, index) => ({
          exam_id: exam.id,
          question_number: index + 1,
          question_text: q.question,
          options: q.options || [],
          correct_answer: q.correctAnswer || '',
          marks: q.marks || 1
        }));
        await supabaseAdmin.from('exam_questions').insert(questionRecords);
      }

      res.status(201).json({
        status: 'success',
        message: 'Exam created successfully',
        data: exam
      });
    } catch (error) {
      console.error('Create Exam Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create exam', error: error.message });
    }
  };

    // =============================================
  // DELETE EXAM (and its questions/results)
  // =============================================
  deleteExam = async (req, res) => {
    try {
      const { schoolId, examId } = req.params;

      // Confirm the exam belongs to this school
      const { data: exam, error: examFetchError } = await supabaseAdmin
        .from('exams')
        .select('id')
        .eq('id', examId)
        .eq('school_id', schoolId)
        .single();

      if (examFetchError || !exam) {
        return res.status(404).json({ status: 'error', message: 'Exam not found' });
      }

      // Delete dependent exam_results first
      const { error: resultsError } = await supabaseAdmin
        .from('exam_results')
        .delete()
        .eq('exam_id', examId);

      if (resultsError) throw resultsError;

      // Delete dependent exam_questions
      const { error: questionsError } = await supabaseAdmin
        .from('exam_questions')
        .delete()
        .eq('exam_id', examId);

      if (questionsError) throw questionsError;

      // Now delete the exam itself
      const { error: deleteError } = await supabaseAdmin
        .from('exams')
        .delete()
        .eq('id', examId)
        .eq('school_id', schoolId);

      if (deleteError) throw deleteError;

      res.status(200).json({
        status: 'success',
        message: 'Exam deleted successfully'
      });
    } catch (error) {
      console.error('Delete Exam Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete exam', error: error.message });
    }
  };

  // =============================================
  // GET EXAMS FOR CLASS
  // =============================================
  getClassExams = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { classId, subjectId } = req.query;

      let query = supabaseAdmin
        .from('exams')
        .select(`
          *,
          subjects!subject_id(id, name, code),
          classes!class_id(id, name)
        `)
        .eq('school_id', schoolId);

      if (classId) query = query.eq('class_id', classId);
      if (subjectId) query = query.eq('subject_id', subjectId);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Class Exams Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get exams', error: error.message });
    }
  };

  // =============================================
  // GET EXAM DETAILS (With Questions)
  // =============================================
  getExamDetails = async (req, res) => {
    try {
      const { schoolId, examId } = req.params;

      const { data: exam, error } = await supabaseAdmin
        .from('exams')
        .select(`
          *,
          subjects!subject_id(id, name, code),
          classes!class_id(id, name),
          questions:exam_questions(*)
        `)
        .eq('id', examId)
        .eq('school_id', schoolId)
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', data: exam });
    } catch (error) {
      console.error('Get Exam Details Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get exam details', error: error.message });
    }
  };

  // =============================================
// SUBMIT EXAM (Student)
// =============================================
submitExam = async (req, res) => {
  try {
    const { schoolId, examId } = req.params;
    const { adminId } = req.user;
    const { answers } = req.body;

    const { data: exam, error: examError } = await supabaseAdmin
      .from('exams')
      .select(`*, questions:exam_questions(*)`)
      .eq('id', examId)
      .eq('school_id', schoolId)
      .single();

    if (examError) throw examError;

    // Calculate score
    let score = 0;
    const totalQuestions = exam.questions?.length || 0;
    const maxScore = (exam.questions?.[0]?.marks || 1) * totalQuestions;

    for (const question of exam.questions || []) {
      const userAnswer = answers?.find(a => a.questionId === question.id);
      if (userAnswer?.answer === question.correct_answer) {
        score += question.marks || 1;
      }
    }

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    // Save exam result
    const { data: result, error: resultError } = await supabaseAdmin
      .from('exam_results')
      .insert({
        exam_id: examId,
        student_id: adminId,
        score: score,
        total_marks: exam.total_marks,
        percentage: percentage,
        answers: answers || [],
        submitted_at: new Date()
      })
      .select()
      .single();

    if (resultError) throw resultError;

    // =============================================
    // ✅ ADD NOTIFICATIONS HERE
    // =============================================
    const notificationService = require('../services/notificationService');

    // 1. Notify Student
    await notificationService.sendStudentNotification(
      schoolId,
      adminId,
      'Exam Submitted',
      `You scored ${percentage}% on ${exam.title}`
    );

    // 2. Notify Parents
    const { data: parents } = await supabaseAdmin
      .from('student_parents')
      .select('parent_id, parents!parent_id(user_id)')
      .eq('student_id', adminId);

    for (const parent of parents || []) {
      if (parent.parents?.user_id) {
        await notificationService.createNotification({
          schoolId,
          userId: parent.parents.user_id,
          title: 'Exam Result',
          message: `Your child scored ${percentage}% on ${exam.title}`,
          type: 'exam_result'
        });
      }
    }

    // 3. Notify Teacher (who created the exam)
    if (exam.created_by) {
      await notificationService.createNotification({
        schoolId,
        userId: exam.created_by,
        title: 'Student Submitted Exam',
        message: `A student scored ${percentage}% on ${exam.title}`,
        type: 'exam_submission'
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Exam submitted successfully',
      data: { result, score, percentage, total_questions: totalQuestions }
    });
  } catch (error) {
    console.error('Submit Exam Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to submit exam', error: error.message });
  }
};


  // =============================================
  // GET EXAM RESULTS FOR CLASS
  // =============================================
  getClassExamResults = async (req, res) => {
    try {
      const { schoolId, examId } = req.params;

      const { data: results, error } = await supabaseAdmin
        .from('exam_results')
        .select(`
          *,
          students!student_id(first_name, last_name, admission_number),
          exams!exam_id(title, subject_id, subjects!subject_id(name))
        `)
        .eq('exam_id', examId)
        .eq('exams.school_id', schoolId)
        .order('percentage', { ascending: false });

      if (error) throw error;

      res.status(200).json({ status: 'success', data: results || [] });
    } catch (error) {
      console.error('Get Class Exam Results Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get exam results', error: error.message });
    }
  };

  // =============================================
  // GET STUDENT EXAM RESULTS
  // =============================================
  getStudentExamResults = async (req, res) => {
    try {
      const { schoolId, studentId } = req.params;

      const { data: results, error } = await supabaseAdmin
        .from('exam_results')
        .select(`
          *,
          exams!exam_id(title, exam_date, subjects!subject_id(name, code))
        `)
        .eq('student_id', studentId)
        .eq('exams.school_id', schoolId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      const average = results?.length > 0
        ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length)
        : 0;

      res.status(200).json({
        status: 'success',
        data: { average, results: results || [] }
      });
    } catch (error) {
      console.error('Get Student Exam Results Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get student exam results', error: error.message });
    }
  };
}

module.exports = new ExamController();