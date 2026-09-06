const express = require('express');
const router = express.Router();
const lessonNoteController = require('../controllers/lessonNoteController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// LESSON NOTES (Teacher)
// =============================================
router.get('/schools/:schoolId/lesson-notes', authorize('teacher', 'school_admin', 'super_admin'), lessonNoteController.getLessonNotes);
router.post('/schools/:schoolId/lesson-notes', authorize('teacher', 'school_admin'), lessonNoteController.createLessonNote);
router.put('/schools/:schoolId/lesson-notes/:lessonNoteId', authorize('teacher', 'school_admin'), lessonNoteController.updateLessonNote);
router.delete('/schools/:schoolId/lesson-notes/:lessonNoteId', authorize('teacher', 'school_admin'), lessonNoteController.deleteLessonNote);

// =============================================
// LESSON NOTES (Student)
// =============================================
router.get('/students/:studentId/lesson-notes', authorize('student', 'teacher', 'school_admin'), lessonNoteController.getStudentLessonNotes);

// =============================================
// LESSON NOTES (Class)
// =============================================
router.get('/classes/:classId/student-notes', authorize('student', 'teacher', 'school_admin'), lessonNoteController.getClassLessonNotes);

// =============================================
// APPROVAL
// =============================================
router.put('/schools/:schoolId/lesson-notes/:lessonNoteId/approve', authorize('school_admin', 'super_admin'), lessonNoteController.approveLessonNote);
router.get('/schools/:schoolId/lesson-notes/pending', authorize('school_admin', 'super_admin'), lessonNoteController.getPendingLessonNotes);

module.exports = router;