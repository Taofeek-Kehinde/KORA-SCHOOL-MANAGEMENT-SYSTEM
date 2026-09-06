import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import {
  FaSpinner, FaCalendarAlt, FaGraduationCap, FaMoneyBillWave,
  FaBook, FaClock, FaExclamationTriangle, FaCheckCircle,
  FaFileAlt, FaChartLine, FaUsers
} from 'react-icons/fa';
import StatCard from '../../components/StatCard';

const Overview = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['studentOverview', user?.studentId],
    queryFn: async () => {
      if (!user?.studentId) return { data: {} };
      const response = await api.get(`/student-dashboard/students/${user?.studentId}/dashboard`);
      return response.data;
    },
    enabled: !!user?.studentId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-kora-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h3 className="text-xl font-semibold text-gray-700">Failed to Load</h3>
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  const dashboard = data?.data || {};
  const student = dashboard.student || {};
  const personalInfo = dashboard.personalInfo || {};
  const attendance = dashboard.attendanceSummary || {};
  const academic = dashboard.academicPerformance || {};
  const fees = dashboard.outstandingFees || {};
  const homework = dashboard.homeworkStatus || {};
  const cbt = dashboard.cbtResults || {};
  const timetable = dashboard.timetable || [];
  const notifications = dashboard.notifications || [];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayTimetable = timetable.find(t => t.day === currentDay) || { periods: [] };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Student Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 border-kora-primary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-kora-primary/10 flex items-center justify-center text-kora-primary text-2xl font-bold">
              {personalInfo.firstName?.charAt(0) || 'S'}
              {personalInfo.lastName?.charAt(0) || ''}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {personalInfo.firstName} {personalInfo.lastName}
              </h2>
              <p className="text-gray-500 text-sm">{personalInfo.admissionNumber}</p>
              <p className="text-xs text-gray-500">
                {personalInfo.class?.name || 'No Class'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{attendance.attendanceRate || 0}%</div>
              <div className="text-xs text-gray-500">Attendance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-kora-primary">{Math.min(academic.averageScore || 0, 100)}%</div>
              <div className="text-xs text-gray-500">Average</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${fees.totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {fees.totalOutstanding > 0 ? formatCurrency(fees.totalOutstanding) : 'Paid'}
              </div>
              <div className="text-xs text-gray-500">Fees</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FaCalendarAlt} title="Attendance" value={`${attendance.attendanceRate || 0}%`} color="blue" />
        <StatCard icon={FaGraduationCap} title="Average Score" value={`${Math.min(academic.averageScore || 0, 100)}%`} color="green" />
        <StatCard icon={FaMoneyBillWave} title="Outstanding Fees" value={formatCurrency(fees.totalOutstanding)} color="red" />
        <StatCard icon={FaBook} title="Homework Pending" value={homework.pending || 0} color="yellow" />
      </div>

      {/* Today's Timetable */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaClock className="text-kora-primary" />
          Today's Timetable ({currentDay})
        </h3>
        {todayTimetable.periods.length > 0 ? (
          <div className="space-y-2">
            {todayTimetable.periods.map((period, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <div className="w-20 text-xs text-gray-500">
                  {period.startTime} - {period.endTime}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{period.subject}</p>
                  <p className="text-xs text-gray-500">{period.teacher}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400">No classes today</div>
        )}
      </div>

      {/* Subject Performance */}
      {academic.subjects?.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaChartLine className="text-kora-primary" />
            Top Subjects
          </h3>
          <div className="space-y-2">
            {academic.subjects.slice(0, 5).map((subject, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <span className="font-medium text-gray-800">{subject.subject}</span>
                <span className="font-bold text-kora-primary">{subject.total}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaFileAlt className="text-kora-primary" />
            Recent Notifications
          </h3>
          <div className="space-y-3">
            {notifications.slice(0, 5).map((notif) => (
              <div key={notif.id} className="border border-gray-100 rounded-lg p-3">
                <p className="font-medium text-gray-800 text-sm">{notif.title}</p>
                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;