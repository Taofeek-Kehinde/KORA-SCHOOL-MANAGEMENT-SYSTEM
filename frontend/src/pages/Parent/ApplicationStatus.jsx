import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaClock, FaFileAlt, FaDownload, FaEye, FaUpload, FaCheck } from 'react-icons/fa';

const ApplicationStatus = () => {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const [showDocuments, setShowDocuments] = useState(false);

  // Fetch application
  const { data, isLoading, error } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: async () => {
      const response = await api.get(`/admissions/schools/${user?.schoolId}/applications/${applicationId}`);
      return response.data;
    },
    enabled: !!applicationId && !!user?.schoolId,
  });

  // Fetch all my applications
const { data: myAppsData } = useQuery({
  queryKey: ['myApplications', user?.id],
  queryFn: async () => {
    const response = await api.get('/admissions/my-applications');
    return response.data;
  },
  enabled: !!user?.id && user?.role === 'parent',
});


// Add this query to fetch notifications
const { data: notificationsData } = useQuery({
  queryKey: ['admissionNotifications', user?.id],
  queryFn: async () => {
    const response = await api.get(`/student-notifications/parents/${user?.parentId}/notifications`);
    return response.data;
  },
  enabled: !!user?.parentId,
});

  const application = data?.data;
  const myApplications = myAppsData?.data || [];

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
    'awaiting_exam': 'Awaiting Examination',
    'awaiting_interview': 'Awaiting Interview',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'enrolled': 'Enrolled',
    'waitlist': 'Waitlist'
  };

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
          <h3 className="text-xl font-semibold text-gray-700">Failed to Load Application</h3>
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Application Status</h1>
        <p className="text-gray-500 mt-1">Track the progress of your admission application</p>
      </div>

      {/* My Applications List */}
      {!applicationId && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">My Applications</h3>
          {myApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FaFileAlt className="text-4xl mx-auto mb-2 text-gray-300" />
              No applications found
            </div>
          ) : (
            <div className="space-y-3">
              {myApplications.map((app) => (
                <Link key={app.id} to={`/admissions/status/${app.id}`} className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{app.student_first_name} {app.student_last_name}</p>
                      <p className="text-sm text-gray-500">{app.application_number}</p>
                      <p className="text-xs text-gray-400">{app.classes?.name || 'N/A'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                      {statusLabels[app.status]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Single Application Details */}
      {applicationId && application && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {application.student_first_name} {application.student_last_name}
                </h3>
                <p className="text-sm text-gray-500">{application.application_number}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(application.status)}`}>
                {statusLabels[application.status]}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-400">Class:</span> {application.classes?.name || 'N/A'}</div>
              <div><span className="text-gray-400">Submitted:</span> {new Date(application.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Timeline</h3>
            {application.status_history?.length > 0 ? (
              <div className="space-y-4">
                {application.status_history.map((history) => (
                  <div key={history.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-kora-primary/10 flex items-center justify-center">
                      <FaCheck className="text-kora-primary text-sm" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {statusLabels[history.new_status] || history.new_status}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(history.changed_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">No timeline yet</p>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <button onClick={() => setShowDocuments(!showDocuments)} className="flex items-center justify-between w-full">
              <h3 className="text-lg font-semibold text-gray-800">Documents</h3>
              <span className="text-gray-400">{showDocuments ? '▲' : '▼'}</span>
            </button>
            {showDocuments && (
              <div className="mt-4 space-y-2">
                {application.documents?.length > 0 ? (
                  application.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <span className="text-sm text-gray-700">{doc.document_type || doc.file_name}</span>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-kora-primary hover:underline text-sm">
                        <FaDownload className="inline mr-1" /> Download
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-4">No documents uploaded</p>
                )}
              </div>
            )}
          </div>

          {/* Admission Letter */}
          {application.status === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-2" />
              <p className="font-semibold text-green-800">Congratulations! You've been admitted.</p>
              <p className="text-sm text-green-600 mt-1">Download your admission letter below</p>
              <Link to={`/admissions/letters/${application.id}`} className="inline-block mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                Download Admission Letter
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApplicationStatus;