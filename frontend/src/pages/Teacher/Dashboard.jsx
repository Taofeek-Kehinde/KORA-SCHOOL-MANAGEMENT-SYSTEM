import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import {
  FaChalkboard,
  FaUsers,
  FaCalendarAlt,
  FaBookOpen,
  FaSpinner,
} from 'react-icons/fa';
import StatCard from '../../components/StatCard';

const TeacherDashboard = () => {
  const { user } = useAuth();

  // ✅ Use teacherId from user object (or user.id as fallback)
  const teacherId = user?.teacherId || user?.id;

  // ✅ Fetch assigned classes from teacher-specific route
  const { data: classesData, isLoading, error } = useQuery({
    queryKey: ['teacherClasses', teacherId],
    queryFn: async () => {
      if (!teacherId) return { data: [] };
      const response = await api.get(`/teachers/teachers/${teacherId}/classes`);
      return response.data;
    },
    enabled: !!teacherId,
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
          <h3 className="text-xl font-semibold text-gray-700">Failed to Load Dashboard</h3>
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  const assignedClasses = classesData?.data || [];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {user?.fullName || 'Teacher'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={FaChalkboard}
          title="Assigned Classes"
          value={assignedClasses.length}
          color="blue"
        />
        <StatCard
          icon={FaUsers}
          title="Students"
          value={assignedClasses.reduce((sum, c) => sum + (c.students_count || 0), 0)}
          color="green"
        />
        <StatCard
          icon={FaCalendarAlt}
          title="Attendance"
          value="Ready"
          color="yellow"
        />
      </div>

      {/* Assigned Classes */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Assigned Classes</h3>
          <span className="text-sm text-gray-400">Current term</span>
        </div>

        {assignedClasses.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FaBookOpen className="text-4xl mx-auto mb-2 text-gray-300" />
            No classes assigned yet
          </div>
        ) : (
          <div className="space-y-3">
            {assignedClasses.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-kora-primary/10 flex items-center justify-center">
                      <FaChalkboard className="text-kora-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {item.classes?.name} - {item.subjects?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.classes?.level} • {item.subjects?.code}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;