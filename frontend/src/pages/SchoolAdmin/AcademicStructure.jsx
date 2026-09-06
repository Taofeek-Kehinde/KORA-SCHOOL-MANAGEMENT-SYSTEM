import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaCalendarAlt, FaSchool, FaUsers, FaBuilding, FaCheck, FaTimes } from 'react-icons/fa';

const AcademicStructure = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('sessions');

  // Fetch sessions
  const { data: sessionsData, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic-structure/schools/${user?.schoolId}/sessions`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch terms
  const { data: termsData, refetch: refetchTerms } = useQuery({
    queryKey: ['terms', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic-structure/schools/${user?.schoolId}/terms`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch departments
  const { data: departmentsData, refetch: refetchDepartments } = useQuery({
    queryKey: ['departments', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic-structure/schools/${user?.schoolId}/departments`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch classes
  const { data: classesData, refetch: refetchClasses } = useQuery({
    queryKey: ['classes', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic-structure/schools/${user?.schoolId}/classes`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch arms
  const { data: armsData, refetch: refetchArms } = useQuery({
    queryKey: ['arms', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic-structure/schools/${user?.schoolId}/arms`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const sessions = sessionsData?.data || [];
  const terms = termsData?.data || [];
  const departments = departmentsData?.data || [];
  const classes = classesData?.data || [];
  const arms = armsData?.data || [];

  const tabs = [
    { id: 'sessions', label: 'Sessions', icon: FaCalendarAlt },
    { id: 'terms', label: 'Terms', icon: FaSchool },
    { id: 'departments', label: 'Departments', icon: FaBuilding },
    { id: 'classes', label: 'Classes', icon: FaUsers },
    { id: 'arms', label: 'Arms', icon: FaSchool },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Academic Structure</h1>
        <p className="text-gray-500 mt-1">Manage sessions, terms, departments, classes, and arms</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-kora-primary text-kora-primary font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="text-sm" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'sessions' && <SessionsTab sessions={sessions} schoolId={user?.schoolId} refetch={refetchSessions} />}
          {activeTab === 'terms' && <TermsTab terms={terms} schoolId={user?.schoolId} refetch={refetchTerms} />}
          {activeTab === 'departments' && <DepartmentsTab departments={departments} schoolId={user?.schoolId} refetch={refetchDepartments} />}
          {activeTab === 'classes' && <ClassesTab classes={classes} schoolId={user?.schoolId} refetch={refetchClasses} />}
          {activeTab === 'arms' && <ArmsTab arms={arms} schoolId={user?.schoolId} refetch={refetchArms} />}
        </div>
      </div>
    </div>
  );
};

// Sessions Tab
const SessionsTab = ({ sessions, schoolId, refetch }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '', isCurrent: false });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/academic-structure/schools/${schoolId}/sessions`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Session created successfully');
      setShowModal(false);
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create session')
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Academic Sessions</h3>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2">
          <FaPlus /> Add Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No sessions yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => (
            <div key={session.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{session.name}</p>
                  <p className="text-sm text-gray-500">
                    {session.start_date ? new Date(session.start_date).toLocaleDateString() : 'N/A'} - {session.end_date ? new Date(session.end_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                {session.is_current && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Current</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Add Session" onClose={() => setShowModal(false)}>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}>
            <input type="text" placeholder="Session Name (e.g., 2026/2027)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <label className="flex items-center gap-2 mb-3">
              <input type="checkbox" checked={formData.isCurrent} onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })} className="w-4 h-4 text-kora-primary" />
              <span className="text-sm">Set as Current Session</span>
            </label>
            <button type="submit" className="w-full px-4 py-2 bg-kora-primary text-white rounded-lg">Create Session</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Terms Tab
const TermsTab = ({ terms, schoolId, refetch }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ sessionId: '', name: '', openingDate: '', closingDate: '', isCurrent: false });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/academic-structure/schools/${schoolId}/terms`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Term created successfully');
      setShowModal(false);
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create term')
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Academic Terms</h3>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2">
          <FaPlus /> Add Term
        </button>
      </div>

      {terms.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No terms yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {terms.map((term) => (
            <div key={term.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{term.name}</p>
                  <p className="text-sm text-gray-500">{term.opening_date ? new Date(term.opening_date).toLocaleDateString() : 'N/A'} - {term.closing_date ? new Date(term.closing_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                {term.is_current && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Current</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Add Term" onClose={() => setShowModal(false)}>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}>
            <input type="text" placeholder="Term Name (e.g., First Term)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <input type="date" value={formData.openingDate} onChange={(e) => setFormData({ ...formData, openingDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <input type="date" value={formData.closingDate} onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <label className="flex items-center gap-2 mb-3">
              <input type="checkbox" checked={formData.isCurrent} onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })} className="w-4 h-4 text-kora-primary" />
              <span className="text-sm">Set as Current Term</span>
            </label>
            <button type="submit" className="w-full px-4 py-2 bg-kora-primary text-white rounded-lg">Create Term</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Departments Tab
const DepartmentsTab = ({ departments, schoolId, refetch }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/academic-structure/schools/${schoolId}/departments`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Department created successfully');
      setShowModal(false);
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create department')
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Departments</h3>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2">
          <FaPlus /> Add Department
        </button>
      </div>

      {departments.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No departments yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-800">{dept.name}</p>
              <p className="text-sm text-gray-500">{dept.description || 'No description'}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Add Department" onClose={() => setShowModal(false)}>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}>
            <input type="text" placeholder="Department Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" rows="2" />
            <button type="submit" className="w-full px-4 py-2 bg-kora-primary text-white rounded-lg">Create Department</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Classes Tab
const ClassesTab = ({ classes, schoolId, refetch }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', level: '', capacity: 50 });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/academic-structure/schools/${schoolId}/classes`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Class created successfully');
      setShowModal(false);
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create class')
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Classes</h3>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2">
          <FaPlus /> Add Class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No classes yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-800">{cls.name}</p>
              <p className="text-sm text-gray-500">Level: {cls.level}</p>
              <p className="text-sm text-gray-500">Students: {cls.student_count || 0}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Add Class" onClose={() => setShowModal(false)}>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}>
            <input type="text" placeholder="Class Name (e.g., JSS1A)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <input type="text" placeholder="Level (e.g., JSS 1)" value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <input type="number" placeholder="Capacity" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" />
            <button type="submit" className="w-full px-4 py-2 bg-kora-primary text-white rounded-lg">Create Class</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Arms Tab
const ArmsTab = ({ arms, schoolId, refetch }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ classId: '', name: '', capacity: 40 });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/academic-structure/schools/${schoolId}/arms`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Arm created successfully');
      setShowModal(false);
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create arm')
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Class Arms (Streams)</h3>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2">
          <FaPlus /> Add Arm
        </button>
      </div>

      {arms.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No arms yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {arms.map((arm) => (
            <div key={arm.id} className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-800">{arm.name}</p>
              <p className="text-sm text-gray-500">Class: {arm.classes?.name || 'N/A'}</p>
              <p className="text-sm text-gray-500">Capacity: {arm.capacity}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Add Arm" onClose={() => setShowModal(false)}>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}>
            <input type="text" placeholder="Arm Name (e.g., JSS1A)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" required />
            <input type="number" placeholder="Capacity" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3" />
            <button type="submit" className="w-full px-4 py-2 bg-kora-primary text-white rounded-lg">Create Arm</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Modal Component
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div className="bg-white rounded-xl max-w-md w-full p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
          <FaTimes />
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default AcademicStructure;