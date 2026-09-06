const express = require('express');
const router = express.Router();
const curriculumController = require('../controllers/curriculumController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// =============================================
// CURRICULA
// =============================================
router.get('/schools/:schoolId/curricula', authorize('school_admin', 'super_admin', 'teacher'), curriculumController.getCurricula);
router.post('/schools/:schoolId/curricula', authorize('school_admin', 'super_admin'), curriculumController.createCurriculum);
router.put('/schools/:schoolId/curricula/:curriculumId', authorize('school_admin', 'super_admin'), curriculumController.updateCurriculum);
router.delete('/schools/:schoolId/curricula/:curriculumId', authorize('school_admin', 'super_admin'), curriculumController.deleteCurriculum);

// =============================================
// CURRICULUM TOPICS
// =============================================
router.get('/curricula/:curriculumId/topics', authorize('school_admin', 'super_admin', 'teacher'), curriculumController.getCurriculumTopics);
router.post('/curricula/:curriculumId/topics', authorize('school_admin', 'super_admin', 'teacher'), curriculumController.addCurriculumTopic);
router.put('/curricula/:curriculumId/topics/:topicId', authorize('school_admin', 'super_admin'), curriculumController.updateCurriculumTopic);
router.delete('/curricula/:curriculumId/topics/:topicId', authorize('school_admin', 'super_admin'), curriculumController.deleteCurriculumTopic);

module.exports = router;