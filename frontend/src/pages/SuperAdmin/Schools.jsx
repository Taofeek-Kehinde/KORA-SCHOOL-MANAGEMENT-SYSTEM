import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../utils/axios';
import {
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaBan,
  FaCheck,
  FaKey,
  FaExchangeAlt,
  FaUserPlus,
  FaEye,
  FaFilter,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCreditCard,
  FaClock,
  FaSchool,
} from 'react-icons/fa';

// Components
import SchoolModal from './components/SchoolModal';
import SubscriptionModal from './components/SubscriptionModal';
import TransferModal from './components/TransferModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import AssignManagerModal from './components/AssignManagerModal';
import ActivityLogsModal from './components/ActivityLogsModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const Schools = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Modal states
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [modalData, setModalData] = useState({});

  // Fetch schools
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['schools', searchTerm, filterStatus, filterType, sortBy, sortOrder, currentPage],
    queryFn: async () => {
      const response = await api.get('/admin/schools', {
        params: {
          search: searchTerm || undefined,
          status: filterStatus || undefined,
          school_type: filterType || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          limit: pageSize,
          offset: (currentPage - 1) * pageSize
        }
      });
      return response.data;
    },
    keepPreviousData: true,
  });

  // Fetch subscription plans
  const { data: plansData } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const response = await api.get('/admin/subscription-plans');
      return response.data;
    }
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ schoolId, action, reason }) => {
      const response = await api.put(`/admin/schools/${schoolId}/status`, { action, reason });
      return response.data;
    },
    onSuccess: () => {
      toast.success('School status updated successfully');
      queryClient.invalidateQueries(['schools']);
      queryClient.invalidateQueries(['superAdminDashboard']);
      setShowModal(false);
      setShowConfirm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update school status');
    }
  });

  const deleteSchoolMutation = useMutation({
    mutationFn: async ({ schoolId }) => {
      const response = await api.put(`/admin/schools/${schoolId}/status`, { action: 'delete' });
      return response.data;
    },
    onSuccess: () => {
      toast.success('School deleted successfully');
      queryClient.invalidateQueries(['schools']);
      queryClient.invalidateQueries(['superAdminDashboard']);
      setShowModal(false);
      setShowConfirm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete school');
    }
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: async ({ schoolId, data }) => {
      const response = await api.put(`/admin/schools/${schoolId}/transfer`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Ownership transferred successfully');
      queryClient.invalidateQueries(['schools']);
      setShowModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to transfer ownership');
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ schoolId }) => {
      const response = await api.put(`/admin/schools/${schoolId}/reset-password`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Password reset successfully. New password: ${data.data.new_password}`);
      setShowModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  });

  const assignManagerMutation = useMutation({
    mutationFn: async ({ schoolId, managerId }) => {
      const response = await api.put(`/admin/schools/${schoolId}/assign-manager`, { managerId });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Account manager assigned successfully');
      queryClient.invalidateQueries(['schools']);
      setShowModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign manager');
    }
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ schoolId, data }) => {
      const response = await api.put(`/admin/schools/${schoolId}/subscription`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Subscription updated successfully');
      queryClient.invalidateQueries(['schools']);
      setShowModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update subscription');
    }
  });

  // Handlers
  const handleOpenModal = (type, school) => {
    setSelectedSchool(school);
    setModalType(type);
    setModalData({});
    setShowModal(true);
  };

  const handleConfirmAction = (action, school) => {
    setSelectedSchool(school);
    setConfirmAction(action);
    setShowConfirm(true);
  };

  const handleAction = (action, data = {}) => {
    if (action === 'suspend') {
      updateStatusMutation.mutate({ 
        schoolId: selectedSchool.id, 
        action: 'suspend',
        reason: data.reason || 'Suspended by admin'
      });
    } else if (action === 'activate') {
      updateStatusMutation.mutate({ schoolId: selectedSchool.id, action: 'activate' });
    } else if (action === 'delete') {
      deleteSchoolMutation.mutate({ schoolId: selectedSchool.id });
    } else if (action === 'transfer') {
      transferOwnershipMutation.mutate({ 
        schoolId: selectedSchool.id, 
        data: {
          newOwnerEmail: data.email,
          newOwnerName: data.name,
          newOwnerPhone: data.phone
        }
      });
    } else if (action === 'reset_password') {
      resetPasswordMutation.mutate({ schoolId: selectedSchool.id });
    } else if (action === 'assign_manager') {
      assignManagerMutation.mutate({ 
        schoolId: selectedSchool.id, 
        managerId: data.managerId 
      });
    } else if (action === 'subscription') {
      updateSubscriptionMutation.mutate({ 
        schoolId: selectedSchool.id, 
        data: data 
      });
    }
  };

  // Status badge helper
  const getStatusBadge = (status, isApproved) => {
    if (!isApproved) {
      return { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Approval' };
    }
    switch (status) {
      case 'active':
        return { color: 'bg-green-100 text-green-800', label: 'Active' };
      case 'trial':
        return { color: 'bg-blue-100 text-blue-800', label: 'Trial' };
      case 'suspended':
        return { color: 'bg-red-100 text-red-800', label: 'Suspended' };
      case 'expired':
        return { color: 'bg-gray-100 text-gray-800', label: 'Expired' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status || 'Unknown' };
    }
  };

  // School type badge
  const getTypeBadge = (type) => {
    const types = {
      nursery: 'bg-pink-100 text-pink-800',
      primary: 'bg-blue-100 text-blue-800',
      junior_secondary: 'bg-indigo-100 text-indigo-800',
      senior_secondary: 'bg-purple-100 text-purple-800',
      combined: 'bg-green-100 text-green-800',
      faith_based: 'bg-yellow-100 text-yellow-800',
      international: 'bg-cyan-100 text-cyan-800',
      government: 'bg-gray-100 text-gray-800',
      private: 'bg-emerald-100 text-emerald-800',
    };
    return types[type] || 'bg-gray-100 text-gray-800';
  };

  const schools = data?.data || [];
  const totalSchools = data?.pagination?.total || 0;
  const totalPages = Math.ceil(totalSchools / pageSize);

  // Action buttons configuration
  const actionButtons = [
    { 
      key: 'view', 
      icon: FaEye, 
      label: 'View Details', 
      color: 'blue',
      onClick: (school) => handleOpenModal('view', school)
    },
    { 
      key: 'activate', 
      icon: FaCheck, 
      label: 'Activate', 
      color: 'green',
      condition: (school) => !school.is_active && school.deleted_at === null,
      onClick: (school) => handleConfirmAction('activate', school)
    },
    { 
      key: 'suspend', 
      icon: FaBan, 
      label: 'Suspend', 
      color: 'yellow',
      condition: (school) => school.is_active && school.deleted_at === null,
      onClick: (school) => handleOpenModal('suspend', school)
    },
    { 
      key: 'delete', 
      icon: FaTrash, 
      label: 'Delete', 
      color: 'red',
      condition: (school) => school.deleted_at === null,
      onClick: (school) => handleConfirmAction('delete', school)
    },
    { 
      key: 'transfer', 
      icon: FaExchangeAlt, 
      label: 'Transfer', 
      color: 'purple',
      onClick: (school) => handleOpenModal('transfer', school)
    },
    { 
      key: 'reset_password', 
      icon: FaKey, 
      label: 'Reset Password', 
      color: 'orange',
      onClick: (school) => handleOpenModal('reset_password', school)
    },
    { 
      key: 'assign_manager', 
      icon: FaUserPlus, 
      label: 'Assign Manager', 
      color: 'indigo',
      onClick: (school) => handleOpenModal('assign_manager', school)
    },
    { 
      key: 'subscription', 
      icon: FaCreditCard, 
      label: 'Change Subscription', 
      color: 'emerald',
      onClick: (school) => handleOpenModal('subscription', school)
    },
    { 
      key: 'logs', 
      icon: FaEye, 
      label: 'View Logs', 
      color: 'gray',
      onClick: (school) => handleOpenModal('logs', school)
    },
  ];

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Failed to Load Schools</h3>
          <p className="text-gray-500 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">School Management</h1>
          <p className="text-gray-500 mt-1">Manage all schools on the platform</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            onClick={() => window.location.href = '/admin/schools/new'}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          >
            <FaPlus />
            Add School
          </button>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <FaSearch />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search schools by name, email, or registration number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            >
              <option value="">All Types</option>
              <option value="nursery">Nursery</option>
              <option value="primary">Primary</option>
              <option value="junior_secondary">Junior Secondary</option>
              <option value="senior_secondary">Senior Secondary</option>
              <option value="combined">Combined</option>
              <option value="faith_based">Faith Based</option>
              <option value="international">International</option>
              <option value="government">Government</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">School</th>
                    <th className="px-4 py-3 hidden md:table-cell">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Students</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Subscription</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {schools.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                        No schools found
                      </td>
                    </tr>
                  ) : (
                    schools.map((school) => {
                      const StatusBadge = getStatusBadge(school.subscription_status, school.is_approved);
                      const TypeBadge = getTypeBadge(school.school_type);
                      
                      return (
                        <tr key={school.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-kora-primary/10 flex items-center justify-center flex-shrink-0">
                                {school.logo_url ? (
                                  <img src={school.logo_url} alt={school.name} className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <FaSchool className="text-kora-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{school.name}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <FaEnvelope className="text-[10px]" />
                                  {school.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${TypeBadge}`}>
                              {school.school_type?.replace('_', ' ') || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${StatusBadge.color}`}>
                              {StatusBadge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                            {school.student_count || 0}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <div>
                              <span className="text-sm text-gray-600">
                                {school.subscription_plans?.name || 'N/A'}
                              </span>
                              <span className="text-xs text-gray-400 block">
                                {school.price_per_student ? `₦${school.price_per_student}/student` : ''}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {actionButtons.map((btn) => {
                                if (btn.condition && !btn.condition(school)) return null;
                                const Icon = btn.icon;
                                return (
                                  <button
                                    key={btn.key}
                                    onClick={() => btn.onClick(school)}
                                    className={`p-1.5 rounded-lg bg-${btn.color}-100 text-${btn.color}-600 hover:bg-${btn.color}-200 transition-colors`}
                                    title={btn.label}
                                  >
                                    <Icon className="text-sm" />
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalSchools > pageSize && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalSchools)} of {totalSchools}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-kora-primary text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <>
          {modalType === 'view' && (
            <SchoolModal
              school={selectedSchool}
              onClose={() => setShowModal(false)}
            />
          )}
          {modalType === 'suspend' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white rounded-xl max-w-md w-full p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Suspend School</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Suspend <span className="font-medium">{selectedSchool?.name}</span>
                </p>
                <textarea
                  value={modalData.reason || ''}
                  onChange={(e) => setModalData({ ...modalData, reason: e.target.value })}
                  placeholder="Enter reason for suspension..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary min-h-[80px]"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAction('suspend', { reason: modalData.reason })}
                    disabled={updateStatusMutation.isLoading}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    {updateStatusMutation.isLoading ? 'Processing...' : 'Suspend School'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {modalType === 'transfer' && (
            <TransferModal
              school={selectedSchool}
              onClose={() => setShowModal(false)}
              onTransfer={(data) => handleAction('transfer', data)}
              isLoading={transferOwnershipMutation.isLoading}
            />
          )}
          {modalType === 'reset_password' && (
            <ResetPasswordModal
              school={selectedSchool}
              onClose={() => setShowModal(false)}
              onReset={() => handleAction('reset_password')}
              isLoading={resetPasswordMutation.isLoading}
            />
          )}
          {modalType === 'assign_manager' && (
            <AssignManagerModal
              school={selectedSchool}
              onClose={() => setShowModal(false)}
              onAssign={(managerId) => handleAction('assign_manager', { managerId })}
              isLoading={assignManagerMutation.isLoading}
            />
          )}
          {modalType === 'subscription' && (
            <SubscriptionModal
              school={selectedSchool}
              plans={plansData?.data || []}
              onClose={() => setShowModal(false)}
              onUpdate={(data) => handleAction('subscription', data)}
              isLoading={updateSubscriptionMutation.isLoading}
            />
          )}
          {modalType === 'logs' && (
            <ActivityLogsModal
              school={selectedSchool}
              onClose={() => setShowModal(false)}
            />
          )}
        </>
      )}

      {/* Confirm Dialog */}
      {showConfirm && (
        <ConfirmDialog
          title={confirmAction === 'delete' ? 'Delete School' : 'Confirm Action'}
          message={
            confirmAction === 'delete'
              ? `Are you sure you want to delete "${selectedSchool?.name}"? This action cannot be undone.`
              : `Are you sure you want to ${confirmAction} "${selectedSchool?.name}"?`
          }
          type={confirmAction === 'delete' || confirmAction === 'suspend' ? 'danger' : 'warning'}
          onConfirm={() => {
            if (confirmAction === 'delete') {
              deleteSchoolMutation.mutate({ schoolId: selectedSchool.id });
            } else {
              updateStatusMutation.mutate({ schoolId: selectedSchool.id, action: confirmAction });
            }
          }}
          onCancel={() => setShowConfirm(false)}
          isLoading={updateStatusMutation.isLoading || deleteSchoolMutation.isLoading}
        />
      )}
    </div>
  );
};

export default Schools;