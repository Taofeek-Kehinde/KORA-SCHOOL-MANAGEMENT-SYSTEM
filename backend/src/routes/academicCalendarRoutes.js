const express = require('express');
const router = express.Router();
const academicCalendarController = require('../controllers/academicCalendarController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// CALENDAR EVENTS
// =============================================
router.get('/schools/:schoolId/calendar', authorize('school_admin', 'super_admin', 'teacher', 'parent'), academicCalendarController.getCalendarEvents);
router.post('/schools/:schoolId/calendar', authorize('school_admin', 'super_admin'), academicCalendarController.createCalendarEvent);
router.put('/schools/:schoolId/calendar/:eventId', authorize('school_admin', 'super_admin'), academicCalendarController.updateCalendarEvent);
router.delete('/schools/:schoolId/calendar/:eventId', authorize('school_admin', 'super_admin'), academicCalendarController.deleteCalendarEvent);

module.exports = router;