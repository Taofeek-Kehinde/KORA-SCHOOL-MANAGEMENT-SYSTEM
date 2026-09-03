import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaGraduationCap,
  FaSearch,
  FaCheck,
  FaSpinner,
  FaTimes,
  FaHistory,
  FaDownload,
  FaAward,
  FaUsers,
  FaCalendarAlt,
  FaBuilding,
  FaUserGraduate,
  FaFileAlt,
  FaChevronDown,
  FaChevronUp,
  FaChartBar,
} from 'react-icons/fa';

const Graduation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('graduate');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Graduation form state
  const [graduationData, setGraduationData] = useState({
    graduationDate: '',
    graduationType: 'graduated',
    certificateNumber: '',
    honors: '',
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

  // Fetch graduated students
  const { data: graduatedData, refetch: refetchGraduated } = useQuery({
    queryKey: ['graduatedStudents', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/graduation/schools/${user?.schoolId}/graduated`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch graduation report
  const { data: reportData, refetch: refetchReport } = useQuery({
    queryKey: ['graduationReport', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/graduation/schools/${user?.schoolId}/report`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Graduate student mutation
  const graduateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/graduation/schools/${user?.schoolId}/graduate`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries(['students', user?.schoolId]);
      refetchGraduated();
      refetchReport();
      setSelectedStudentId('');
      setGraduationData({
        graduationDate: '',
        graduationType: 'graduated',
        certificateNumber: '',
        honors: '',
        notes: ''
      });
      setShowConfirmModal(false);
      setActiveTab('alumni');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to graduate student');
    }
  });

  const students = studentsData?.data || [];
  const graduatedStudents = graduatedData?.data || [];
  const report = reportData?.data;

  const handleGraduate = () => {
    if (!selectedStudentId) {
      toast.error('Please select a student');
      return;
    }
    if (!graduationData.graduationDate) {
      toast.error('Please select graduation date');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmGraduate = () => {
    graduateMutation.mutate({
      studentId: selectedStudentId,
      ...graduationData
    });
  };

  const tabs = [
    { id: 'graduate', label: 'Graduate Student', icon: FaGraduationCap },
    { id: 'alumni', label: 'Alumni', icon: FaUsers },
    { id: 'report', label: 'Report', icon: FaChartBar },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Student Graduation</h1>
          <p className="text-gray-500 mt-1">Manage student graduation and alumni</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            type="button"
            onClick={() => refetchReport()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <FaDownload />
            Refresh Report
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
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Graduate Tab */}
          {activeTab === 'graduate' && (
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

              {/* Graduation Form */}
              {selectedStudentId && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Graduation Form</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Graduation Date *
                      </label>
                      <input
                        type="date"
                        value={graduationData.graduationDate}
                        onChange={(e) => setGraduationData({ ...graduationData, graduationDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Graduation Type
                      </label>
                      <select
                        value={graduationData.graduationType}
                        onChange={(e) => setGraduationData({ ...graduationData, graduationType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                      >
                        <option value="graduated">Graduated</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Certificate Number
                      </label>
                      <input
                        type="text"
                        value={graduationData.certificateNumber}
                        onChange={(e) => setGraduationData({ ...graduationData, certificateNumber: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                        placeholder="e.g., CERT-2025-0001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Honors / Awards
                      </label>
                      <input
                        type="text"
                        value={graduationData.honors}
                        onChange={(e) => setGraduationData({ ...graduationData, honors: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                        placeholder="e.g., First Class Honors, Best Student"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes
                      </label>
                      <textarea
                        value={graduationData.notes}
                        onChange={(e) => setGraduationData({ ...graduationData, notes: e.target.value })}
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                        placeholder="Any additional notes..."
                      />
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-700 flex items-center gap-2">
                        <FaGraduationCap className="flex-shrink-0" />
                        Student will be moved to archive and remain searchable in alumni records.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGraduate}
                      className="w-full px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                    >
                      <FaGraduationCap />
                      Graduate Student
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Alumni Tab */}
          {activeTab === 'alumni' && (
            <div className="space-y-6">
              {graduatedStudents.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FaUsers className="text-4xl mx-auto mb-2 text-gray-300" />
                  No graduated students yet
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Class</th>
                          <th className="px-4 py-3">Graduation Date</th>
                          <th className="px-4 py-3">Certificate</th>
                          <th className="px-4 py-3">Honors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {graduatedStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-800">{student.first_name} {student.last_name}</p>
                                <p className="text-xs text-gray-500">{student.admission_number}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">{student.classes?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">
                              {student.graduation_date ? new Date(student.graduation_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">{student.certificate_number || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">{student.honors || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Report Tab */}
          {activeTab === 'report' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-gray-800">{report?.summary?.total_graduated || 0}</p>
                  <p className="text-sm text-gray-500">Total Graduated</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {Object.keys(report?.summary?.total_by_year || {}).length}
                  </p>
                  <p className="text-sm text-gray-500">Years</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {Object.keys(report?.summary?.total_by_class || {}).length}
                  </p>
                  <p className="text-sm text-gray-500">Classes</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{report?.graduation_history?.length || 0}</p>
                  <p className="text-sm text-gray-500">Records</p>
                </div>
              </div>

              {/* By Year */}
              {report?.summary?.total_by_year && Object.keys(report.summary.total_by_year).length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Graduation by Year</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(report.summary.total_by_year).map(([year, count]) => (
                      <div key={year} className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-xl font-bold text-gray-800">{count}</p>
                        <p className="text-sm text-gray-500">{year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* By Class */}
              {report?.summary?.total_by_class && Object.keys(report.summary.total_by_class).length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Graduation by Class</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(report.summary.total_by_class).map(([className, count]) => (
                      <div key={className} className="bg-gray-50 rounded-lg p-4 text-center">
                        <p className="text-xl font-bold text-gray-800">{count}</p>
                        <p className="text-sm text-gray-500">{className}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report?.graduated_students?.length > 0 && (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">Graduated Students</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Class</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Certificate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {report.graduated_students.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              {student.first_name} {student.last_name}
                            </td>
                            <td className="px-4 py-3 text-sm">{student.classes?.name || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm">
                              {student.graduation_date ? new Date(student.graduation_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm">{student.certificate_number || 'N/A'}</td>
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
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Confirm Graduation</h3>
              <button type="button" onClick={() => setShowConfirmModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-700">
                <FaGraduationCap className="inline mr-1" />
                You are about to graduate this student. They will be moved to alumni records.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p><strong>Student:</strong> {students.find(s => s.id === selectedStudentId)?.first_name} {students.find(s => s.id === selectedStudentId)?.last_name}</p>
              <p><strong>Date:</strong> {graduationData.graduationDate}</p>
              <p><strong>Type:</strong> {graduationData.graduationType}</p>
              {graduationData.certificateNumber && <p><strong>Certificate:</strong> {graduationData.certificateNumber}</p>}
              {graduationData.honors && <p><strong>Honors:</strong> {graduationData.honors}</p>}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmGraduate}
                disabled={graduateMutation.isLoading}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
              >
                {graduateMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                Confirm Graduation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Graduation;