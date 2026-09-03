import React, { useState } from 'react';

const initialAttendance = [
  { id: 1, student: 'Aisha Bello', status: 'Present' },
  { id: 2, student: 'Daniel James', status: 'Absent' },
  { id: 3, student: 'Grace Okafor', status: 'Late' },
  { id: 4, student: 'Michael Stone', status: 'Present' },
];

const TeacherAttendance = () => {
  const [records, setRecords] = useState(initialAttendance);

  const updateStatus = (id, value) => {
    setRecords((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status: value } : row))
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Attendance</h1>
        <p className="text-gray-500 mt-1">Update class attendance for the assigned students.</p>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row.id} className="border-t border-gray-200">
                  <td className="px-4 py-3 text-gray-800">{row.student}</td>
                  <td className="px-4 py-3">
                    <select
                      value={row.status}
                      onChange={(e) => updateStatus(row.id, e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Late">Late</option>
                      <option value="Excused">Excused</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendance;
