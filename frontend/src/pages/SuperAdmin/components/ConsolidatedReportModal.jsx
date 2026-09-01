import React from 'react';
import { FaTimes, FaSpinner, FaDownload, FaBuilding, FaUsers, FaChalkboardTeacher, FaUserTie, FaMoneyBillWave, FaChartBar, FaFileInvoice } from 'react-icons/fa';

const ConsolidatedReportModal = ({ report, onClose, isLoading }) => {
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-xl max-w-4xl w-full p-8 text-center">
          <FaSpinner className="animate-spin text-4xl text-kora-primary mx-auto" />
          <p className="text-gray-500 mt-4">Loading consolidated report...</p>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    const headers = ['Campus', 'Students', 'Teachers', 'Staff', 'Classes', 'Attendance', 'Revenue', 'Fees Collected'];
    const rows = report?.campuses.map(c => [
      c.name,
      c.stats.students,
      c.stats.teachers,
      c.stats.staff,
      c.stats.classes,
      c.stats.attendance,
      c.stats.revenue,
      c.stats.fees_collected
    ]) || [];

    const totals = [
      'TOTAL',
      report?.totals?.students || 0,
      report?.totals?.teachers || 0,
      report?.totals?.staff || 0,
      report?.totals?.classes || 0,
      report?.totals?.attendance || 0,
      report?.totals?.revenue || 0,
      report?.totals?.fees_collected || 0
    ];

    const csv = [headers, ...rows, totals].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consolidated-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Consolidated Report</h3>
            <p className="text-sm text-gray-500">All Campuses • Generated: {new Date().toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <FaDownload />
              Export CSV
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <FaBuilding className="text-blue-500 text-2xl mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-800">{report?.campuses?.length || 0}</p>
              <p className="text-xs text-gray-500">Total Campuses</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <FaUsers className="text-green-500 text-2xl mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-800">{report?.totals?.students || 0}</p>
              <p className="text-xs text-gray-500">Total Students</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <FaChalkboardTeacher className="text-purple-500 text-2xl mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-800">{report?.totals?.teachers || 0}</p>
              <p className="text-xs text-gray-500">Total Teachers</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <FaMoneyBillWave className="text-yellow-500 text-2xl mx-auto mb-1" />
              <p className="text-2xl font-bold text-gray-800">₦{report?.totals?.revenue?.toLocaleString() || 0}</p>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          </div>

          {/* Campuses Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Campus</th>
                  <th className="px-4 py-3 text-center">Students</th>
                  <th className="px-4 py-3 text-center">Teachers</th>
                  <th className="px-4 py-3 text-center">Staff</th>
                  <th className="px-4 py-3 text-center">Classes</th>
                  <th className="px-4 py-3 text-center">Attendance</th>
                  <th className="px-4 py-3 text-center">Revenue</th>
                  <th className="px-4 py-3 text-center">Fees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report?.campuses.map((campus, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{campus.name}</td>
                    <td className="px-4 py-3 text-center">{campus.stats.students}</td>
                    <td className="px-4 py-3 text-center">{campus.stats.teachers}</td>
                    <td className="px-4 py-3 text-center">{campus.stats.staff}</td>
                    <td className="px-4 py-3 text-center">{campus.stats.classes}</td>
                    <td className="px-4 py-3 text-center">{campus.stats.attendance}</td>
                    <td className="px-4 py-3 text-center">₦{campus.stats.revenue?.toLocaleString() || 0}</td>
                    <td className="px-4 py-3 text-center">₦{campus.stats.fees_collected?.toLocaleString() || 0}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td className="px-4 py-3 font-bold">TOTAL</td>
                  <td className="px-4 py-3 text-center font-bold">{report?.totals?.students || 0}</td>
                  <td className="px-4 py-3 text-center font-bold">{report?.totals?.teachers || 0}</td>
                  <td className="px-4 py-3 text-center font-bold">{report?.totals?.staff || 0}</td>
                  <td className="px-4 py-3 text-center font-bold">{report?.totals?.classes || 0}</td>
                  <td className="px-4 py-3 text-center font-bold">{report?.totals?.attendance || 0}</td>
                  <td className="px-4 py-3 text-center font-bold">₦{report?.totals?.revenue?.toLocaleString() || 0}</td>
                  <td className="px-4 py-3 text-center font-bold">₦{report?.totals?.fees_collected?.toLocaleString() || 0}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedReportModal;