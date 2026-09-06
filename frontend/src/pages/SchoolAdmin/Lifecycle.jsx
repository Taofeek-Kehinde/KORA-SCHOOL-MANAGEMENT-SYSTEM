import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaSearch,
  FaCheck,
  FaSpinner,
  FaHistory,
  FaUserGraduate,
  FaArrowRight,
  FaUsers,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';

const Lifecycle = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch students
  const { data: studentsData } = useQuery({
    queryKey: ['students', user?.schoolId, searchTerm],
    queryFn: async () => {
      const response = await api.get(`/students/schools/${user?.schoolId}/students`, {
        params: { search: searchTerm || undefined, limit: 50 }
      });
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch lifecycle dashboard
  const { data: dashboardData } = useQuery({
    queryKey: ['lifecycleDashboard', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/lifecycle/schools/${user?.schoolId}/dashboard`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch lifecycle status for selected student
  const { data: lifecycleData, refetch: refetchLifecycle } = useQuery({
    queryKey: ['lifecycleStatus', user?.schoolId, selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return { data: null };
      const response = await api.get(`/lifecycle/schools/${user?.schoolId}/status`, {
        params: { studentId: selectedStudentId }
      });
      return response.data;
    },
    enabled: !!user?.schoolId && !!selectedStudentId,
  });

  // Update lifecycle stage
  const updateStageMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/lifecycle/schools/${user?.schoolId}/update`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      refetchLifecycle();
      queryClient.invalidateQueries(['lifecycleDashboard', user?.schoolId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update lifecycle stage');
    }
  });

  const students = studentsData?.data || [];
  const dashboard = dashboardData?.data;
  const lifecycle = lifecycleData?.data;

  const stages = [
    'application',
    'admission_review',
    'admission_approved',
    'enrollment',
    'class_allocation',
    'fee_assignment',
    'attendance',
    'learning',
    'examinations',
    'promotion',
    'graduation',
    'alumni'
  ];

  const stageLabels = {
    'application': 'Application',
    'admission_review': 'Admission Review',
    'admission_approved': 'Admission Approved',
    'enrollment': 'Enrollment',
    'class_allocation': 'Class Allocation',
    'fee_assignment': 'Fee Assignment',
    'attendance': 'Attendance',
    'learning': 'Learning',
    'examinations': 'Examinations',
    'promotion': 'Promotion',
    'graduation': 'Graduation',
    'alumni': 'Alumni'
  };

  const handleStageUpdate = (newStage) => {
    if (!selectedStudentId) return;
    if (window.confirm(`Move student to ${stageLabels[newStage]}?`)) {
      updateStageMutation.mutate({
        studentId: selectedStudentId,
        newStage
      });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Student Lifecycle</h1>
        <p className="text-gray-500 mt-1">Track and manage the full student journey</p>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(dashboard?.stage_counts || {}).map(([stage, count]) => (
          <div key={stage} className="bg-white rounded-xl shadow-md p-4 text-center">
            <p className="text-2xl font-bold text-kora-primary">{count}</p>
            <p className="text-sm text-gray-500">{stageLabels[stage] || stage}</p>
          </div>
        ))}
        {Object.keys(dashboard?.stage_counts || {}).length === 0 && (
          <div className="col-span-full bg-white rounded-xl shadow-md p-8 text-center text-gray-400">
            <FaUsers className="text-4xl mx-auto mb-2 text-gray-300" />
            No students yet
          </div>
        )}
      </div>

      {/* Student Search */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
        {students.length > 0 && (
          <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
            {students.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                  selectedStudentId === student.id ? 'bg-kora-primary/10' : ''
                }`}
              >
                <div>
                  <p className="font-medium text-gray-800">{student.first_name} {student.last_name}</p>
                  <p className="text-xs text-gray-500">{student.admission_number} • {student.classes?.name}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {student.lifecycle_stage || 'application'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lifecycle Details */}
      {lifecycle && (
        <div className="bg-white rounded-xl shadow-md p-6">
          {/* Current Stage */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Current Stage: <span className="text-kora-primary">{stageLabels[lifecycle.student?.lifecycle_stage] || 'Application'}</span>
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {lifecycle.student?.first_name} {lifecycle.student?.last_name} • {lifecycle.student?.admission_number}
              </p>
            </div>
          </div>

          {/* Stage Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {stages.map((stage, index) => {
                const currentStage = lifecycle.student?.lifecycle_stage || 'application';
                const isComplete = stages.indexOf(currentStage) > index;
                const isCurrent = stages.indexOf(currentStage) === index;

                return (
                  <div key={stage} className="relative flex items-start gap-4">
                    <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isComplete ? 'bg-green-500 border-green-500 text-white' :
                      isCurrent ? 'bg-kora-primary border-kora-primary text-white' :
                      'bg-gray-100 border-gray-200 text-gray-400'
                    }`}>
                      {isComplete ? <FaCheck /> : index + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${isComplete || isCurrent ? 'text-gray-800' : 'text-gray-400'}`}>
                          {stageLabels[stage]}
                        </p>
                        {isCurrent && (
                          <button
                            onClick={() => handleStageUpdate(stages[index + 1])}
                            disabled={!stages[index + 1] || updateStageMutation.isLoading}
                            className="px-3 py-1 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary text-xs flex items-center gap-1"
                          >
                            {updateStageMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaArrowRight />}
                            Move to {stageLabels[stages[index + 1]] || 'Next'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* History */}
          {lifecycle.lifecycle_history?.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaHistory className="text-kora-primary" />
                Lifecycle History
              </h3>
              <div className="space-y-2">
                {lifecycle.lifecycle_history.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-kora-primary/10 flex items-center justify-center">
                      <FaHistory className="text-kora-primary text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">
                        {event.previous_stage || 'N/A'} → {event.new_stage}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(event.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Lifecycle;