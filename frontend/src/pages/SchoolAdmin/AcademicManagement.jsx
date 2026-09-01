import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaCalendarAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaSchool,
  FaBook,
  FaUsers,
  FaUserTie,
  FaPalette,
  FaQuoteRight,
  FaPen,
  FaFileAlt,
  FaGraduationCap,
  FaChalkboard,
  FaBookOpen,
  FaBuilding,
} from 'react-icons/fa';

import SessionModal from '../SuperAdmin/components/SessionModal';
import TermModal from './components/TermModal';
import ClassModal from './components/ClassModal';
import SubjectModal from './components/SubjectModal';
import DepartmentModal from './components/DepartmentModal';
import GradingModal from './components/GradingModal';
import SchoolProfileModal from './components/SchoolProfileModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const AcademicManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('sessions');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  // Fetch academic sessions
  const { data: sessionsData, refetch: refetchSessions } = useQuery({
    queryKey: ['academicSessions', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/sessions`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch terms
  const { data: termsData, refetch: refetchTerms } = useQuery({
    queryKey: ['terms', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/terms`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const { data: teachersData } = useQuery({
  queryKey: ['teachers', user?.schoolId],
  queryFn: async () => {
    const response = await api.get(`/academic/schools/${user?.schoolId}/teachers`);
    return response.data;
  },
  enabled: !!user?.schoolId,
});


  // Fetch classes
  const { data: classesData, refetch: refetchClasses } = useQuery({
    queryKey: ['classes', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/classes`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch subjects
  const { data: subjectsData, refetch: refetchSubjects } = useQuery({
    queryKey: ['subjects', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/subjects`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch departments
  const { data: departmentsData, refetch: refetchDepartments } = useQuery({
    queryKey: ['departments', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/departments`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch grading system
  const { data: gradingData, refetch: refetchGrading } = useQuery({
    queryKey: ['gradingSystem', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/grading`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch school profile
  const { data: profileData, refetch: refetchProfile } = useQuery({
    queryKey: ['schoolProfile', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/profile`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const sessions = sessionsData?.data || [];
  const terms = termsData?.data || [];
  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];
  const departments = departmentsData?.data || [];
  const grading = gradingData?.data || [];
  const profile = profileData?.data || {};

  const tabs = [
    { id: 'sessions', label: 'Sessions', icon: FaCalendarAlt },
    { id: 'terms', label: 'Terms', icon: FaBook },
    { id: 'classes', label: 'Classes', icon: FaUsers },
    { id: 'subjects', label: 'Subjects', icon: FaBookOpen },
    { id: 'departments', label: 'Departments', icon: FaBuilding },
    { id: 'grading', label: 'Grading', icon: FaGraduationCap },
    { id: 'profile', label: 'School Profile', icon: FaPalette },
  ];

  const handleOpenModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleDelete = (type, id) => {
    setConfirmAction(type);
    setConfirmId(id);
    setShowConfirm(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sessions':
        return renderSessions();
      case 'terms':
        return renderTerms();
      case 'classes':
        return renderClasses();
      case 'subjects':
        return renderSubjects();
      case 'departments':
        return renderDepartments();
      case 'grading':
        return renderGrading();
      case 'profile':
        return renderProfile();
      default:
        return null;
    }
  };

  const renderSessions = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Academic Sessions</h3>
        <button
          onClick={() => handleOpenModal('session')}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
        >
          <FaPlus /> Add Session
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map((session) => (
          <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-800">{session.name}</h4>
                <p className="text-sm text-gray-500">
                  {new Date(session.start_date).toLocaleDateString()} - {new Date(session.end_date).toLocaleDateString()}
                </p>
                {session.is_current && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                    <FaCheck className="mr-1 text-xs" /> Current
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleOpenModal('session', session)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete('session', session.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTerms = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Terms</h3>
        <button
          onClick={() => handleOpenModal('term')}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
        >
          <FaPlus /> Add Term
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {terms.map((term) => (
          <div key={term.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-800">{term.name}</h4>
                <p className="text-sm text-gray-500">Order: {term.order}</p>
                {term.start_date && term.end_date && (
                  <p className="text-sm text-gray-500">
                    {new Date(term.start_date).toLocaleDateString()} - {new Date(term.end_date).toLocaleDateString()}
                  </p>
                )}
                {term.is_current && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                    <FaCheck className="mr-1 text-xs" /> Current
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleOpenModal('term', term)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete('term', term.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderClasses = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Classes</h3>
        <button
          onClick={() => handleOpenModal('class')}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
        >
          <FaPlus /> Add Class
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <div key={cls.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-800">{cls.name}</h4>
                <p className="text-sm text-gray-500">Level: {cls.level}</p>
                <p className="text-sm text-gray-500">Students: {cls.student_count || 0}</p>
                {cls.class_teacher_id && (
                  <p className="text-sm text-gray-500">
                    Teacher: {cls.teachers?.first_name} {cls.teachers?.last_name}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleOpenModal('class', cls)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete('class', cls.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSubjects = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Subjects</h3>
        <button
          onClick={() => handleOpenModal('subject')}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
        >
          <FaPlus /> Add Subject
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <div key={subject.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-800">{subject.name}</h4>
                <p className="text-sm text-gray-500">Code: {subject.code}</p>
                <p className="text-sm text-gray-500">Classes: {subject.class_count || 0}</p>
                {subject.is_core && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Core
                  </span>
                )}
                {subject.is_elective && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ml-1">
                    Elective
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleOpenModal('subject', subject)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete('subject', subject.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDepartments = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Departments</h3>
        <button
          onClick={() => handleOpenModal('department')}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
        >
          <FaPlus /> Add Department
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => (
          <div key={dept.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-800">{dept.name}</h4>
                {dept.head_of_department_id && (
                  <p className="text-sm text-gray-500">
                    Head: {dept.teachers?.first_name} {dept.teachers?.last_name}
                  </p>
                )}
                {dept.description && (
                  <p className="text-sm text-gray-500">{dept.description}</p>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleOpenModal('department', dept)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete('department', dept.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGrading = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Grading System</h3>
        <button
          onClick={() => handleOpenModal('grading')}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
        >
          <FaPlus /> Add Grade
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Min Score</th>
              <th className="px-4 py-3">Max Score</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {grading.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{rule.grade}</td>
                <td className="px-4 py-3">{rule.min_score}</td>
                <td className="px-4 py-3">{rule.max_score}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{rule.description || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${rule.is_pass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {rule.is_pass ? 'Pass' : 'Fail'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenModal('grading', rule)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete('grading', rule.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">School Profile</h3>
        <button
          onClick={() => handleOpenModal('profile')}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
        >
          <FaEdit /> Edit Profile
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <FaPalette className="text-kora-primary" />
            School Colours
          </h4>
          <div className="mt-2 flex gap-3">
            <div>
              <span className="text-sm text-gray-500">Primary</span>
              <div
                className="w-16 h-16 rounded-lg border border-gray-300"
                style={{ backgroundColor: profile.school_colours?.primary || '#4F46E5' }}
              />
            </div>
            <div>
              <span className="text-sm text-gray-500">Secondary</span>
              <div
                className="w-16 h-16 rounded-lg border border-gray-300"
                style={{ backgroundColor: profile.school_colours?.secondary || '#7C3AED' }}
              />
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <FaQuoteRight className="text-kora-primary" />
            School Motto
          </h4>
          <p className="mt-2 text-gray-600 italic">"{profile.motto || 'No motto set'}"</p>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <FaPen className="text-kora-primary" />
            School Signature
          </h4>
          {profile.signature_url ? (
            <img src={profile.signature_url} alt="School Signature" className="mt-2 max-h-16" />
          ) : (
            <p className="mt-2 text-gray-400">No signature uploaded</p>
          )}
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <FaFileAlt className="text-kora-primary" />
            Report Card Design
          </h4>
          <p className="mt-2 text-gray-600">
            Template: {profile.report_card_design?.template || 'Default'}
          </p>
          <p className="text-sm text-gray-500">
            Show Logo: {profile.report_card_design?.showLogo ? 'Yes' : 'No'}
          </p>
          <p className="text-sm text-gray-500">
            Show Motto: {profile.report_card_design?.showMotto ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    </div>
  );

  // Modal rendering logic
  const renderModal = () => {
    if (!showModal) return null;

    const modalProps = {
      schoolId: user?.schoolId,
      item: selectedItem,
      onClose: () => {
        setShowModal(false);
        setSelectedItem(null);
      },
      onSuccess: () => {
        setShowModal(false);
        setSelectedItem(null);
        const refetchMap = {
          session: refetchSessions,
          term: refetchTerms,
          class: refetchClasses,
          subject: refetchSubjects,
          department: refetchDepartments,
          grading: refetchGrading,
          profile: refetchProfile,
        };
        refetchMap[modalType]?.();
      }
    };

    switch (modalType) {
      case 'session':
        return <SessionModal {...modalProps} />;
      case 'term':
        return <TermModal {...modalProps} />;
      case 'class':
        return <ClassModal {...modalProps} teachers={teachersData?.data || []} />;
      case 'subject':
        return <SubjectModal {...modalProps} />;
      case 'department':
        return <DepartmentModal {...modalProps} teachers={teachersData?.data || []} />;
      case 'grading':
        return <GradingModal {...modalProps} />;
      case 'profile':
        return <SchoolProfileModal {...modalProps} />;
      default:
        return null;
    }
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }) => {
      const endpoints = {
        session: `/academic/schools/${user?.schoolId}/sessions/${id}`,
        term: `/academic/schools/${user?.schoolId}/terms/${id}`,
        class: `/academic/schools/${user?.schoolId}/classes/${id}`,
        subject: `/academic/schools/${user?.schoolId}/subjects/${id}`,
        department: `/academic/schools/${user?.schoolId}/departments/${id}`,
        grading: `/academic/schools/${user?.schoolId}/grading/${id}`,
      };
      const response = await api.delete(endpoints[type]);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Deleted successfully');
      setShowConfirm(false);
      const refetchMap = {
        session: refetchSessions,
        term: refetchTerms,
        class: refetchClasses,
        subject: refetchSubjects,
        department: refetchDepartments,
        grading: refetchGrading,
      };
      refetchMap[confirmAction]?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  });

  const handleConfirmDelete = () => {
    deleteMutation.mutate({ type: confirmAction, id: confirmId });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Academic Management</h1>
        <p className="text-gray-500 mt-1">Manage sessions, terms, classes, subjects, and more</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex">
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
          {renderTabContent()}
        </div>
      </div>

      {/* Modals */}
      {renderModal()}

      {/* Confirm Dialog */}
      {showConfirm && (
        <ConfirmDialog
          title="Delete Item"
          message="Are you sure you want to delete this item? This action cannot be undone."
          type="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirm(false)}
          isLoading={deleteMutation.isLoading}
        />
      )}
    </div>
  );
};

export default AcademicManagement;