import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaSpinner, FaCheckCircle, FaTimesCircle, FaClock, FaFileAlt,
  FaDownload, FaUser, FaPhone, FaEnvelope, FaMapMarker, FaCalendarAlt,
  FaCheck, FaTimes, FaArrowLeft, FaUpload, FaPaperPlane, FaUserClock,
  FaGraduationCap, FaBriefcase
} from 'react-icons/fa';

const ApplicationReview = () => {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [reviewAction, setReviewAction] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Fetch application details
  const { data, isLoading, error } = useQuery({
    queryKey: ['applicationReview', applicationId],
    queryFn: async () => {
      const response = await api.get(`/admissions/schools/${user?.schoolId}/applications/${applicationId}`);
      return response.data;
    },
    enabled: !!applicationId,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/admissions/schools/${user?.schoolId}/applications/${applicationId}/status`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Application status updated successfully');
      queryClient.invalidateQueries(['applicationReview', applicationId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  });

  // Generate letter mutation
  const generateLetterMutation = useMutation({
    mutationFn: async (letterType) => {
      const response = await api.post(`/admission-letters/schools/${user?.schoolId}/applications/${applicationId}/letters`, { letterType });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Admission letter generated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate letter');
    }
  });

  const application = data?.data;

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

  const handleStatusChange = (status, reason = '') => {
    setReviewAction(status);
    if (status === 'rejected' && !reason) {
      setRejectReason('');
      return;
    }
    updateStatusMutation.mutate({ status, reason });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-kora-primary" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h3 className="text-xl font-semibold text-gray-700">Failed to Load Application</h3>
          <p className="text-gray-500">{error?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <button onClick={() => navigate('/admissions/dashboard')} className="mb-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
        <FaArrowLeft /> Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Application Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Student Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-800">{application.student_first_name} {application.student_last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium text-gray-800">{application.date_of_birth ? new Date(application.date_of_birth).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium text-gray-800">{application.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Class Applying For</p>
                <p className="font-medium text-gray-800">{application.classes?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nationality</p>
                <p className="font-medium text-gray-800">{application.nationality || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">State of Origin</p>
                <p className="font-medium text-gray-800">{application.state_of_origin || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-800">{application.residential_address || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Parent Information */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Parent/Guardian Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Parent Name</p>
                <p className="font-medium text-gray-800">{application.parent_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Relationship</p>
                <p className="font-medium text-gray-800">{application.parent_relationship}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-800">{application.parent_phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-800">{application.parent_email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Occupation</p>
                <p className="font-medium text-gray-800">{application.parent_occupation || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Employer</p>
                <p className="font-medium text-gray-800">{application.parent_employer || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Documents</h3>
            {application.documents?.length > 0 ? (
              <div className="space-y-2">
                {application.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <span className="text-sm text-gray-700">{doc.document_type || doc.file_name}</span>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-kora-primary hover:underline text-sm">
                      <FaDownload className="inline mr-1" /> Download
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">No documents uploaded</p>
            )}
          </div>

          {/* Status History */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status History</h3>
            {application.status_history?.length > 0 ? (
              <div className="space-y-3">
                {application.status_history.map((history) => (
                  <div key={history.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-kora-primary/10 flex items-center justify-center">
                      <FaCheck className="text-kora-primary text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{history.new_status}</p>
                      <p className="text-xs text-gray-500">{new Date(history.changed_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">No status history</p>
            )}
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Current Status */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Status</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(application.status)}`}>
              {application.status}
            </span>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleStatusChange('under_review')}
                disabled={updateStatusMutation.isLoading}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FaClock /> Move to Under Review
              </button>

              <button
                onClick={() => handleStatusChange('awaiting_documents')}
                disabled={updateStatusMutation.isLoading}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FaFileAlt /> Request Documents
              </button>

              <button
                onClick={() => handleStatusChange('awaiting_exam')}
                disabled={updateStatusMutation.isLoading}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FaGraduationCap /> Awaiting Exam
              </button>

              <button
                onClick={() => handleStatusChange('awaiting_interview')}
                disabled={updateStatusMutation.isLoading}
                className="w-full px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FaUserClock /> Awaiting Interview
              </button>

              <button
                onClick={() => handleStatusChange('approved')}
                disabled={updateStatusMutation.isLoading}
                className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FaCheckCircle /> Approve
              </button>

              <button
                onClick={() => handleStatusChange('waitlist')}
                disabled={updateStatusMutation.isLoading}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FaUserClock /> Waitlist
              </button>

              <button
                onClick={() => setRejectReason('')}
                disabled={updateStatusMutation.isLoading}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FaTimesCircle /> Reject
              </button>
            </div>

            {/* Reject Reason Input */}
            {rejectReason !== null && (
              <div className="mt-4 space-y-2">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary min-h-[80px]"
                />
                <button
                  onClick={() => handleStatusChange('rejected', rejectReason)}
                  disabled={updateStatusMutation.isLoading || !rejectReason}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm Reject
                </button>
              </div>
            )}

            {/* Generate Letter */}
            {application.status === 'approved' && (
              <button
                onClick={() => generateLetterMutation.mutate('admission')}
                disabled={generateLetterMutation.isLoading}
                className="w-full px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                <FaPaperPlane /> Generate Admission Letter
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationReview;