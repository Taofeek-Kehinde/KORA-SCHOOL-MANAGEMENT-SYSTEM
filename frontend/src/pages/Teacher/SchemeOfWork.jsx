import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaCheck, FaTimes, FaListAlt, FaEye } from 'react-icons/fa';

const SchemeOfWork = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [showView, setShowView] = useState(false);
  const [formData, setFormData] = useState({
    subjectId: '',
    classId: '',
    termId: '',
    weekNumber: '',
    topic: '',
    learningObjectives: '',
    teachingMaterials: '',
    teachingMethod: '',
    assessmentMethod: '',
    homework: ''
  });

  // Fetch schemes
  const { data: schemesData, refetch } = useQuery({
    queryKey: ['schemesOfWork', user?.schoolId, user?.teacherId],
    queryFn: async () => {
      const response = await api.get(`/schemes-of-work/schools/${user?.schoolId}/schemes-of-work`, {
        params: { teacherId: user?.teacherId || user?.id }
      });
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch subjects
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/subjects/schools/${user?.schoolId}/subjects`);
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

  // Fetch terms
  const { data: termsData } = useQuery({
    queryKey: ['terms', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic-structure/schools/${user?.schoolId}/terms`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const schemes = schemesData?.data || [];
  const subjects = subjectsData?.data || [];
  const classes = classesData?.data || [];
  const terms = termsData?.data || [];

  // Create scheme
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/schemes-of-work/schools/${user?.schoolId}/schemes-of-work`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Scheme of work created successfully');
      setShowModal(false);
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create scheme')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subjectId || !formData.classId || !formData.termId || !formData.topic) {
      toast.error('Subject, class, term, and topic are required');
      return;
    }
    createMutation.mutate(formData);
  };

  const getStatusBadge = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Scheme of Work</h1>
          <p className="text-gray-500 mt-1">Create and manage schemes of work</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2 mt-3 md:mt-0">
          <FaPlus /> Create Scheme
        </button>
      </div>

      {schemes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaListAlt className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Schemes of Work</h3>
          <p className="text-gray-500">Click "Create Scheme" to create your first scheme</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schemes.map((scheme) => (
            <div key={scheme.id} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">Week {scheme.week_number}: {scheme.topic}</p>
                  <p className="text-sm text-gray-500">{scheme.subjects?.name} - {scheme.classes?.name}</p>
                  <p className="text-xs text-gray-400">{scheme.terms?.name || 'No Term'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(scheme.status)}`}>
                  {scheme.status}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setSelectedScheme(scheme); setShowView(true); }} className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center justify-center gap-1">
                  <FaEye /> View
                </button>
                <button onClick={() => { setSelectedScheme(scheme); setShowModal(true); setFormData({ subjectId: scheme.subject_id, classId: scheme.class_id, termId: scheme.term_id, weekNumber: scheme.week_number, topic: scheme.topic, learningObjectives: scheme.learning_objectives, teachingMaterials: scheme.teaching_materials, teachingMethod: scheme.teaching_method, assessmentMethod: scheme.assessment_method, homework: scheme.homework }); }} className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm flex items-center justify-center gap-1">
                  <FaEdit /> Edit
                </button>
                <button className="flex-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm flex items-center justify-center gap-1">
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal title={selectedScheme ? 'Edit Scheme' : 'Create Scheme'} onClose={() => { setShowModal(false); setSelectedScheme(null); }}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <select value={formData.subjectId} onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" required>
                <option value="">Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" required>
                <option value="">Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <select value={formData.termId} onChange={(e) => setFormData({ ...formData, termId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required>
              <option value="">Select Term</option>
              {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input type="number" placeholder="Week Number" value={formData.weekNumber} onChange={(e) => setFormData({ ...formData, weekNumber: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <input type="text" placeholder="Topic" value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <textarea placeholder="Learning Objectives" value={formData.learningObjectives} onChange={(e) => setFormData({ ...formData, learningObjectives: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <textarea placeholder="Teaching Materials" value={formData.teachingMaterials} onChange={(e) => setFormData({ ...formData, teachingMaterials: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <textarea placeholder="Teaching Method" value={formData.teachingMethod} onChange={(e) => setFormData({ ...formData, teachingMethod: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <textarea placeholder="Assessment Method" value={formData.assessmentMethod} onChange={(e) => setFormData({ ...formData, assessmentMethod: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <textarea placeholder="Homework" value={formData.homework} onChange={(e) => setFormData({ ...formData, homework: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <button type="submit" className="w-full px-4 py-2 bg-kora-primary text-white rounded-lg">
              {selectedScheme ? 'Update' : 'Create'} Scheme
            </button>
          </form>
        </Modal>
      )}

      {/* View Modal */}
      {showView && selectedScheme && (
        <Modal title="Scheme Details" onClose={() => { setShowView(false); setSelectedScheme(null); }}>
          <div className="space-y-3">
            <p className="font-semibold text-gray-800">Week {selectedScheme.week_number}: {selectedScheme.topic}</p>
            <p className="text-sm text-gray-500">{selectedScheme.subjects?.name} - {selectedScheme.classes?.name}</p>
            <hr />
            {selectedScheme.learning_objectives && <p><strong>Learning Objectives:</strong> {selectedScheme.learning_objectives}</p>}
            {selectedScheme.teaching_materials && <p><strong>Teaching Materials:</strong> {selectedScheme.teaching_materials}</p>}
            {selectedScheme.teaching_method && <p><strong>Teaching Method:</strong> {selectedScheme.teaching_method}</p>}
            {selectedScheme.assessment_method && <p><strong>Assessment Method:</strong> {selectedScheme.assessment_method}</p>}
            {selectedScheme.homework && <p><strong>Homework:</strong> {selectedScheme.homework}</p>}
          </div>
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

export default SchemeOfWork;