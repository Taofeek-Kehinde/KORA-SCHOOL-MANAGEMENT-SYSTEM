import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaSearch,
  FaDownload,
  FaClock,
  FaUser,
  FaBuilding,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaUserPlus,
  FaMoneyBillWave,
  FaSpinner,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaTimes,
  FaExclamationTriangle,
  FaKey,
} from 'react-icons/fa';

const AuditLogs = () => {
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({ limit: 20, offset: 0 });
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch audit logs
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auditLogs', filters, pagination],
    queryFn: async () => {
      const params = {
        limit: pagination.limit,
        offset: pagination.offset,
        ...(filters.action && { action: filters.action }),
        ...(filters.entityType && { entityType: filters.entityType }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.search && { search: filters.search })
      };

      const response = await api.get('/audit/logs', { params });
      return response.data;
    },
    refetchInterval: 30000
  });

  // Fetch audit statistics
  const { data: statsData } = useQuery({
    queryKey: ['auditStats'],
    queryFn: async () => {
      const response = await api.get('/audit/logs/statistics');
      return response.data;
    },
    refetchInterval: 60000
  });

  const logs = data?.data || [];
  const total = data?.pagination?.total || 0;
  const stats = statsData?.data || {};

  // Action mapping with icons and colors
  const actionConfig = {
    'TEACHER_EDITED_RESULT': {
      icon: FaEdit,
      color: 'text-blue-600 bg-blue-100',
      label: 'Teacher Edited Result'
    },
    'STUDENT_DELETED': {
      icon: FaTrash,
      color: 'text-red-600 bg-red-100',
      label: 'Student Deleted'
    },
    'PAYMENT_APPROVED': {
      icon: FaCheckCircle,
      color: 'text-green-600 bg-green-100',
      label: 'Payment Approved'
    },
    'ATTENDANCE_MODIFIED': {
      icon: FaClock,
      color: 'text-yellow-600 bg-yellow-100',
      label: 'Attendance Modified'
    },
    'ADMIN_CHANGED_SETTINGS': {
      icon: FaEdit,
      color: 'text-purple-600 bg-purple-100',
      label: 'Admin Changed Settings'
    },
    'LOGIN_FAILED': {
      icon: FaTimesCircle,
      color: 'text-red-600 bg-red-100',
      label: 'Login Failed'
    },
    'PASSWORD_RESET': {
      icon: FaKey,
      color: 'text-orange-600 bg-orange-100',
      label: 'Password Reset'
    },
    'CREATE': {
      icon: FaUserPlus,
      color: 'text-green-600 bg-green-100',
      label: 'Created'
    },
    'UPDATE': {
      icon: FaEdit,
      color: 'text-blue-600 bg-blue-100',
      label: 'Updated'
    },
    'DELETE': {
      icon: FaTrash,
      color: 'text-red-600 bg-red-100',
      label: 'Deleted'
    },
    'APPROVE': {
      icon: FaCheckCircle,
      color: 'text-emerald-600 bg-emerald-100',
      label: 'Approved'
    },
    'REJECT': {
      icon: FaTimesCircle,
      color: 'text-red-600 bg-red-100',
      label: 'Rejected'
    },
    'PAYMENT': {
      icon: FaMoneyBillWave,
      color: 'text-emerald-600 bg-emerald-100',
      label: 'Payment'
    },
    'SUSPEND': {
      icon: FaExclamationTriangle,
      color: 'text-yellow-600 bg-yellow-100',
      label: 'Suspended'
    },
    'ACTIVATE': {
      icon: FaCheckCircle,
      color: 'text-green-600 bg-green-100',
      label: 'Activated'
    }
  };

  const getActionConfig = (action) => {
    return actionConfig[action] || {
      icon: FaEdit,
      color: 'text-gray-600 bg-gray-100',
      label: action || 'Unknown'
    };
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  // =============================================
  // EXPORT - FIXED
  // =============================================
  const handleExport = async () => {
    try {
      toast.loading('Exporting logs...');
      
      const response = await api.get('/audit/logs/export', {
        params: {
          ...(filters.startDate && { startDate: filters.startDate }),
          ...(filters.endDate && { endDate: filters.endDate })
        },
        responseType: 'blob'
      });
      
      toast.dismiss();
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Export completed successfully!');
    } catch (error) {
      toast.dismiss();
      console.error('Export error:', error);
      toast.error('Failed to export logs');
    }
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    setPagination({ limit: 20, offset: 0 });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-3xl text-kora-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Audit Logs</h1>
          <p className="text-gray-500 mt-1">Track all activities across the platform</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <FaSearch />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          >
            <FaDownload />
            Export
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-500">Total Logs</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total_logs || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-500">Last 24 Hours</p>
          <p className="text-2xl font-bold text-gray-800">{stats.last_24_hours || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-500">Unique Users</p>
          <p className="text-2xl font-bold text-gray-800">{stats.unique_users || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-500">Actions</p>
          <p className="text-2xl font-bold text-gray-800">{stats.actions || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              <FaSearch className="inline mr-1" />
              Search
            </label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search logs..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-40 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary text-sm"
            >
              <option value="">All Actions</option>
              <option value="TEACHER_EDITED_RESULT">Teacher Edited Result</option>
              <option value="STUDENT_DELETED">Student Deleted</option>
              <option value="PAYMENT_APPROVED">Payment Approved</option>
              <option value="ATTENDANCE_MODIFIED">Attendance Modified</option>
              <option value="ADMIN_CHANGED_SETTINGS">Admin Changed Settings</option>
              <option value="LOGIN_FAILED">Login Failed</option>
              <option value="PASSWORD_RESET">Password Reset</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="APPROVE">Approve</option>
              <option value="REJECT">Reject</option>
              <option value="SUSPEND">Suspend</option>
              <option value="ACTIVATE">Activate</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Entity</label>
            <select
              name="entityType"
              value={filters.entityType}
              onChange={handleFilterChange}
              className="w-40 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary text-sm"
            >
              <option value="">All Entities</option>
              <option value="school">School</option>
              <option value="user">User</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="grade">Grade</option>
              <option value="attendance">Attendance</option>
              <option value="invoice">Invoice</option>
              <option value="payment">Payment</option>
              <option value="settings">Settings</option>
              <option value="auth">Authentication</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-36 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-36 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary text-sm"
            />
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center gap-1 text-sm"
          >
            <FaTimes className="text-xs" />
            Clear
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3 hidden md:table-cell">Entity</th>
                <th className="px-4 py-3 hidden lg:table-cell">Details</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const config = getActionConfig(log.action);
                  const Icon = config.icon;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <Icon className="text-xs" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{log.users?.full_name || 'System'}</p>
                          <p className="text-xs text-gray-400">{log.users?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div>
                          <p className="text-sm text-gray-700">{log.entity_type}</p>
                          {log.entity_id && (
                            <p className="text-xs text-gray-400">{log.entity_id?.slice(0, 8) || ''}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {log.schools?.name && (
                          <span className="text-sm text-gray-600">{log.schools.name}</span>
                        )}
                        {log.ip_address && (
                          <p className="text-xs text-gray-400">IP: {log.ip_address}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-600">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </div>
                        <div className="text-xs text-gray-400">
                          {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewDetails(log)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > pagination.limit && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, total)} of {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                disabled={pagination.offset === 0}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                disabled={pagination.offset + pagination.limit >= total}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Log Details</h3>
                <p className="text-sm text-gray-500">
                  {format(new Date(selectedLog.created_at), 'MMMM d, yyyy HH:mm:ss')}
                </p>
              </div>
              <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Action</p>
                  <p className="font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entity Type</p>
                  <p className="font-medium">{selectedLog.entity_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Entity ID</p>
                  <p className="font-medium text-xs break-all">{selectedLog.entity_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">User</p>
                  <p className="font-medium">{selectedLog.users?.full_name}</p>
                  <p className="text-xs text-gray-400">{selectedLog.users?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">School</p>
                  <p className="font-medium">{selectedLog.schools?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IP Address</p>
                  <p className="font-medium">{selectedLog.ip_address || 'N/A'}</p>
                </div>
              </div>

              {selectedLog.old_values && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Old Values</p>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-40 border border-gray-200">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">New Values</p>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-auto max-h-40 border border-gray-200">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-200 pt-4">
                <FaClock />
                <span>Created: {format(new Date(selectedLog.created_at), 'MMMM d, yyyy HH:mm:ss')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;