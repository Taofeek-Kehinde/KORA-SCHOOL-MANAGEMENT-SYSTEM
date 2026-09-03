import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaUsers,
  FaChalkboardTeacher,
  FaUserTie,
  FaUserFriends,
  FaSchool,
  FaBook,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCreditCard,
  FaChartLine,
  FaClock,
  FaSpinner,
  FaBuilding,
  FaUserGraduate,
  FaUser,
  FaChartBar,
  FaExclamationTriangle,
  FaCheckCircle,
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Components
import StatCard from '../../components/StatCard';
import ActivityFeed from '../../components/ActivityFeed';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const SchoolDashboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('month');

  // =============================================
  // FETCH SCHOOL DASHBOARD DATA
  // =============================================
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['schoolDashboard', user?.schoolId, period],
    queryFn: async () => {
      if (!user?.schoolId) return { data: {} };
      const response = await api.get(`/dashboard/schools/${user?.schoolId}/dashboard`, {
        params: { period }
      });
      return response.data;
    },
    enabled: !!user?.schoolId && !!localStorage.getItem('token') && ['school_admin', 'super_admin'].includes(user?.role),
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // =============================================
  // LOADING STATE
  // =============================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-kora-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // =============================================
  // ERROR STATE
  // =============================================
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Failed to Load Dashboard</h3>
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // =============================================
  // EXTRACT DATA
  // =============================================
  const dashboard = data?.data || {};
  const school = dashboard.school || {};
  const stats = dashboard.stats || {};
  const charts = dashboard.charts || {};
  const recentActivities = dashboard.recent_activities || [];

  // Class distribution for chart
  const classDistribution = charts.class_distribution || [];

  // Gender distribution
  const genderDistribution = charts.gender_distribution || { male: 0, female: 0, other: 0 };
  const genderData = [
    { name: 'Male', value: genderDistribution.male || 0 },
    { name: 'Female', value: genderDistribution.female || 0 },
    { name: 'Other', value: genderDistribution.other || 0 },
  ].filter(item => item.value > 0);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* School Profile Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4" style={{ borderLeftColor: school.colours?.primary || '#4F46E5' }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {school.logo_url ? (
              <img src={school.logo_url} alt={school.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-kora-primary/10 flex items-center justify-center text-kora-primary text-2xl font-bold">
                {school.name?.charAt(0) || 'S'}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{school.name || 'School Dashboard'}</h2>
              {school.motto && (
                <p className="text-sm text-gray-500 italic">"{school.motto}"</p>
              )}
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                {school.academic_session && (
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt className="text-xs" />
                    {school.academic_session}
                  </span>
                )}
                {school.current_term && (
                  <span className="flex items-center gap-1">
                    <FaBook className="text-xs" />
                    {school.current_term}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  school.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                  school.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800' :
                  school.subscription_status === 'suspended' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {school.subscription_status || 'Pending'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            {school.colours?.primary && (
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg border border-gray-200" style={{ backgroundColor: school.colours.primary }} />
                <span className="text-xs text-gray-500">Primary</span>
              </div>
            )}
            {school.colours?.secondary && (
              <div className="text-center">
                <div className="w-10 h-10 rounded-lg border border-gray-200" style={{ backgroundColor: school.colours.secondary }} />
                <span className="text-xs text-gray-500">Secondary</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <StatCard
          icon={FaUserGraduate}
          title="Students"
          value={stats.total_students || 0}
          color="blue"
          subtitle={`${stats.today_attendance || 0} present today`}
        />
        <StatCard
          icon={FaChalkboardTeacher}
          title="Teachers"
          value={stats.total_teachers || 0}
          color="green"
        />
        <StatCard
          icon={FaUserTie}
          title="Staff"
          value={stats.total_staff || 0}
          color="purple"
        />
        <StatCard
          icon={FaUserFriends}
          title="Parents"
          value={stats.total_parents || 0}
          color="pink"
        />
        <StatCard
          icon={FaSchool}
          title="Classes"
          value={stats.total_classes || 0}
          color="yellow"
        />
        <StatCard
          icon={FaBook}
          title="Subjects"
          value={stats.total_subjects || 0}
          color="indigo"
        />
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={FaMoneyBillWave}
          title="Total Revenue"
          value={stats.total_revenue || 0}
          color="green"
          isCurrency
        />
        <StatCard
          icon={FaChartLine}
          title="Monthly Revenue"
          value={stats.monthly_revenue || 0}
          color="emerald"
          isCurrency
        />
        <StatCard
          icon={FaCreditCard}
          title="Pending Invoices"
          value={stats.pending_invoices || 0}
          color="red"
        />
        <StatCard
          icon={FaClock}
          title="Today's Attendance"
          value={stats.today_attendance || 0}
          color="blue"
          subtitle={`Out of ${stats.total_students || 0} students`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Class Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaChartBar className="text-kora-primary" />
            Class Distribution
          </h3>
          <div className="h-64">
            {classDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No class data available
              </div>
            )}
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FaUser className="text-kora-primary" />
            Gender Distribution
          </h3>
          <div className="h-64">
            {genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No gender data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaClock className="text-kora-primary" />
          Recent Activities
        </h3>
        {recentActivities.length > 0 ? (
          <ActivityFeed activities={recentActivities} />
        ) : (
          <div className="text-center py-8 text-gray-400">
            <FaClock className="text-4xl mx-auto mb-2 text-gray-300" />
            No recent activities
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolDashboard;