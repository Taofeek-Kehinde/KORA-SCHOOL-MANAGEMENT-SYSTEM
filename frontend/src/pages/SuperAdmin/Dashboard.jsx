import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaBuilding,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaHourglassHalf,
  FaUsers,
  FaChalkboardTeacher,
  FaUserTie,
  FaUserFriends,
  FaMoneyBillWave,
  FaCreditCard,
  FaTicketAlt,
  FaChartLine,
  FaServer,
  FaDatabase,
  FaSms,
  FaEnvelope,
  FaBell,
  FaSchool,
  FaUserGraduate,
  FaCalendarTimes,
  FaCalendarCheck,
  FaSpinner,
  FaExclamationTriangle,
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
  LineChart,
  Line,
} from 'recharts';

// Components
import StatCard from './components/StatCard';
import PendingApprovals from './components/PendingApprovals';
import LatestSchools from './components/LatestSchools';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // =============================================
  // FETCH REAL DATA FROM DATABASE
  // =============================================
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['superAdminDashboard', selectedPeriod],
    queryFn: async () => {
      const response = await api.get('/admin/dashboard');
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Fetch system health
  const { data: healthData } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      const response = await api.get('/system/health');
      return response.data;
    },
    refetchInterval: 60000,
  });

  // Fetch pending registrations
  const { data: pendingData, refetch: refetchPending } = useQuery({
    queryKey: ['pendingRegistrations'],
    queryFn: async () => {
      const response = await api.get('/admin/registrations/pending');
      return response.data;
    },
  });

  // Fetch latest schools
  const { data: latestSchoolsData } = useQuery({
    queryKey: ['latestSchools'],
    queryFn: async () => {
      const response = await api.get('/admin/schools', {
        params: { limit: 10, sort_by: 'created_at', sort_order: 'desc' }
      });
      return response.data;
    },
  });

  // =============================================
  // LOADING STATE
  // =============================================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-kora-primary mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard data...</p>
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
  // EXTRACT REAL DATA
  // =============================================
  const metrics = dashboardData?.data?.metrics || {};
  const pendingSchools = pendingData?.data || [];
  const latestSchools = latestSchoolsData?.data || [];
  const health = healthData?.data || {};

  // Build real class distribution from database
  const classDistribution = [
    { name: 'Active', value: metrics.active_schools || 0 },
    { name: 'Trial', value: metrics.trial_schools || 0 },
    { name: 'Inactive', value: metrics.inactive_schools || 0 },
    { name: 'Pending', value: metrics.schools_awaiting_approval || 0 },
    { name: 'Expired', value: metrics.expired_schools || 0 },
  ].filter(item => item.value > 0);

  // Generate real revenue data from database
  const revenueData = [
    { month: 'Jan', revenue: metrics.revenue_jan || 0, expenses: 0 },
    { month: 'Feb', revenue: metrics.revenue_feb || 0, expenses: 0 },
    { month: 'Mar', revenue: metrics.revenue_mar || 0, expenses: 0 },
    { month: 'Apr', revenue: metrics.revenue_apr || 0, expenses: 0 },
    { month: 'May', revenue: metrics.revenue_may || 0, expenses: 0 },
    { month: 'Jun', revenue: metrics.revenue_jun || 0, expenses: 0 },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Super Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time overview of all schools and platform metrics</p>
        </div>
        <div className="flex items-center gap-3 mt-3 md:mt-0">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <FaChartLine />
            Refresh
          </button>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* School Statistics - REAL DATA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={FaBuilding}
          title="Total Registered Schools"
          value={metrics.total_registered_schools || 0}
          color="blue"
        />
        <StatCard
          icon={FaCheckCircle}
          title="Active Schools"
          value={metrics.active_schools || 0}
          color="green"
          subtitle={`${metrics.inactive_schools || 0} inactive`}
        />
        <StatCard
          icon={FaClock}
          title="Trial Schools"
          value={metrics.trial_schools || 0}
          color="yellow"
        />
        <StatCard
          icon={FaHourglassHalf}
          title="Awaiting Approval"
          value={metrics.schools_awaiting_approval || 0}
          color="orange"
        />
      </div>

      {/* User Statistics - REAL DATA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={FaUserGraduate}
          title="Active Students"
          value={metrics.total_active_students || 0}
          color="purple"
        />
        <StatCard
          icon={FaChalkboardTeacher}
          title="Teachers"
          value={metrics.total_teachers || 0}
          color="indigo"
        />
        <StatCard
          icon={FaUserTie}
          title="Staff"
          value={metrics.total_staff || 0}
          color="pink"
        />
        <StatCard
          icon={FaUserFriends}
          title="Parents"
          value={metrics.total_parents || 0}
          color="teal"
        />
      </div>

      {/* Revenue & Financial - REAL DATA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={FaMoneyBillWave}
          title="Total Revenue"
          value={metrics.total_platform_revenue || 0}
          color="green"
          isCurrency
        />
        <StatCard
          icon={FaChartLine}
          title="Revenue This Month"
          value={metrics.revenue_this_month || 0}
          color="emerald"
          isCurrency
          subtitle={`${metrics.revenue_this_year || 0} this year`}
        />
        <StatCard
          icon={FaCreditCard}
          title="Pending Payments"
          value={metrics.pending_payments || 0}
          color="red"
        />
        <StatCard
          icon={FaTicketAlt}
          title="Support Tickets"
          value={metrics.support_tickets || 0}
          color="yellow"
        />
      </div>

      {/* System Health - DYNAMIC REAL DATA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Server Status */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              health?.server?.status === 'healthy' ? 'bg-green-50 text-green-600' :
              health?.server?.status === 'degraded' ? 'bg-yellow-50 text-yellow-600' :
              'bg-red-50 text-red-600'
            }`}>
              <FaServer className="text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Server Status</p>
              <p className={`text-lg font-semibold ${
                health?.server?.status === 'healthy' ? 'text-green-600' :
                health?.server?.status === 'degraded' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {health?.server?.status || 'Unknown'}
              </p>
              <p className="text-xs text-gray-400">
                Uptime: {Math.floor(health?.server?.uptime / 60 / 60)}h 
                {Math.floor((health?.server?.uptime / 60) % 60)}m
              </p>
            </div>
          </div>
        </div>

        {/* Storage Usage */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FaDatabase className="text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Storage</p>
              <p className="text-lg font-semibold text-gray-800">
                {health?.storage?.used || 0} GB / {health?.storage?.total || 10} GB
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className={`h-1.5 rounded-full ${
                    (health?.storage?.percentage || 0) > 80 ? 'bg-red-500' :
                    (health?.storage?.percentage || 0) > 60 ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(health?.storage?.percentage || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SMS Usage */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <FaSms className="text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">SMS Usage</p>
              <p className="text-lg font-semibold text-gray-800">
                {health?.sms?.used || 0} / {health?.sms?.limit || 10000}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className={`h-1.5 rounded-full ${
                    (health?.sms?.percentage || 0) > 80 ? 'bg-red-500' :
                    (health?.sms?.percentage || 0) > 60 ? 'bg-yellow-500' :
                    'bg-purple-500'
                  }`}
                  style={{ width: `${Math.min(health?.sms?.percentage || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Email Usage */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <FaEnvelope className="text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email Usage</p>
              <p className="text-lg font-semibold text-gray-800">
                {health?.email?.used || 0} / {health?.email?.limit || 5000}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div 
                  className={`h-1.5 rounded-full ${
                    (health?.email?.percentage || 0) > 80 ? 'bg-red-500' :
                    (health?.email?.percentage || 0) > 60 ? 'bg-yellow-500' :
                    'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(health?.email?.percentage || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts - REAL DATA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Overview</h3>
          <div className="h-64">
            {revenueData.some(item => item.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No revenue data available yet
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">School Distribution</h3>
          <div className="h-64">
            {classDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {classDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No school distribution data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Approvals - REAL DATA */}
      <div className="mb-6">
        <PendingApprovals pendingSchools={pendingSchools} onApprove={refetchPending} />
      </div>

      {/* Latest Schools - REAL DATA */}
      <div className="mb-6">
        <LatestSchools schools={latestSchools} />
      </div>
    </div>
  );
};

export default Dashboard;