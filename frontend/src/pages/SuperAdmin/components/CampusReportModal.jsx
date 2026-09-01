import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaTimes, FaSpinner, FaDownload, FaUsers, FaChalkboardTeacher, FaUserTie, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';
import api from '../../../utils/api';

const CampusReportModal = ({ campus, schoolId, onClose }) => {
  const [loading, setLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['campusReport', schoolId, campus.id],
    queryFn: async () => {
      const response = await api.get(`/campuses/schools/${schoolId}/campuses/${campus.id}/report`);
      return response.data;
    },
    enabled: !!schoolId && !!campus.id,
  });

  const report = data?.data;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-xl max-w-4xl w-full p-8 text-center">
          <FaSpinner className="animate-spin text-4xl text-kora-primary mx-auto" />
          <p className="text-gray-500 mt-4">Loading campus report...</p>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    // Export as CSV
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Campus Name', campus.name],
      ['Total Students', report?.stats?.total_students || 0],
      ['Total Teachers', report?.stats?.total_teachers || 0],
      ['Total Staff', report?.stats?.total_staff || 0],
      ['Total Classes', report?.stats?.total_classes || 0],
      ['Total Attendance (Last 30 days)', report?.stats?.total_attendance || 0],
      ['Total Invoices', report?.stats?.total_invoices || 0],
      ['Total Fees', report?.stats?.total_fees || 0],
    ];

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${campus.name}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{campus.name} - Report</h3>
            <p className="text-sm text-gray-500">Generated: {new Date().toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <FaDownload />
              Export
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <FaUsers className="text-blue-500 text-2xl mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-800">{report?.stats?.total_students || 0}</p>
              <p className="text-xs text-gray-500">Students</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <FaChalkboardTeacher className="text-green-500 text-2xl mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-800">{report?.stats?.total_teachers || 0}</p>
              <p className="text-xs text-gray-500">Teachers</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <FaUserTie className="text-purple-500 text-2xl mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-800">{report?.stats?.total_staff || 0}</p>
              <p className="text-xs text-gray-500">Staff</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <FaBuilding className="text-yellow-500 text-2xl mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-800">{report?.stats?.total_classes || 0}</p>
              <p className="text-xs text-gray-500">Classes</p>
            </div>
          </div>

          {/* Detailed Tables */}
          {report?.students && report.students.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Students</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Admission</th>
                      <th className="px-3 py-2 text-left">Class</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.students.slice(0, 10).map((student, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="px-3 py-2">{student.first_name} {student.last_name}</td>
                        <td className="px-3 py-2">{student.admission_number}</td>
                        <td className="px-3 py-2">{student.class_id}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${student.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {student.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {report.students.length > 10 && (
                  <p className="text-xs text-gray-400 mt-1">Showing 10 of {report.students.length} students</p>
                )}
              </div>
            </div>
          )}

          {/* Attendance Summary */}
          {report?.attendance && report.attendance.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Recent Attendance</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Students</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.attendance.slice(0, 10).map((att, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        <td className="px-3 py-2">{new Date(att.date).toLocaleDateString()}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            att.status === 'present' ? 'bg-green-100 text-green-800' :
                            att.status === 'absent' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {att.status}
                          </span>
                        </td>
                        <td className="px-3 py-2">{att.student_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampusReportModal;