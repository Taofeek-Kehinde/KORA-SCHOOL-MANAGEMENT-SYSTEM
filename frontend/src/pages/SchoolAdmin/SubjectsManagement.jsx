import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaBook, FaCheck, FaTimes, FaUserPlus } from 'react-icons/fa';

const SubjectsManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', weeklyPeriods: 4, passMark: 40, maxScore: 100 });
  const [assignData, setAssignData] = useState({ teacherId: '', subjectId: '', classId: '' });

  // Fetch subjects
  const { data: subjectsData, refetch, isLoading } = useQuery({
    queryKey: ['subjects', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/subjects`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch teachers
  const { data: teachersData } = useQuery({
    queryKey: ['teachers', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/teachers/schools/${user?.schoolId}/teachers`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic-structure/schools/${user?.schoolId}/classes`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const subjects = subjectsData?.data || [];
  const teachers = teachersData?.data || [];
  const classes = classesData?.data || [];

  // Create subject
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/academic/schools/${user?.schoolId}/subjects`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Subject created successfully');
      setShowModal(false);
      setFormData({ name: '', code: '', weeklyPeriods: 4, passMark: 40, maxScore: 100 });
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create subject')
  });

  // Update subject
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/academic/schools/${user?.schoolId}/subjects/${selectedSubject.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Subject updated successfully');
      setShowModal(false);
      setSelectedSubject(null);
      setFormData({ name: '', code: '', weeklyPeriods: 4, passMark: 40, maxScore: 100 });
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update subject')
  });

  // Delete subject
  const deleteMutation = useMutation({
    mutationFn: async (subjectId) => {
      const response = await api.delete(`/academic/schools/${user?.schoolId}/subjects/${subjectId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Subject deleted successfully');
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete subject')
  });

  // Assign subject to teacher
  const assignMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/academic/schools/${user?.schoolId}/subjects/assign-teacher`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Subject assigned to teacher successfully');
      setShowAssignModal(false);
      setAssignData({ teacherId: '', subjectId: '', classId: '' });
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to assign subject')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Subject name is required');
      return;
    }
    if (selectedSubject) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAssign = (e) => {
    e.preventDefault();
    if (!assignData.teacherId || !assignData.subjectId || !assignData.classId) {
      toast.error('Teacher, subject, and class are required');
      return;
    }
    assignMutation.mutate(assignData);
  };

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name || '',
      code: subject.code || '',
      weeklyPeriods: subject.weekly_periods || 4,
      passMark: subject.pass_mark || 40,
      maxScore: subject.max_score || 100
    });
    setShowModal(true);
  };

  const handleDelete = (subjectId) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      deleteMutation.mutate(subjectId);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSubject(null);
    setFormData({ name: '', code: '', weeklyPeriods: 4, passMark: 40, maxScore: 100 });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-kora-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Subjects Management</h1>
          <p className="text-gray-500 mt-1">Manage subjects and assign to teachers</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button onClick={() => setShowAssignModal(true)} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2">
            <FaUserPlus /> Assign Subject
          </button>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2">
            <FaPlus /> Add Subject
          </button>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Subjects Found</h3>
          <p className="text-gray-500">Click "Add Subject" to add your first subject</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div key={subject.id} className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{subject.name}</p>
                  <p className="text-sm text-gray-500">{subject.code}</p>
                  <p className="text-xs text-gray-400 mt-1">Periods: {subject.weekly_periods} | Pass: {subject.pass_mark} | Max: {subject.max_score}</p>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEdit(subject)} 
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                    title="Edit Subject"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleDelete(subject.id)} 
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Delete Subject"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Subject Modal */}
      {showModal && (
        <Modal title={selectedSubject ? 'Edit Subject' : 'Add Subject'} onClose={handleCloseModal}>
          <form onSubmit={handleSubmit}>
            <input 
              type="text" 
              placeholder="Subject Name" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" 
              required 
            />
            <input 
              type="text" 
              placeholder="Subject Code" 
              value={formData.code} 
              onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" 
            />
            <div className="grid grid-cols-3 gap-3 mb-3">
              <input 
                type="number" 
                placeholder="Periods" 
                value={formData.weeklyPeriods} 
                onChange={(e) => setFormData({ ...formData, weeklyPeriods: parseInt(e.target.value) })} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
              />
              <input 
                type="number" 
                placeholder="Pass Mark" 
                value={formData.passMark} 
                onChange={(e) => setFormData({ ...formData, passMark: parseInt(e.target.value) })} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
              />
              <input 
                type="number" 
                placeholder="Max Score" 
                value={formData.maxScore} 
                onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg" 
              />
            </div>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={handleCloseModal} 
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={createMutation.isLoading || updateMutation.isLoading} 
                className="flex-1 px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {(createMutation.isLoading || updateMutation.isLoading) ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                {selectedSubject ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Subject Modal */}
      {showAssignModal && (
        <Modal title="Assign Subject to Teacher" onClose={() => setShowAssignModal(false)}>
          <form onSubmit={handleAssign}>
            <select 
              value={assignData.subjectId} 
              onChange={(e) => setAssignData({ ...assignData, subjectId: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" 
              required
            >
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select 
              value={assignData.teacherId} 
              onChange={(e) => setAssignData({ ...assignData, teacherId: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" 
              required
            >
              <option value="">Select Teacher</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
            </select>
            <select 
              value={assignData.classId} 
              onChange={(e) => setAssignData({ ...assignData, classId: e.target.value })} 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" 
              required
            >
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setShowAssignModal(false)} 
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={assignMutation.isLoading} 
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {assignMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                Assign
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><FaTimes /></button>
      </div>
      {children}
    </div>
  </div>
);

export default SubjectsManagement;