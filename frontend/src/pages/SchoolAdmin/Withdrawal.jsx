import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaUserGraduate,
  FaSearch,
  FaTimes,
  FaCheck,
  FaSpinner,
  FaExclamationTriangle,
  FaHistory,
  FaLock,
  FaUndo,
  FaCalendarAlt,
  FaUser,
  FaFileAlt,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';

const Withdrawal = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('withdraw');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Withdrawal form state
  const [withdrawalData, setWithdrawalData] = useState({
    withdrawalDate: '',
    reason: '',
    withdrawalType: 'withdrawal',
    notes: ''
  });

  // Fetch students for search
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

  // Fetch withdrawn students
  const { data: withdrawnData, refetch: refetchWithdrawn } = useQuery({
    queryKey: ['withdrawnStudents', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/withdrawal/schools/${user?.schoolId}/withdrawn`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch withdrawal data when student selected
  const { data: withdrawalDataResponse, refetch: refetchWithdrawal } = useQuery({
    queryKey: ['withdrawalData', user?.schoolId, selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return { data: null };
      const response = await api.get(`/withdrawal/schools/${user?.schoolId}/data`, {
        params: { studentId: selectedStudentId }
      });
      return response.data;
    },
    enabled: !!user?.schoolId && !!selectedStudentId,
  });

  // Withdraw student mutation
  const withdrawMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/withdrawal/schools/${user?.schoolId}/withdraw`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries(['students', user?.schoolId]);
      refetchWithdrawn();
      setSelectedStudentId('');
      setWithdrawalData({
        withdrawalDate: '',
        reason: '',
        withdrawalType: 'withdrawal',
        notes: ''
      });
      setShowReasonModal(false);
      navigate('/school/students');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to withdraw student');
    }
  });

  // Reinstate student mutation
  const reinstateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/withdrawal/schools/${user?.schoolId}/reinstate`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries(['students', user?.schoolId]);
      refetchWithdrawn();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reinstate student');
    }
  });

  const students = studentsData?.data || [];
  const withdrawnStudents = withdrawnData?.data || [];

  const handleWithdraw = () => {
    if (!selectedStudentId) {
      toast.error('Please select a student');
      return;
    }
    if (!withdrawalData.reason) {
      toast.error('Please provide a withdrawal reason');
      return;
    }
    if (!withdrawalData.withdrawalDate) {
      toast.error('Please select withdrawal date');
      return;
    }

    setShowReasonModal(true);
  };

  const confirmWithdraw = () => {
    withdrawMutation.mutate({
      studentId: selectedStudentId,
      ...withdrawalData
    });
  };

  const handleReinstate = (studentId) => {
    if (window.confirm('Are you sure you want to reinstate this student?')) {
      reinstateMutation.mutate({ studentId });
    }
  };

  const tabs = [
    { id: 'withdraw', label: 'Withdraw Student', icon: FaUserGraduate },
    { id: 'withdrawn', label: 'Withdrawn Students', icon: FaHistory },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Student Withdrawal</h1>
          <p className="text-gray-500 mt-1">Manage student withdrawals and reinstatements</p>
        </div>
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
          {/* Withdraw Tab */}
          {activeTab === 'withdraw' && (
            <div className="space-y-6">
              {/* Student Search */}
              <div>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students by name or admission number..."
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
                        {selectedStudentId === student.id && <FaCheck className="text-green-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Withdrawal Form */}
              {selectedStudentId && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Withdrawal Form</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Withdrawal Date *
                      </label>
                      <input
                        type="date"
                        value={withdrawalData.withdrawalDate}
                        onChange={(e) => setWithdrawalData({ ...withdrawalData, withdrawalDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Withdrawal Type
                      </label>
                      <select
                        value={withdrawalData.withdrawalType}
                        onChange={(e) => setWithdrawalData({ ...withdrawalData, withdrawalType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                      >
                        <option value="withdrawal">Withdrawal</option>
                        <option value="expelled">Expelled</option>
                        <option value="left">Left School</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason *
                      </label>
                      <textarea
                        value={withdrawalData.reason}
                        onChange={(e) => setWithdrawalData({ ...withdrawalData, reason: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                        placeholder="Enter reason for withdrawal..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        value={withdrawalData.notes}
                        onChange={(e) => setWithdrawalData({ ...withdrawalData, notes: e.target.value })}
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                        placeholder="Any additional notes..."
                      />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-700 flex items-center gap-2">
                        <FaLock className="flex-shrink-0" />
                        This will lock future academic activities for this student. Previous records will be preserved.
                      </p>
                    </div>

                    <button
                      onClick={handleWithdraw}
                      className="w-full px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
                    >
                      <FaExclamationTriangle />
                      Withdraw Student
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Withdrawn Students Tab */}
          {activeTab === 'withdrawn' && (
            <div className="space-y-6">
              {withdrawnStudents.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FaHistory className="text-4xl mx-auto mb-2 text-gray-300" />
                  No withdrawn students found
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Class</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Withdrawal Date</th>
                          <th className="px-4 py-3">Reason</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {withdrawnStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-800">{student.first_name} {student.last_name}</p>
                                <p className="text-xs text-gray-500">{student.admission_number}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">{student.classes?.name || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {student.student_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {student.withdrawal_date ? new Date(student.withdrawal_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{student.withdrawal_reason || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleReinstate(student.id)}
                                disabled={reinstateMutation.isLoading}
                                className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                              >
                                <FaUndo className="text-sm" />
                                Reinstate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Confirm Withdrawal</h3>
              <button onClick={() => setShowReasonModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700">
                <FaExclamationTriangle className="inline mr-1" />
                You are about to withdraw this student. This action will lock their academic activities.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p><strong>Student:</strong> {students.find(s => s.id === selectedStudentId)?.first_name} {students.find(s => s.id === selectedStudentId)?.last_name}</p>
              <p><strong>Date:</strong> {withdrawalData.withdrawalDate}</p>
              <p><strong>Type:</strong> {withdrawalData.withdrawalType}</p>
              <p><strong>Reason:</strong> {withdrawalData.reason}</p>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowReasonModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmWithdraw}
                disabled={withdrawMutation.isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
              >
                {withdrawMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdrawal;