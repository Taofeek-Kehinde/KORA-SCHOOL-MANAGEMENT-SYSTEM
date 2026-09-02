import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaArrowRight,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaExchangeAlt,
  FaHome,
  FaBed,
  FaBus,
  FaSchool,
  FaUserGraduate,
  FaHistory,
  FaExternalLinkAlt,
  FaBuilding,
  FaChalkboard,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaMapMarker,
  FaExclamationTriangle,
} from 'react-icons/fa';

const Transfer = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('internal');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Internal Transfer State
  const [internalData, setInternalData] = useState({
    transferType: 'class',
    toClassId: '',
    toHouseId: '',
    toCampusId: '',
    newBoardingStatus: '',
    reason: ''
  });

  // External Transfer State
  const [externalData, setExternalData] = useState({
    transferDate: '',
    receivingSchool: '',
    receivingSchoolAddress: '',
    reason: '',
    transferType: 'transfer'
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

  // Fetch transfer data when student selected
  const { data: transferData, refetch: refetchTransfer } = useQuery({
    queryKey: ['transferData', user?.schoolId, selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return { data: null };
      const response = await api.get(`/transfer/schools/${user?.schoolId}/data`, {
        params: { studentId: selectedStudentId }
      });
      return response.data;
    },
    enabled: !!user?.schoolId && !!selectedStudentId,
  });

  // Fetch transfer history
  const { data: historyData, refetch: refetchHistory } = useQuery({
    queryKey: ['transferHistory', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/transfer/schools/${user?.schoolId}/history`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Internal transfer mutation
  const internalTransferMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/transfer/schools/${user?.schoolId}/internal`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      refetchTransfer();
      refetchHistory();
      setInternalData({
        transferType: 'class',
        toClassId: '',
        toHouseId: '',
        toCampusId: '',
        newBoardingStatus: '',
        reason: ''
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to complete transfer');
    }
  });

  // External transfer mutation
  const externalTransferMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/transfer/schools/${user?.schoolId}/external`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries(['students', user?.schoolId]);
      refetchHistory();
      setExternalData({
        transferDate: '',
        receivingSchool: '',
        receivingSchoolAddress: '',
        reason: '',
        transferType: 'transfer'
      });
      setSelectedStudentId('');
      navigate('/school/students');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to complete transfer');
    }
  });

  const students = studentsData?.data || [];
  const transfer = transferData?.data;
  const history = historyData?.data || [];
  const filteredHistory = history.filter((record) => {
    if (activeTab === 'internal') return record.transfer_type === 'internal';
    if (activeTab === 'external') return record.transfer_type === 'external';
    return true;
  });

  const handleInternalTransfer = () => {
    if (!selectedStudentId) {
      toast.error('Please select a student');
      return;
    }

    const payload = {
      studentId: selectedStudentId,
      transferType: internalData.transferType,
      reason: internalData.reason
    };

    if (internalData.transferType === 'class') {
      if (!internalData.toClassId) {
        toast.error('Please select destination class');
        return;
      }
      payload.toClassId = internalData.toClassId;
      payload.fromClassId = transfer?.student?.class_id;
    }

    if (internalData.transferType === 'house') {
      if (!internalData.toHouseId) {
        toast.error('Please select destination house');
        return;
      }
      payload.toHouseId = internalData.toHouseId;
      payload.fromHouseId = transfer?.student?.house_id;
    }

    if (internalData.transferType === 'status') {
      if (!internalData.newBoardingStatus) {
        toast.error('Please select new status');
        return;
      }
      payload.newBoardingStatus = internalData.newBoardingStatus;
    }

    if (internalData.transferType === 'campus') {
      if (!internalData.toCampusId) {
        toast.error('Please select destination campus');
        return;
      }
      payload.toCampusId = internalData.toCampusId;
      payload.fromCampusId = transfer?.student?.campus_id;
    }

    internalTransferMutation.mutate(payload);
  };

  const handleExternalTransfer = () => {
    if (!selectedStudentId) {
      toast.error('Please select a student');
      return;
    }

    if (!externalData.transferDate) {
      toast.error('Please select transfer date');
      return;
    }

    externalTransferMutation.mutate({
      studentId: selectedStudentId,
      ...externalData
    });
  };

  const tabs = [
    { id: 'internal', label: 'Internal Transfer', icon: FaExchangeAlt },
    { id: 'external', label: 'External Transfer', icon: FaExternalLinkAlt },
    { id: 'history', label: 'History', icon: FaHistory },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Student Transfer</h1>
          <p className="text-gray-500 mt-1">Manage internal and external student transfers</p>
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
          {/* Student Search */}
          <div className="mb-6">
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

          {/* Internal Transfer */}
          {activeTab === 'internal' && transfer && (
            <div className="space-y-6">
              {/* Current Student Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Current Student Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium">{transfer.student.first_name} {transfer.student.last_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Class</p>
                    <p className="font-medium">{transfer.student.classes?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">House</p>
                    <p className="font-medium">{transfer.student.houses?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium capitalize">{transfer.student.boarding_status}</p>
                  </div>
                </div>
              </div>

              {/* Transfer Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setInternalData({ ...internalData, transferType: 'class' })}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      internalData.transferType === 'class'
                        ? 'border-kora-primary bg-kora-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FaChalkboard className="text-kora-primary text-2xl mx-auto mb-2" />
                    <span className="text-sm font-medium">Class</span>
                  </button>
                  <button
                    onClick={() => setInternalData({ ...internalData, transferType: 'house' })}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      internalData.transferType === 'house'
                        ? 'border-kora-primary bg-kora-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FaHome className="text-kora-primary text-2xl mx-auto mb-2" />
                    <span className="text-sm font-medium">House</span>
                  </button>
                  <button
                    onClick={() => setInternalData({ ...internalData, transferType: 'status' })}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      internalData.transferType === 'status'
                        ? 'border-kora-primary bg-kora-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FaBed className="text-kora-primary text-2xl mx-auto mb-2" />
                    <span className="text-sm font-medium">Status</span>
                  </button>
                  <button
                    onClick={() => setInternalData({ ...internalData, transferType: 'campus' })}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      internalData.transferType === 'campus'
                        ? 'border-kora-primary bg-kora-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <FaBuilding className="text-kora-primary text-2xl mx-auto mb-2" />
                    <span className="text-sm font-medium">Campus</span>
                  </button>
                </div>
              </div>

              {/* Transfer Details */}
              {internalData.transferType === 'class' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination Class
                  </label>
                  <select
                    value={internalData.toClassId}
                    onChange={(e) => setInternalData({ ...internalData, toClassId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="">Select Class</option>
                    {transfer.classes?.filter(c => c.id !== transfer.student.class_id).map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {internalData.transferType === 'house' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination House
                  </label>
                  <select
                    value={internalData.toHouseId}
                    onChange={(e) => setInternalData({ ...internalData, toHouseId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="">Select House</option>
                    {transfer.houses?.filter(h => h.id !== transfer.student.house_id).map(house => (
                      <option key={house.id} value={house.id}>{house.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {internalData.transferType === 'status' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Boarding Status
                  </label>
                  <select
                    value={internalData.newBoardingStatus}
                    onChange={(e) => setInternalData({ ...internalData, newBoardingStatus: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="">Select Status</option>
                    <option value="day">Day Student</option>
                    <option value="boarding">Boarding Student</option>
                  </select>
                </div>
              )}

              {internalData.transferType === 'campus' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination Campus
                  </label>
                  <select
                    value={internalData.toCampusId}
                    onChange={(e) => setInternalData({ ...internalData, toCampusId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="">Select Campus</option>
                    {transfer.campuses?.filter(c => c.id !== transfer.student.campus_id).map(campus => (
                      <option key={campus.id} value={campus.id}>{campus.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={internalData.reason}
                  onChange={(e) => setInternalData({ ...internalData, reason: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="Enter reason for transfer..."
                />
              </div>

              <button
                onClick={handleInternalTransfer}
                disabled={internalTransferMutation.isLoading}
                className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
              >
                {internalTransferMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaExchangeAlt />}
                Complete Internal Transfer
              </button>
            </div>
          )}

          {/* External Transfer */}
          {activeTab === 'external' && transfer && (
            <div className="space-y-6">
              {/* Current Student Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Student Details</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-kora-primary/10 flex items-center justify-center text-kora-primary font-bold">
                    {transfer.student.first_name?.charAt(0)}{transfer.student.last_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {transfer.student.first_name} {transfer.student.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{transfer.student.admission_number} • {transfer.student.classes?.name}</p>
                  </div>
                </div>
              </div>

              {/* Transfer Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Type</label>
                <select
                  value={externalData.transferType}
                  onChange={(e) => setExternalData({ ...externalData, transferType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                >
                  <option value="transfer">Transfer to Another School</option>
                  <option value="graduated">Graduated</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>

              {/* Transfer Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Date</label>
                <input
                  type="date"
                  value={externalData.transferDate}
                  onChange={(e) => setExternalData({ ...externalData, transferDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                />
              </div>

              {/* Receiving School */}
              {externalData.transferType === 'transfer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Receiving School (Optional)
                    </label>
                    <input
                      type="text"
                      value={externalData.receivingSchool}
                      onChange={(e) => setExternalData({ ...externalData, receivingSchool: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                      placeholder="Name of receiving school"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Receiving School Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={externalData.receivingSchoolAddress}
                      onChange={(e) => setExternalData({ ...externalData, receivingSchoolAddress: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                      placeholder="Address of receiving school"
                    />
                  </div>
                </>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={externalData.reason}
                  onChange={(e) => setExternalData({ ...externalData, reason: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="Enter reason for transfer..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-700">
                  <FaExclamationTriangle className="inline mr-1" />
                  This will mark the student as inactive but preserve all historical records.
                </p>
              </div>

              <button
                onClick={handleExternalTransfer}
                disabled={externalTransferMutation.isLoading}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
              >
                {externalTransferMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaExternalLinkAlt />}
                Complete External Transfer
              </button>
            </div>
          )}

          {/* History */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FaHistory className="text-4xl mx-auto mb-2 text-gray-300" />
                  No {activeTab === 'internal' ? 'internal' : activeTab === 'external' ? 'external' : ''} transfer history found
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Details</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredHistory.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              {record.students?.first_name} {record.students?.last_name}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                record.transfer_type === 'internal' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {record.transfer_type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {record.details || record.reason || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {new Date(record.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {record.users?.full_name || 'System'}
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
    </div>
  );
};

export default Transfer;