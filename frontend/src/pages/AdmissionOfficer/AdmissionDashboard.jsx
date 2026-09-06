import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import {
  FaUsers, FaClock, FaCheckCircle, FaTimesCircle, FaUserClock,
  FaFileAlt, FaMoneyBillWave, FaSearch, FaSpinner, FaArrowRight, FaExclamationTriangle
} from 'react-icons/fa';
import StatCard from '../../components/StatCard';

const AdmissionDashboard = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admissionStats', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/admissions/schools/${user?.schoolId}/dashboard`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch applications
  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['admissionApps', user?.schoolId, searchTerm, statusFilter],
    queryFn: async () => {
      const response = await api.get(`/admissions/schools/${user?.schoolId}/applications`, {
        params: {
          search: searchTerm || undefined,
          status: statusFilter || undefined,
          limit: 20
        }
      });
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const stats = statsData?.data || {};
  const applications = appsData?.data || [];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const colors = {
      'submitted': 'bg-blue-100 text-blue-800',
      'under_review': 'bg-yellow-100 text-yellow-800',
      'awaiting_documents': 'bg-orange-100 text-orange-800',
      'awaiting_exam': 'bg-purple-100 text-purple-800',
      'awaiting_interview': 'bg-indigo-100 text-indigo-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'enrolled': 'bg-emerald-100 text-emerald-800',
      'waitlist': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const statusLabels = {
    'submitted': 'Submitted',
    'under_review': 'Under Review',
    'awaiting_documents': 'Awaiting Documents',
    'awaiting_exam': 'Awaiting Exam',
    'awaiting_interview': 'Awaiting Interview',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'enrolled': 'Enrolled',
    'waitlist': 'Waitlist'
  };

  if (statsLoading || appsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-kora-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admission Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage all admission applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FaUsers} title="Total Applications" value={stats.total || 0} color="blue" />
        <StatCard icon={FaClock} title="Pending" value={stats.pending || 0} color="yellow" />
        <StatCard icon={FaCheckCircle} title="Approved" value={stats.approved || 0} color="green" />
        <StatCard icon={FaTimesCircle} title="Rejected" value={stats.rejected || 0} color="red" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FaUserClock} title="Awaiting Interview" value={stats.awaiting_interview || 0} color="purple" />
        <StatCard icon={FaFileAlt} title="Awaiting Exam" value={stats.awaiting_exam || 0} color="indigo" />
        <StatCard icon={FaCheckCircle} title="Enrolled" value={stats.enrolled || 0} color="emerald" />
        <StatCard icon={FaMoneyBillWave} title="Fees Paid" value={stats.acceptance_fee_paid || 0} color="teal" />
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="awaiting_documents">Awaiting Documents</option>
            <option value="awaiting_exam">Awaiting Exam</option>
            <option value="awaiting_interview">Awaiting Interview</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="enrolled">Enrolled</option>
            <option value="waitlist">Waitlist</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Application</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No applications found</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{app.application_number}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{app.student_first_name} {app.student_last_name}</p>
                      <p className="text-xs text-gray-500">{app.parent_name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">{app.classes?.name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                        {statusLabels[app.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Link to={`/admissions/review/${app.id}`} className="text-kora-primary hover:underline text-sm">
                        <FaArrowRight className="inline mr-1" /> Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdmissionDashboard;