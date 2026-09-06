import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaClock, FaCalendarAlt } from 'react-icons/fa';
import StatCard from '../../components/StatCard';

const AttendancePage = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['studentAttendance', user?.studentId],
    queryFn: async () => {
      const response = await api.get(`/student-dashboard/students/${user?.studentId}/dashboard`);
      return response.data;
    },
    enabled: !!user?.studentId,
  });

  const attendance = data?.data?.attendanceSummary || {};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-kora-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Attendance</h1>
        <p className="text-gray-500 mt-1">Your attendance records</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard icon={FaCalendarAlt} title="Total Days" value={attendance.totalDays || 0} color="blue" />
        <StatCard icon={FaCheckCircle} title="Present" value={attendance.present || 0} color="green" />
        <StatCard icon={FaTimesCircle} title="Absent" value={attendance.absent || 0} color="red" />
        <StatCard icon={FaClock} title="Late" value={attendance.late || 0} color="yellow" />
        <StatCard icon={FaCalendarAlt} title="Rate" value={`${attendance.attendanceRate || 0}%`} color="emerald" />
      </div>

      {/* Recent Records */}
      {attendance.recentAttendance?.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Records</h3>
          <div className="space-y-2">
            {attendance.recentAttendance.map((record, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-600">{new Date(record.date).toLocaleDateString()}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  record.status === 'present' ? 'bg-green-100 text-green-800' :
                  record.status === 'absent' ? 'bg-red-100 text-red-800' :
                  record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;