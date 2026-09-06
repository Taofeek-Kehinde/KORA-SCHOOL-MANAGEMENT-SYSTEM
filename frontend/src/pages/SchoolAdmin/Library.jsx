import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaPlus, FaSearch, FaBook, FaSpinner, FaTrash, FaExchangeAlt } from 'react-icons/fa';

const Library = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    quantity: 1
  });
  const [issueData, setIssueData] = useState({
    bookId: '',
    studentId: '',
    dueDate: ''
  });

  // Fetch books
  const { data: booksData, refetch } = useQuery({
    queryKey: ['books', user?.schoolId, searchTerm],
    queryFn: async () => {
      const response = await api.get(`/library/schools/${user?.schoolId}/books`, {
        params: { search: searchTerm || undefined }
      });
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch students
  const { data: studentsData } = useQuery({
    queryKey: ['students', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/students/schools/${user?.schoolId}/students`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Create book
  const createBookMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/library/schools/${user?.schoolId}/books`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Book added successfully');
      setShowAddModal(false);
      setFormData({ title: '', author: '', isbn: '', category: '', quantity: 1 });
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add book');
    }
  });

  // Issue book
  const issueBookMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/library/schools/${user?.schoolId}/issue`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Book issued successfully');
      setShowIssueModal(false);
      setIssueData({ bookId: '', studentId: '', dueDate: '' });
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to issue book');
    }
  });

  const books = booksData?.data || [];
  const students = studentsData?.data || [];

  const handleCreateBook = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.author) {
      toast.error('Title and author are required');
      return;
    }
    createBookMutation.mutate(formData);
  };

  const handleIssueBook = (e) => {
    e.preventDefault();
    if (!issueData.bookId || !issueData.studentId) {
      toast.error('Book and student are required');
      return;
    }
    issueBookMutation.mutate(issueData);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Library</h1>
          <p className="text-gray-500 mt-1">Manage books and loans</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            onClick={() => setShowIssueModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
          >
            <FaExchangeAlt />
            Issue Book
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          >
            <FaPlus />
            Add Book
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
      </div>

      {/* Books Grid */}
      {books.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Books Found</h3>
          <p className="text-gray-500">Click "Add Book" to add your first book</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <div key={book.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">{book.title}</h4>
                  <p className="text-sm text-gray-500">{book.author}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <FaBook />
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>ISBN: {book.isbn || 'N/A'}</p>
                <p>Category: {book.category || 'General'}</p>
                <p>Available: {book.available_copies}/{book.total_copies}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Add Book</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateBook}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author *</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" disabled={createBookMutation.isLoading} className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2">
                  {createBookMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                  Add Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Issue Book</h3>
              <button onClick={() => setShowIssueModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleIssueBook}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book *</label>
                  <select
                    value={issueData.bookId}
                    onChange={(e) => setIssueData({ ...issueData, bookId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="">Select Book</option>
                    {books.filter(b => b.available_copies > 0).map(book => (
                      <option key={book.id} value={book.id}>{book.title} ({book.available_copies} available)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                  <select
                    value={issueData.studentId}
                    onChange={(e) => setIssueData({ ...issueData, studentId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="">Select Student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>{student.first_name} {student.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={issueData.dueDate}
                    onChange={(e) => setIssueData({ ...issueData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowIssueModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" disabled={issueBookMutation.isLoading} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2">
                  {issueBookMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaExchangeAlt />}
                  Issue Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;