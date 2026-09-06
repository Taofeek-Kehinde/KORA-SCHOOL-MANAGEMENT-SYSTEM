const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticate, authorize } = require('../middleware/auth');
const { supabaseAdmin } = require('../config/supabase');

router.use(authenticate);

// =============================================
// GET ALL TEACHERS
// =============================================
router.get('/schools/:schoolId/teachers', authorize('school_admin', 'super_admin'), async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { search, limit = 100, offset = 0 } = req.query;

    let query = supabaseAdmin
      .from('teachers')
      .select(`
        *,
        classes:teacher_classes(
          class_id,
          subject_id,
          is_active,
          classes!class_id(id, name, level),
          subjects!subject_id(id, name, code)
        )
      `)
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('first_name', { ascending: true });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) throw error;

    const formatted = (data || []).map(t => {
      const activeAssignments = (t.classes || []).filter(c => c.is_active);
      return {
        ...t,
        classIds: activeAssignments.map(c => c.class_id),
        classAssignments: activeAssignments.map(c => ({
          classId: c.class_id,
          subjectId: c.subject_id,
          className: c.classes?.name,
          subjectName: c.subjects?.name
        }))
      };
    });

    res.status(200).json({
      status: 'success',
      data: formatted || [],
      pagination: { limit: parseInt(limit), offset: parseInt(offset), total: count || 0 }
    });
  } catch (error) {
    console.error('Get Teachers Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch teachers', error: error.message });
  }
});
// =============================================
// CREATE TEACHER
// =============================================
router.post('/schools/:schoolId/teachers', authorize('school_admin', 'super_admin'), teacherController.createTeacher);

// =============================================
// UPDATE TEACHER
// =============================================
router.put('/schools/:schoolId/teachers/:teacherId', authorize('school_admin', 'super_admin'), teacherController.updateTeacher);

// =============================================
// DELETE TEACHER
// =============================================
router.delete('/schools/:schoolId/teachers/:teacherId', authorize('school_admin', 'super_admin'), teacherController.deleteTeacher);

// =============================================
// GET TEACHER CLASSES
// =============================================
router.get('/teachers/:teacherId/classes', authorize('teacher', 'school_admin'), teacherController.getTeacherClasses);

// =============================================
// GET TEACHER STUDENTS
// =============================================
router.get('/teachers/:teacherId/students', authorize('teacher', 'school_admin'), teacherController.getTeacherStudents);

// =============================================
// UPDATE ATTENDANCE
// =============================================
router.post('/schools/:schoolId/attendance', authorize('teacher', 'school_admin'), teacherController.updateAttendance);

// =============================================
// GET ASSESSMENTS (COMMENTED OUT - No method)
// =============================================
router.get('/schools/:schoolId/assessments', authorize('teacher', 'school_admin'), teacherController.getAssessments);

// =============================================
// UPDATE ASSESSMENTS (COMMENTED OUT - No method)
// =============================================
router.post('/schools/:schoolId/assessments', authorize('teacher', 'school_admin'), teacherController.updateAssessments);

module.exports = router;