import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaCheck, FaTimes, FaFileAlt, FaEye } from 'react-icons/fa';

const LessonNotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [showView, setShowView] = useState(false);
  const [formData, setFormData] = useState({
    subjectId: '',
    classId: '',
    date: '',
    weekNumber: '',
    topic: '',
    objectives: '',
    previousKnowledge: '',
    teachingAids: '',
    lessonDevelopment: '',
    evaluation: '',
    assignment: ''
  });

  // Fetch lesson notes
  const { data: notesData, refetch } = useQuery({
    queryKey: ['lessonNotes', user?.schoolId, user?.teacherId],
    queryFn: async () => {
      const response = await api.get(`/lesson-notes/schools/${user?.schoolId}/lesson-notes`, {
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
      const response = await api.get(`/academic/schools/${user?.schoolId}/subjects`);
      return response.data;
    },
    enabled: !!user?.schoolId,
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

  const notes = notesData?.data || [];
  const subjects = subjectsData?.data || [];
  const classes = classesData?.data || [];

  // Create lesson note
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/lesson-notes/schools/${user?.schoolId}/lesson-notes`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Lesson note created successfully');
      setShowModal(false);
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create lesson note')
  });

  const handleSubmit = (e) => {
  e.preventDefault();
  if (!formData.subjectId || !formData.classId || !formData.topic) {
    toast.error('Subject, class, and topic are required');
    return;
  }
  if (!user?.teacherId) {
    toast.error('Unable to identify your teacher account. Please log out and back in.');
    return;
  }
  createMutation.mutate({ ...formData, teacherId: user.teacherId });
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Lesson Notes</h1>
          <p className="text-gray-500 mt-1">Create and manage your lesson notes</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2 mt-3 md:mt-0">
          <FaPlus /> Create Lesson Note
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaFileAlt className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Lesson Notes</h3>
          <p className="text-gray-500">Click "Create Lesson Note" to create your first lesson note</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{note.topic}</p>
                  <p className="text-sm text-gray-500">{note.subjects?.name} - {note.classes?.name}</p>
                  <p className="text-xs text-gray-400">Week {note.week_number} • {note.date ? new Date(note.date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(note.status)}`}>
                  {note.status}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setSelectedNote(note); setShowView(true); }} className="flex-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center justify-center gap-1">
                  <FaEye /> View
                </button>
                <button onClick={() => { setSelectedNote(note); setShowModal(true); setFormData({ subjectId: note.subject_id, classId: note.class_id, date: note.date, weekNumber: note.week_number, topic: note.topic, objectives: note.objectives, previousKnowledge: note.previous_knowledge, teachingAids: note.teaching_aids, lessonDevelopment: note.lesson_development, evaluation: note.evaluation, assignment: note.assignment }); }} className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm flex items-center justify-center gap-1">
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
        <Modal title={selectedNote ? 'Edit Lesson Note' : 'Create Lesson Note'} onClose={() => { setShowModal(false); setSelectedNote(null); }}>
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
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" />
              <input type="number" placeholder="Week Number" value={formData.weekNumber} onChange={(e) => setFormData({ ...formData, weekNumber: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <input type="text" placeholder="Topic" value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <textarea placeholder="Objectives" value={formData.objectives} onChange={(e) => setFormData({ ...formData, objectives: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <textarea placeholder="Previous Knowledge" value={formData.previousKnowledge} onChange={(e) => setFormData({ ...formData, previousKnowledge: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <textarea placeholder="Teaching Aids" value={formData.teachingAids} onChange={(e) => setFormData({ ...formData, teachingAids: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <textarea placeholder="Lesson Development" value={formData.lessonDevelopment} onChange={(e) => setFormData({ ...formData, lessonDevelopment: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="3" />
            <textarea placeholder="Evaluation" value={formData.evaluation} onChange={(e) => setFormData({ ...formData, evaluation: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <textarea placeholder="Assignment" value={formData.assignment} onChange={(e) => setFormData({ ...formData, assignment: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <button type="submit" className="w-full px-4 py-2 bg-kora-primary text-white rounded-lg">
              {selectedNote ? 'Update' : 'Create'} Lesson Note
            </button>
          </form>
        </Modal>
      )}

      {/* View Modal */}
      {showView && selectedNote && (
        <Modal title="Lesson Note Details" onClose={() => { setShowView(false); setSelectedNote(null); }}>
          <div className="space-y-3">
            <p className="font-semibold text-gray-800">{selectedNote.topic}</p>
            <p className="text-sm text-gray-500">{selectedNote.subjects?.name} - {selectedNote.classes?.name}</p>
            <p className="text-sm text-gray-500">Week: {selectedNote.week_number} | Date: {selectedNote.date ? new Date(selectedNote.date).toLocaleDateString() : 'N/A'}</p>
            <hr />
            {selectedNote.objectives && <p><strong>Objectives:</strong> {selectedNote.objectives}</p>}
            {selectedNote.previous_knowledge && <p><strong>Previous Knowledge:</strong> {selectedNote.previous_knowledge}</p>}
            {selectedNote.teaching_aids && <p><strong>Teaching Aids:</strong> {selectedNote.teaching_aids}</p>}
            {selectedNote.lesson_development && <p><strong>Lesson Development:</strong> {selectedNote.lesson_development}</p>}
            {selectedNote.evaluation && <p><strong>Evaluation:</strong> {selectedNote.evaluation}</p>}
            {selectedNote.assignment && <p><strong>Assignment:</strong> {selectedNote.assignment}</p>}
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

export default LessonNotes;