import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaBook, FaCheck, FaTimes, FaListAlt } from 'react-icons/fa';

const Curriculum = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);
  const [formData, setFormData] = useState({ name: '', curriculumType: 'custom', description: '' });
  const [topicData, setTopicData] = useState({ subjectId: '', classId: '', weekNumber: '', topic: '', learningObjectives: '', learningOutcomes: '', assessmentMethods: '' });

  // Fetch curricula
  const { data: curriculaData, refetch } = useQuery({
    queryKey: ['curricula', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/curricula/schools/${user?.schoolId}/curricula`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch topics for selected curriculum
  const { data: topicsData, refetch: refetchTopics } = useQuery({
    queryKey: ['curriculumTopics', selectedCurriculum?.id],
    queryFn: async () => {
      if (!selectedCurriculum) return { data: [] };
      const response = await api.get(`/curricula/${selectedCurriculum.id}/topics`);
      return response.data;
    },
    enabled: !!selectedCurriculum,
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

  const curricula = curriculaData?.data || [];
  const topics = topicsData?.data || [];
  const subjects = subjectsData?.data || [];
  const classes = classesData?.data || [];

  // Create curriculum
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/curricula/schools/${user?.schoolId}/curricula`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Curriculum created successfully');
      setShowModal(false);
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create curriculum')
  });

  // Add topic
  const addTopicMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/curricula/${selectedCurriculum.id}/topics`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Topic added successfully');
      setShowTopicModal(false);
      refetchTopics();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to add topic')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleAddTopic = (e) => {
    e.preventDefault();
    if (!topicData.subjectId || !topicData.classId || !topicData.weekNumber || !topicData.topic) {
      toast.error('Subject, class, week number, and topic are required');
      return;
    }
    addTopicMutation.mutate(topicData);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Curriculum Management</h1>
          <p className="text-gray-500 mt-1">Manage curricula and learning topics</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2 mt-3 md:mt-0">
          <FaPlus /> Add Curriculum
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Curricula List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Curricula</h3>
          {curricula.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No curricula yet</div>
          ) : (
            <div className="space-y-3">
              {curricula.map((curr) => (
                <button
                  key={curr.id}
                  onClick={() => setSelectedCurriculum(curr)}
                  className={`w-full text-left border rounded-lg p-4 transition-all ${
                    selectedCurriculum?.id === curr.id ? 'border-kora-primary bg-kora-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{curr.name}</p>
                      <p className="text-sm text-gray-500">{curr.curriculum_type}</p>
                    </div>
                    {selectedCurriculum?.id === curr.id && <FaCheck className="text-kora-primary" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Topics List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedCurriculum ? `Topics - ${selectedCurriculum.name}` : 'Select a Curriculum'}
            </h3>
            {selectedCurriculum && (
              <button onClick={() => setShowTopicModal(true)} className="px-3 py-1 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-1 text-sm">
                <FaPlus /> Add Topic
              </button>
            )}
          </div>

          {!selectedCurriculum ? (
            <div className="text-center py-8 text-gray-400">Select a curriculum to view topics</div>
          ) : topics.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No topics yet</div>
          ) : (
            <div className="space-y-3">
              {topics.map((topic) => (
                <div key={topic.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Week {topic.week_number}: {topic.topic}</p>
                      <p className="text-sm text-gray-500">{topic.subjects?.name} - {topic.classes?.name}</p>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><FaEdit /></button>
                      <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><FaTrash /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Curriculum Modal */}
      {showModal && (
        <Modal title="Add Curriculum" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Curriculum Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <select value={formData.curriculumType} onChange={(e) => setFormData({ ...formData, curriculumType: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3">
              <option value="national">National Curriculum</option>
              <option value="british">British Curriculum</option>
              <option value="montessori">Montessori Curriculum</option>
              <option value="custom">Custom Curriculum</option>
            </select>
            <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <button type="submit" className="w-full px-4 py-2 bg-kora-primary text-white rounded-lg">Create Curriculum</button>
          </form>
        </Modal>
      )}

      {/* Add Topic Modal */}
      {showTopicModal && selectedCurriculum && (
        <Modal title={`Add Topic - ${selectedCurriculum.name}`} onClose={() => setShowTopicModal(false)}>
          <form onSubmit={handleAddTopic}>
            <select value={topicData.subjectId} onChange={(e) => setTopicData({ ...topicData, subjectId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required>
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={topicData.classId} onChange={(e) => setTopicData({ ...topicData, classId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="number" placeholder="Week Number" value={topicData.weekNumber} onChange={(e) => setTopicData({ ...topicData, weekNumber: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <input type="text" placeholder="Topic" value={topicData.topic} onChange={(e) => setTopicData({ ...topicData, topic: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <textarea placeholder="Learning Objectives" value={topicData.learningObjectives} onChange={(e) => setTopicData({ ...topicData, learningObjectives: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <textarea placeholder="Learning Outcomes" value={topicData.learningOutcomes} onChange={(e) => setTopicData({ ...topicData, learningOutcomes: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <textarea placeholder="Assessment Methods" value={topicData.assessmentMethods} onChange={(e) => setTopicData({ ...topicData, assessmentMethods: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <button type="submit" className="w-full px-4 py-2 bg-kora-primary text-white rounded-lg">Add Topic</button>
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

export default Curriculum;