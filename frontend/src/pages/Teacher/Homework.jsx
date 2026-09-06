import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaPlus, FaTrash, FaSpinner, FaSave, FaBook, FaClock, FaTimes } from 'react-icons/fa';
import HomeworkSubmissionsModal from './HomeworkSubmissionsModal';

const Homework = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [viewingHomework, setViewingHomework] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    subjectId: ''
  });

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/classes`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch subjects
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/subjects`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch homework for class
  const { data: homeworkData, refetch } = useQuery({
    queryKey: ['homework', user?.schoolId, selectedClass],
    queryFn: async () => {
      if (!selectedClass) return { data: [] };
      const response = await api.get(`/homework/schools/${user?.schoolId}/homework`, {
        params: { classId: selectedClass }
      });
      return response.data;
    },
    enabled: !!user?.schoolId && !!selectedClass,
  });

  // Create homework
  const createHomeworkMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/homework/schools/${user?.schoolId}/homework`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Homework created successfully');
      setShowCreateModal(false);
      setFormData({ title: '', description: '', dueDate: '', subjectId: '' });
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create homework');
    }
  });

  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];
  const homework = homeworkData?.data || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !selectedClass) {
      toast.error('Title and class are required');
      return;
    }
    createHomeworkMutation.mutate({
      ...formData,
      classId: selectedClass,
      teacherId: user?.teacherId || user?.id
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Homework</h1>
          <p className="text-gray-500 mt-1">Create and manage homework for your class</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2 mt-3 md:mt-0"
        >
          <FaPlus />
          Create Homework
        </button>
      </div>

      {/* Class Selector */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
        >
          <option value="">Select a class</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
      </div>

      {/* Homework List */}
      {selectedClass && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Homework List</h3>
          {homework.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FaBook className="text-4xl mx-auto mb-2 text-gray-300" />
              No homework assigned yet
            </div>
          ) : (
            <div className="space-y-3">
              {homework.map((hw) => (
                <div
                  key={hw.id}
                  onClick={() => setViewingHomework(hw)}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md hover:border-kora-primary transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{hw.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{hw.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Due: {hw.due_date ? new Date(hw.due_date).toLocaleDateString() : 'N/A'}
                        {hw.subjects?.name && ` • ${hw.subjects.name}`}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-kora-primary mt-2">Click to view submissions →</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Homework Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Create Homework</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    placeholder="e.g., Mathematics Assignment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    placeholder="Enter homework details..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createHomeworkMutation.isLoading}
                  className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
                >
                  {createHomeworkMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  Create Homework
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions / Grading Modal */}
      {viewingHomework && (
        <HomeworkSubmissionsModal
          homework={viewingHomework}
          onClose={() => setViewingHomework(null)}
        />
      )}
    </div>
  );
};

export default Homework;