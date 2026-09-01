import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaTimes, FaFilter, FaDownload, FaClock, FaSearch } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import api from '../../../utils/axios';

const ActivityLogsModal = ({ school, onClose }) => {
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['schoolLogs', school?.id, filterAction, filterEntity],
    queryFn: async () => {
      const response = await api.get(`/admin/schools/${school.id}/logs`, {
        params: {
          action: filterAction || undefined,
          entity_type: filterEntity || undefined,
          limit: 100
        }
      });
      return response.data;
    },
    enabled: !!school?.id,
  });

  const logs = data?.data || [];

  const getActionBadge = (action) => {
    const colors = {
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800',
      'APPROVE': 'bg-emerald-100 text-emerald-800',
      'REJECT': 'bg-red-100 text-red-800',
      'SUSPEND': 'bg-yellow-100 text-yellow-800',
      'ACTIVATE': 'bg-green-100 text-green-800',
      'LOGIN': 'bg-gray-100 text-gray-800',
      'LOGOUT': 'bg-gray-100 text-gray-800',
      'PAYMENT': 'bg-indigo-100 text-indigo-800',
      'RESET_PASSWORD': 'bg-orange-100 text-orange-800',
      'ASSIGN_MANAGER': 'bg-purple-100 text-purple-800',
      'TRANSFER': 'bg-cyan-100 text-cyan-800',
      'UPDATE_SUBSCRIPTION': 'bg-pink-100 text-pink-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Activity Logs</h3>
            <p className="text-sm text-gray-500">{school?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaTimes />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="APPROVE">Approve</option>
              <option value="REJECT">Reject</option>
              <option value="SUSPEND">Suspend</option>
              <option value="ACTIVATE">Activate</option>
              <option value="PAYMENT">Payment</option>
              <option value="RESET_PASSWORD">Reset Password</option>
              <option value="ASSIGN_MANAGER">Assign Manager</option>
              <option value="TRANSFER">Transfer</option>
              <option value="UPDATE_SUBSCRIPTION">Update Subscription</option>
            </select>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            >
              <option value="">All Entities</option>
              <option value="school">School</option>
              <option value="user">User</option>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="invoice">Invoice</option>
              <option value="subscription_plan">Subscription Plan</option>
              <option value="attendance">Attendance</option>
              <option value="grade">Grade</option>
            </select>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kora-primary mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading logs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Failed to load logs
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaClock className="text-4xl mx-auto mb-2 text-gray-300" />
              No activity logs found
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const actionColor = getActionBadge(log.action);
                const filtered = searchTerm ? 
                  log.action.includes(searchTerm) || 
                  log.entity_type.includes(searchTerm) ||
                  log.users?.full_name?.includes(searchTerm) ||
                  log.users?.email?.includes(searchTerm) : true;

                if (!filtered) return null;

                return (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${actionColor}`}>
                            {log.action}
                          </span>
                          <span className="text-sm text-gray-600">
                            {log.users?.full_name || 'System'}
                          </span>
                          <span className="text-sm text-gray-400">on</span>
                          <span className="text-sm text-gray-600">{log.entity_type}</span>
                          {log.entity_id && (
                            <span className="text-xs text-gray-400">#{log.entity_id.slice(0, 8)}</span>
                          )}
                        </div>
                        {log.new_values && Object.keys(log.new_values).length > 0 && (
                          <div className="mt-2 bg-gray-50 rounded-lg p-2 text-xs text-gray-600 overflow-x-auto">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(log.new_values, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.old_values && Object.keys(log.old_values).length > 0 && (
                          <div className="mt-1 bg-red-50 rounded-lg p-2 text-xs text-gray-600 overflow-x-auto">
                            <span className="text-red-500 font-medium">Changed from:</span>
                            <pre className="whitespace-pre-wrap mt-1">
                              {JSON.stringify(log.old_values, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-400 mt-2 md:mt-0">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        {log.ip_address && (
                          <div className="text-gray-400">IP: {log.ip_address}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Total logs: {logs.length}
          </span>
          <button
            onClick={() => {
              // Export logs as CSV
              const headers = ['Action', 'Entity', 'User', 'Created At', 'IP Address'];
              const rows = logs.map(log => [
                log.action,
                log.entity_type,
                log.users?.full_name || 'System',
                new Date(log.created_at).toLocaleString(),
                log.ip_address || ''
              ]);
              const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `logs-${school.name}-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <FaDownload />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogsModal;