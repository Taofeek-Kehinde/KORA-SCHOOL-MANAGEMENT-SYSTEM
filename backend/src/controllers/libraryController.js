const { supabaseAdmin } = require('../config/supabase');

class LibraryController {
  // =============================================
  // GET ALL BOOKS
  // =============================================
  getBooks = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { search, limit = 50, offset = 0 } = req.query;

      let query = supabaseAdmin
        .from('library_books')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('title', { ascending: true });

      if (search) {
        query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`);
      }

      const { data, error, count } = await query.range(offset, offset + limit - 1);
      if (error) throw error;

      res.status(200).json({ status: 'success', data: data || [], pagination: { total: count || 0 } });
    } catch (error) {
      console.error('Get Books Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get books', error: error.message });
    }
  };

  // =============================================
  // CREATE BOOK
  // =============================================
  createBook = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { title, author, isbn, category, quantity } = req.body;

      if (!title || !author) {
        return res.status(400).json({ status: 'error', message: 'Title and author are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('library_books')
        .insert({
          school_id: schoolId,
          title,
          author,
          isbn: isbn || '',
          category: category || '',
          total_copies: quantity || 1,
          available_copies: quantity || 1,
          created_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({ status: 'success', message: 'Book created successfully', data });
    } catch (error) {
      console.error('Create Book Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to create book', error: error.message });
    }
  };

  // =============================================
  // ISSUE BOOK TO STUDENT
  // =============================================
  issueBook = async (req, res) => {
    try {
      const { schoolId } = req.params;
      const { adminId } = req.user;
      const { bookId, studentId, dueDate } = req.body;

      if (!bookId || !studentId) {
        return res.status(400).json({ status: 'error', message: 'Book and student are required' });
      }

      // Check if book is available
      const { data: book, error: bookError } = await supabaseAdmin
        .from('library_books')
        .select('available_copies')
        .eq('id', bookId)
        .single();

      if (bookError) throw bookError;

      if (!book || book.available_copies < 1) {
        return res.status(400).json({ status: 'error', message: 'Book is not available' });
      }

      // Create loan record
      const { data: loan, error: loanError } = await supabaseAdmin
        .from('library_loans')
        .insert({
          school_id: schoolId,
          book_id: bookId,
          student_id: studentId,
          issue_date: new Date(),
          due_date: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: 'issued',
          issued_by: adminId,
          created_at: new Date()
        })
        .select()
        .single();

      if (loanError) throw loanError;

      // Decrease available copies
      await supabaseAdmin
        .from('library_books')
        .update({ available_copies: book.available_copies - 1 })
        .eq('id', bookId);

      res.status(201).json({ status: 'success', message: 'Book issued successfully', data: loan });
    } catch (error) {
      console.error('Issue Book Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to issue book', error: error.message });
    }
  };

  // =============================================
  // RETURN BOOK
  // =============================================
  returnBook = async (req, res) => {
    try {
      const { loanId } = req.params;
      const { adminId } = req.user;

      // Get loan
      const { data: loan, error: loanError } = await supabaseAdmin
        .from('library_loans')
        .select('book_id')
        .eq('id', loanId)
        .single();

      if (loanError) throw loanError;

      if (!loan || loan.status === 'returned') {
        return res.status(400).json({ status: 'error', message: 'Invalid loan or already returned' });
      }

      // Update loan
      const { data, error } = await supabaseAdmin
        .from('library_loans')
        .update({
          status: 'returned',
          return_date: new Date(),
          returned_by: adminId,
          updated_at: new Date()
        })
        .eq('id', loanId)
        .select()
        .single();

      if (error) throw error;

      // Increase available copies
      const { data: book } = await supabaseAdmin
        .from('library_books')
        .select('available_copies')
        .eq('id', loan.book_id)
        .single();

      if (book) {
        await supabaseAdmin
          .from('library_books')
          .update({ available_copies: book.available_copies + 1 })
          .eq('id', loan.book_id);
      }

      res.status(200).json({ status: 'success', message: 'Book returned successfully', data });
    } catch (error) {
      console.error('Return Book Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to return book', error: error.message });
    }
  };

  // =============================================
  // GET STUDENT LOANS
  // =============================================
  getStudentLoans = async (req, res) => {
    try {
      const { studentId } = req.params;

      // Get loans
      const { data, error } = await supabaseAdmin
        .from('library_loans')
        .select('*')
        .eq('student_id', studentId)
        .order('issue_date', { ascending: false });

      if (error) throw error;

      // Get book details separately
      const loansWithBooks = [];
      for (const loan of data || []) {
        let bookTitle = 'Unknown Book';
        let bookAuthor = '';

        if (loan.book_id) {
          const { data: book } = await supabaseAdmin
            .from('library_books')
            .select('title, author')
            .eq('id', loan.book_id)
            .single();

          if (book) {
            bookTitle = book.title;
            bookAuthor = book.author;
          }
        }

        loansWithBooks.push({
          ...loan,
          book_title: bookTitle,
          book_author: bookAuthor
        });
      }

      res.status(200).json({ status: 'success', data: loansWithBooks });
    } catch (error) {
      console.error('Get Student Loans Error:', error);
      res.status(500).json({ status: 'error', message: 'Failed to get loans', error: error.message });
    }
  };
}

module.exports = new LibraryController();