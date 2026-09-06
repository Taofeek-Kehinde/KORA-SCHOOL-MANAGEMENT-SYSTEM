const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Get all books
router.get('/schools/:schoolId/books', authorize('school_admin', 'teacher', 'student'), libraryController.getBooks);

// Create book
router.post('/schools/:schoolId/books', authorize('school_admin'), libraryController.createBook);

// Issue book
router.post('/schools/:schoolId/issue', authorize('school_admin', 'teacher'), libraryController.issueBook);

// Return book
router.put('/loans/:loanId/return', authorize('school_admin', 'teacher'), libraryController.returnBook);

// Get student loans
router.get('/students/:studentId/loans', authorize('student', 'teacher', 'school_admin'), libraryController.getStudentLoans);

module.exports = router;