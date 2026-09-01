import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import { FaCheck, FaTimes, FaClock, FaUserClock, FaEye } from 'react-icons/fa';

const PendingApprovals = ({ pendingSchools, onApprove }) => {
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const approveMutation = useMutation({
    mutationFn: async (registrationId) => {
      const response = await api.put(`/admin/registrations/${registrationId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('School approved successfully!');
      onApprove();
      setShowRejectModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to approve school');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ registrationId, reason }) => {
      const response = await api.put(`/admin/registrations/${registrationId}/reject`, { reason });
      return response.data;
    },
    onSuccess: () => {
      toast.success('School rejected');
      onApprove();
      setShowRejectModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject school');
    }
  });

  if (!pendingSchools || pendingSchools.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaUserClock className="text-kora-primary" />
          Pending Approvals
        </h3>
        <div className="text-center py-8 text-gray-500">
          <FaCheck className="text-4xl mx-auto mb-2 text-green-400" />
          <p>No pending school registrations</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaUserClock className="text-kora-primary" />
          Pending Approvals ({pendingSchools.length})
        </h3>
        <div className="space-y-4">
          {pendingSchools.map((school) => (
            <div key={school.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{school.school_name}</h4>
                  <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
                    <span>{school.admin_email}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{school.admin_full_name}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-gray-400">{school.phone_number}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {school.city}, {school.state}, {school.country}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 sm:mt-0">
                  <button
                    onClick={() => {
                      setSelectedSchool(school);
                      setShowRejectModal(true);
                    }}
                    className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
                  >
                    <FaTimes className="text-sm" />
                    Reject
                  </button>
                  <button
                    onClick={() => approveMutation.mutate(school.id)}
                    disabled={approveMutation.isLoading}
                    className="px-3 py-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
                  >
                    <FaCheck className="text-sm" />
                    Approve
                  </button>
                  <button
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                  >
                    <FaEye className="text-sm" />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Reject School Registration</h3>
            <p className="text-gray-500 text-sm mb-4">
              Rejecting <span className="font-medium">{selectedSchool.school_name}</span>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Provide a reason for rejection..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary min-h-[100px]"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate({ registrationId: selectedSchool.id, reason: rejectReason })}
                disabled={rejectMutation.isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
              >
                {rejectMutation.isLoading ? 'Processing...' : 'Reject School'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PendingApprovals;