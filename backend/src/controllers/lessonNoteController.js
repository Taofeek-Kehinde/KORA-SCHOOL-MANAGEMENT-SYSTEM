const { supabaseAdmin } = require('../config/supabase');

class LessonNoteController {
  // =============================================
  // GET LESSON NOTES
  // =============================================
  getLessonNotes = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { teacherId, subjectId, classId, status } = req.query;

      let query = supabaseAdmin
        .from('lesson_notes')
        .select(`
          *,
          subjects!subject_id(id, name, code),
          classes!class_id(id, name),
          teachers!teacher_id(first_name, last_name)
        `)
        .eq('school_id', schoolId);

      if (teacherId) query = query.eq('teacher_id', teacherId);
      if (subjectId) query = query.eq('subject_id', subjectId);
      if (classId) query = query.eq('class_id', classId);
      if (status) query = query.eq('status', status);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Lesson Notes Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get lesson notes', error: error.message });
    }
  };

  // =============================================
  // CREATE LESSON NOTE
  // =============================================
    createLessonNote = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { subjectId, classId, date, weekNumber, topic, objectives, previousKnowledge, teachingAids, lessonDevelopment, evaluation, assignment, teacherId } = req.body;

      if (!subjectId || !classId || !topic) {
        return res.status(400).json({ status: 'error', message: 'Subject, class, and topic are required' });
      }

      if (!teacherId) {
        return res.status(400).json({ status: 'error', message: 'Teacher ID is required' });
      }

      const { data, error } = await supabaseAdmin
        .from('lesson_notes')
        .insert({
          school_id: schoolId,
          subject_id: subjectId,
          class_id: classId,
          teacher_id: teacherId,
          date: date || new Date(),
          week_number: weekNumber || 1,
          topic,
          objectives: objectives || '',
          previous_knowledge: previousKnowledge || '',
          teaching_aids: teachingAids || '',
          lesson_development: lessonDevelopment || '',
          evaluation: evaluation || '',
          assignment: assignment || '',
          status: 'approved',
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ status: 'success', message: 'Lesson note created successfully', data });
    } catch (error) {
      console.error('Create Lesson Note Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create lesson note', error: error.message });
    }
  };

  // =============================================
// GET STUDENT LESSON NOTES
// =============================================
// =============================================
// GET STUDENT LESSON NOTES
// =============================================
getStudentLessonNotes = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student's class
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('class_id')
      .eq('id', studentId)
      .single();

    if (studentError) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    if (!student?.class_id) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    // Get ALL lesson notes for the class with ALL fields
    const { data, error } = await supabaseAdmin
      .from('lesson_notes')
      .select('*')
      .eq('class_id', student.class_id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Get subject and teacher names separately
    const notesWithDetails = await Promise.all((data || []).map(async (note) => {
      let subjectName = null;
      if (note.subject_id) {
        const { data: subject } = await supabaseAdmin
          .from('subjects')
          .select('name')
          .eq('id', note.subject_id)
          .single();
        subjectName = subject?.name || null;
      }

      let teacherName = null;
      if (note.teacher_id) {
        const { data: teacher } = await supabaseAdmin
          .from('teachers')
          .select('first_name, last_name')
          .eq('id', note.teacher_id)
          .single();
        teacherName = teacher ? `${teacher.first_name} ${teacher.last_name}` : null;
      }

      return {
        ...note,
        subject_name: subjectName,
        teacher_name: teacherName
      };
    }));

    res.status(200).json({
      status: 'success',
      data: notesWithDetails
    });
  } catch (error) {
    console.error('Get Student Lesson Notes Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get lesson notes',
      error: error.message
    });
  }
};
// =============================================
// GET CLASS LESSON NOTES
// =============================================
getClassLessonNotes = async (req, res) => {
  try {
    const { classId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('lesson_notes')
      .select(`
        *,
        subjects!subject_id(id, name, code),
        teachers!teacher_id(first_name, last_name)
      `)
      .eq('class_id', classId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ status: 'success', data: data || [] });
  } catch (error) {
    console.error('Get Class Lesson Notes Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to get lesson notes', error: error.message });
  }
};


  // =============================================
  // UPDATE LESSON NOTE
  // =============================================
  updateLessonNote = async (req, res) => {
    try {
      const { schoolId, lessonNoteId } = req.params;
      const { topic, objectives, previousKnowledge, teachingAids, lessonDevelopment, evaluation, assignment, date, weekNumber } = req.body;

      const updateData = {};
      if (topic !== undefined) updateData.topic = topic;
      if (objectives !== undefined) updateData.objectives = objectives;
      if (previousKnowledge !== undefined) updateData.previous_knowledge = previousKnowledge;
      if (teachingAids !== undefined) updateData.teaching_aids = teachingAids;
      if (lessonDevelopment !== undefined) updateData.lesson_development = lessonDevelopment;
      if (evaluation !== undefined) updateData.evaluation = evaluation;
      if (assignment !== undefined) updateData.assignment = assignment;
      if (date !== undefined) updateData.date = date;
      if (weekNumber !== undefined) updateData.week_number = weekNumber;
      updateData.updated_at = new Date();

      const { data, error } = await supabaseAdmin
        .from('lesson_notes')
        .update(updateData)
        .eq('id', lessonNoteId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', message: 'Lesson note updated successfully', data });
    } catch (error) {
      console.error('Update Lesson Note Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to update lesson note', error: error.message });
    }
  };

  // =============================================
  // DELETE LESSON NOTE
  // =============================================
  deleteLessonNote = async (req, res) => {
    try {
      const { schoolId, lessonNoteId } = req.params;
      const { error } = await supabaseAdmin
        .from('lesson_notes')
        .delete()
        .eq('id', lessonNoteId)
        .eq('school_id', schoolId);
      if (error) throw error;
      res.status(200).json({ status: 'success', message: 'Lesson note deleted successfully' });
    } catch (error) {
      console.error('Delete Lesson Note Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete lesson note', error: error.message });
    }
  };

    // =============================================
  // GET LESSON NOTES FOR A CLASS (Student view)
  // =============================================
  getClassLessonNotesForStudent = async (req, res) => {
    try {
      const { classId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('lesson_notes')
        .select(`
          *,
          subjects!subject_id(id, name, code),
          teachers!teacher_id(first_name, last_name)
        `)
        .eq('class_id', classId)
        .eq('status', 'approved')
        .order('date', { ascending: false });

      if (error) throw error;

      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Class Lesson Notes Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get lesson notes', error: error.message });
    }
  };

  // =============================================
  // APPROVE LESSON NOTE (HOD)
  // =============================================
    approveLessonNote = async (req, res) => {
    try {
      const { schoolId, lessonNoteId } = req.params;
      const adminId = req.user.id;
      const { approve, comment } = req.body;

      const status = approve ? 'approved' : 'rejected';

      const { data, error } = await supabaseAdmin
        .from('lesson_notes')
        .update({
          status,
          hod_reviewed_by: adminId,
          hod_reviewed_at: new Date(),
          hod_comment: comment || '',
          updated_at: new Date()
        })
        .eq('id', lessonNoteId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({ status: 'success', message: `Lesson note ${status}`, data });
    } catch (error) {
      console.error('Approve Lesson Note Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to approve lesson note', error: error.message });
    }
  };

  // =============================================
  // GET PENDING LESSON NOTES
  // =============================================
  getPendingLessonNotes = async (req, res) => {
    try {
      const { schoolId } = req.params;

      const { data, error } = await supabaseAdmin
        .from('lesson_notes')
        .select(`
          *,
          subjects!subject_id(id, name, code),
          classes!class_id(id, name),
          teachers!teacher_id(first_name, last_name)
        `)
        .eq('school_id', schoolId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      res.status(200).json({ status: 'success', data: data || [] });
    } catch (error) {
      console.error('Get Pending Lesson Notes Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get pending lesson notes', error: error.message });
    }
  };
}

module.exports = new LessonNoteController();