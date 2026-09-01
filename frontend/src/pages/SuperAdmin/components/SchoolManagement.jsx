import React, { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaBan, FaCheck, FaUserCog, FaKey, FaEye, FaExchangeAlt, FaUserPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../../utils/axios';

const SchoolManagement = ({ onUpdate }) => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, [searchTerm, filterStatus]);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/schools', {
        params: {
          search: searchTerm || undefined,
          status: filterStatus || undefined,
          limit: 50
        }
      });
      setSchools(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch schools');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (schoolId, action, reason = '') => {
    setProcessing(true);
    try {
      const response = await api.put(`/admin/schools/${schoolId}/status`, {
        action,
        reason
      });
      toast.success(response.data.message || `School ${action}ed successfully`);
      setShowModal(false);
      fetchSchools();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} school`);
    } finally {
      setProcessing(false);
    }
  };

  const handleSubscriptionUpdate = async (schoolId, planData) => {
    setProcessing(true);
    try {
      const response = await api.put(`/admin/schools/${schoolId}/subscription`, planData);
      toast.success(response.data.message || 'Subscription updated successfully');
      setShowModal(false);
      fetchSchools();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update subscription');
    } finally {
      setProcessing(false);
    }
  };

  const openModal = (type, school) => {
    setSelectedSchool(school);
    setModalType(type);
    setModalData({});
    setShowModal(true);
  };

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

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'trial', label: 'Trial' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'expired', label: 'Expired' },
    { value: 'pending', label: 'Pending' },
  ];

  const actionButtons = [
    { type: 'activate', icon: FaCheck, label: 'Activate', color: 'green' },
    { type: 'suspend', icon: FaBan, label: 'Suspend', color: 'red' },
    { type: 'delete', icon: FaTrash, label: 'Delete', color: 'red' },
    { type: 'transfer', icon: FaExchangeAlt, label: 'Transfer', color: 'blue' },
    { type: 'reset_password', icon: FaKey, label: 'Reset Password', color: 'yellow' },
    { type: 'assign_manager', icon: FaUserPlus, label: 'Assign Manager', color: 'purple' },
    { type: 'change_subscription', icon: FaEdit, label: 'Change Subscription', color: 'indigo' },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FaUserCog className="text-kora-primary" />
            School Management
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 mt-3 md:mt-0">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary w-full sm:w-48"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <th className="pb-3">School</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 hidden md:table-cell">Students</th>
                <th className="pb-3 hidden lg:table-cell">Subscription</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schools.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">
                    No schools found
                  </td>
                </tr>
              ) : (
                schools.map((school) => {
                  const StatusBadge = getStatusBadge(school.subscription_status, school.is_approved);
                  
                  return (
                    <tr key={school.id}>
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-gray-800">{school.name}</p>
                          <p className="text-xs text-gray-500">{school.email}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${StatusBadge.color}`}>
                          {StatusBadge.label}
                        </span>
                      </td>
                      <td className="py-3 hidden md:table-cell text-gray-600">
                        {school.student_count || 0}
                      </td>
                      <td className="py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-600">
                          {school.subscription_plans?.name || 'N/A'}
                        </span>
                        <span className="text-xs text-gray-400 block">
                          {school.price_per_student ? `₦${school.price_per_student}/student` : ''}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          {actionButtons.map((btn) => {
                            const Icon = btn.icon;
                            return (
                              <button
                                key={btn.type}
                                onClick={() => openModal(btn.type, school)}
                                className={`p-1.5 rounded-lg bg-${btn.color}-100 text-${btn.color}-600 hover:bg-${btn.color}-200 transition-colors`}
                                title={btn.label}
                              >
                                <Icon className="text-sm" />
                              </button>
                            );
                          })}
                          <button
                            onClick={() => window.open(`/admin/schools/${school.id}/logs`, '_blank')}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            title="View Activity Logs"
                          >
                            <FaEye className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {showModal && selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {modalType.replace('_', ' ').toUpperCase()}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {selectedSchool.name} - {selectedSchool.email}
            </p>

            {modalType === 'suspend' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Suspension Reason
                </label>
                <textarea
                  value={modalData.reason || ''}
                  onChange={(e) => setModalData({ ...modalData, reason: e.target.value })}
                  placeholder="Enter reason for suspension..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary min-h-[80px]"
                />
              </div>
            )}

            {modalType === 'change_subscription' && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan
                  </label>
                  <select
                    value={modalData.planId || ''}
                    onChange={(e) => setModalData({ ...modalData, planId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="">Select Plan</option>
                    {/* Options will be populated from API */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Per Student
                  </label>
                  <input
                    type="number"
                    value={modalData.pricePerStudent || ''}
                    onChange={(e) => setModalData({ ...modalData, pricePerStudent: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Frequency
                  </label>
                  <select
                    value={modalData.billingFrequency || ''}
                    onChange={(e) => setModalData({ ...modalData, billingFrequency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="">Select Frequency</option>
                    <option value="monthly">Monthly</option>
                    <option value="termly">Termly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
              </div>
            )}

            {modalType === 'assign_manager' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Manager ID
                </label>
                <input
                  type="text"
                  value={modalData.managerId || ''}
                  onChange={(e) => setModalData({ ...modalData, managerId: e.target.value })}
                  placeholder="Enter user ID..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (modalType === 'change_subscription') {
                    handleSubscriptionUpdate(selectedSchool.id, {
                      planId: modalData.planId,
                      pricePerStudent: modalData.pricePerStudent,
                      billingFrequency: modalData.billingFrequency
                    });
                  } else if (modalType === 'assign_manager') {
                    // Handle assign manager
                    toast.info('Assign manager functionality coming soon');
                    setShowModal(false);
                  } else if (modalType === 'reset_password') {
                    toast.info('Reset password functionality coming soon');
                    setShowModal(false);
                  } else if (modalType === 'transfer') {
                    toast.info('Transfer ownership functionality coming soon');
                    setShowModal(false);
                  } else {
                    handleStatusUpdate(selectedSchool.id, modalType, modalData.reason);
                  }
                }}
                disabled={processing}
                className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary transition-colors flex items-center gap-2"
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SchoolManagement;