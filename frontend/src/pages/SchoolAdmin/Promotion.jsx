import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaArrowRight,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaUsers,
  FaClipboardList,
  FaHistory,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaUserGraduate,
  FaChalkboard,
  FaRedo,
  FaClock,
  FaDownload,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';

const Promotion = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fromClassId, setFromClassId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('promote');
  const [promotionType, setPromotionType] = useState('all');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reason, setReason] = useState('');
  const [isRefreshingReport, setIsRefreshingReport] = useState(false);

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/classes`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch promotion data
  const { data: promotionData, refetch: refetchPromotion } = useQuery({
    queryKey: ['promotionData', user?.schoolId, fromClassId],
    queryFn: async () => {
      if (!fromClassId) return { data: null };
      const response = await api.get(`/promotion/schools/${user?.schoolId}/data`, {
        params: { classId: fromClassId }
      });
      return response.data;
    },
    enabled: !!user?.schoolId && !!fromClassId,
  });

  // Fetch pending promotions
  const { data: pendingData, refetch: refetchPending } = useQuery({
    queryKey: ['pendingPromotions', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/promotion/schools/${user?.schoolId}/pending`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch promotion report
  const { data: reportData, refetch: refetchReport } = useQuery({
    queryKey: ['promotionReport', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/promotion/schools/${user?.schoolId}/report`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Promote students mutation
  const promoteMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/promotion/schools/${user?.schoolId}/promote`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries(['promotionData', user?.schoolId, fromClassId]);
      refetchPromotion();
      setSelectedStudents([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to promote students');
    }
  });

  // Hold promotion mutation
  const holdMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/promotion/schools/${user?.schoolId}/hold`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      refetchPending();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to hold promotion');
    }
  });

  // Approve promotion mutation
  const approveMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/promotion/schools/${user?.schoolId}/approve`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries(['pendingPromotions', user?.schoolId]);
      refetchPending();
      refetchReport();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to approve promotion');
    }
  });

  const classes = classesData?.data || [];
  const promotion = promotionData?.data;
  const pendingPromotions = pendingData?.data || [];
  const report = reportData?.data;

  const handleSelectAll = () => {
    if (promotion?.students?.length > 0) {
      const allIds = promotion.students.map(s => s.id);
      const selectedAll = allIds.every(id => selectedStudents.includes(id));
      
      if (selectedAll) {
        setSelectedStudents([]);
      } else {
        setSelectedStudents(allIds);
      }
    }
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handlePromote = () => {
    if (!fromClassId || !toClassId) {
      toast.error('Please select both classes');
      return;
    }

    const studentsToPromote = promotion?.students
      ?.filter(s => promotionType === 'all' || selectedStudents.includes(s.id))
      .map(s => ({
        studentId: s.id,
        action: 'promote',
        reason: 'Promoted to next class'
      })) || [];

    if (studentsToPromote.length === 0) {
      toast.error('No students selected');
      return;
    }

    promoteMutation.mutate({
      fromClassId,
      toClassId,
      students: studentsToPromote
    });
  };

  const handleRepeat = () => {
    const studentsToRepeat = promotion?.students
      ?.filter(s => promotionType === 'all' || selectedStudents.includes(s.id))
      .map(s => ({
        studentId: s.id,
        action: 'repeat',
        reason: 'Repeating class'
      })) || [];

    if (studentsToRepeat.length === 0) {
      toast.error('No students selected');
      return;
    }

    promoteMutation.mutate({
      fromClassId,
      toClassId,
      students: studentsToRepeat
    });
  };

  const handleHold = () => {
    const studentsToHold = promotion?.students
      ?.filter(s => promotionType === 'all' || selectedStudents.includes(s.id))
      .map(s => ({
        studentId: s.id,
        reason: 'Held pending approval'
      })) || [];

    if (studentsToHold.length === 0) {
      toast.error('No students selected');
      return;
    }

    holdMutation.mutate({
      fromClassId,
      toClassId,
      students: studentsToHold
    });
  };

  const handleApprove = (promotionId, approve) => {
    approveMutation.mutate({
      promotionId,
      approve,
      reason: approve ? '' : 'Student not ready for promotion'
    });
  };

  const handleRefreshReport = async () => {
    if (!user?.schoolId) return;

    setIsRefreshingReport(true);

    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['promotionReport', user.schoolId] }),
        queryClient.invalidateQueries({ queryKey: ['pendingPromotions', user.schoolId] }),
        refetchReport(),
        refetchPending(),
      ]);

      toast.success('Promotion report refreshed');
    } catch (error) {
      toast.error('Failed to refresh promotion report');
    } finally {
      setIsRefreshingReport(false);
    }
  };

  const tabs = [
    { id: 'promote', label: 'Promote Students', icon: FaArrowRight },
    { id: 'pending', label: 'Pending Approvals', icon: FaClock },
    { id: 'report', label: 'Report', icon: FaClipboardList },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Student Promotion</h1>
          <p className="text-gray-500 mt-1">Manage academic progression for students</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            onClick={handleRefreshReport}
            disabled={isRefreshingReport}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-70 flex items-center gap-2"
          >
            {isRefreshingReport ? <FaSpinner className="animate-spin" /> : <FaDownload />}
            {isRefreshingReport ? 'Refreshing...' : 'Refresh Report'}
          </button>
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
                  {tab.id === 'pending' && pendingPromotions.length > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {pendingPromotions.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Promote Tab */}
          {activeTab === 'promote' && (
            <div className="space-y-6">
              {/* Class Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Class
                  </label>
                  <select
                    value={fromClassId}
                    onChange={(e) => {
                      setFromClassId(e.target.value);
                      setSelectedStudents([]);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Class
                  </label>
                  <select
                    value={toClassId}
                    onChange={(e) => setToClassId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Promotion Type */}
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={promotionType === 'all'}
                    onChange={() => setPromotionType('all')}
                    className="w-4 h-4 text-kora-primary"
                  />
                  <span className="text-sm">Promote All</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={promotionType === 'selected'}
                    onChange={() => setPromotionType('selected')}
                    className="w-4 h-4 text-kora-primary"
                  />
                  <span className="text-sm">Promote Selected</span>
                </label>
              </div>

              {/* Students List */}
              {promotion && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">
                      Students in {promotion.current_class?.name} ({promotion.students?.length})
                    </h3>
                    {promotionType === 'selected' && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={promotion.students?.length > 0 && promotion.students.every(s => selectedStudents.includes(s.id))}
                          className="w-4 h-4 text-kora-primary"
                        />
                        <span className="text-sm">Select All</span>
                      </label>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Admission</th>
                          <th className="px-4 py-3">Average</th>
                          <th className="px-4 py-3">Status</th>
                          {promotionType === 'selected' && (
                            <th className="px-4 py-3">Select</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {promotion.students.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-800">
                                  {student.first_name} {student.last_name}
                                </p>
                                <p className="text-xs text-gray-500">{student.gender}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">{student.admission_number}</td>
                            <td className="px-4 py-3">
                              <span className={`text-sm font-bold ${
                                student.average_score >= 70 ? 'text-green-600' :
                                student.average_score >= 50 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {student.average_score}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {student.student_status}
                              </span>
                            </td>
                            {promotionType === 'selected' && (
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedStudents.includes(student.id)}
                                  onChange={() => handleStudentToggle(student.id)}
                                  className="w-4 h-4 text-kora-primary"
                                />
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              {promotion && promotion.students?.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handlePromote}
                    disabled={promoteMutation.isLoading}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    {promoteMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaArrowRight />}
                    Promote Students
                  </button>
                  <button
                    onClick={handleRepeat}
                    disabled={promoteMutation.isLoading}
                    className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    <FaRedo />
                    Repeat Students
                  </button>
                  <button
                    onClick={handleHold}
                    disabled={holdMutation.isLoading}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    <FaClock />
                    Hold Pending
                  </button>
                </div>
              )}

              {/* Next Class Info */}
              {promotion?.next_class && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    Next class: <strong>{promotion.next_class.name}</strong> ({promotion.next_class.level})
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    Students will be promoted from {promotion.current_class.name} to {promotion.next_class.name}
                  </p>
                </div>
              )}

              {!promotion?.next_class && promotion && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-700">
                    This is the highest class. No promotion available.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pending Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-6">
              {pendingPromotions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FaClock className="text-4xl mx-auto mb-2 text-gray-300" />
                  No pending promotions
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPromotions.map((promo) => (
                    <div key={promo.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium text-gray-800">
                            {promo.students?.first_name} {promo.students?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {promo.students?.classes?.name} → {promo.to_class?.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Requested by {promo.users?.full_name} on {new Date(promo.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 mt-3 md:mt-0">
                          <button
                            onClick={() => handleApprove(promo.id, true)}
                            disabled={approveMutation.isLoading}
                            className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1"
                          >
                            <FaCheck className="text-sm" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleApprove(promo.id, false)}
                            disabled={approveMutation.isLoading}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-1"
                          >
                            <FaTimes className="text-sm" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Report Tab */}
          {activeTab === 'report' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-800">{report?.summary?.total || 0}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{report?.summary?.promoted || 0}</p>
                  <p className="text-sm text-gray-500">Promoted</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{report?.summary?.repeated || 0}</p>
                  <p className="text-sm text-gray-500">Repeated</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">{report?.summary?.pending || 0}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{report?.summary?.rejected || 0}</p>
                  <p className="text-sm text-gray-500">Rejected</p>
                </div>
              </div>

              {/* Promotion History */}
              {report?.promotions?.length > 0 && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">Promotion History</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">From → To</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {report.promotions.map((promo) => (
                          <tr key={promo.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              {promo.students?.first_name} {promo.students?.last_name}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {promo.from_class?.name} → {promo.to_class?.name}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded-full text-xs font-medium capitalize">
                                {promo.promotion_type}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                promo.status === 'approved' ? 'bg-green-100 text-green-800' :
                                promo.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {promo.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">{new Date(promo.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {report?.promotions?.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <FaClipboardList className="text-4xl mx-auto mb-2 text-gray-300" />
                  No promotion history yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Promotion;