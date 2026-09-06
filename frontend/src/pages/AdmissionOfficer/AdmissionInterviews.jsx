import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaPlus, FaSpinner, FaCheck, FaTimes, FaUserClock, FaCalendarAlt, FaEdit, FaTrash, FaUsers
} from 'react-icons/fa';

const AdmissionInterviews = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [formData, setFormData] = useState({
    applicationId: '',
    panelMembers: '',
    scheduledDate: '',
    scheduledTime: ''
  });
  const [resultData, setResultData] = useState({
    observations: '',
    score: '',
    recommendation: ''
  });

  // Fetch scheduled interviews
  const { data: interviewsData, isLoading, refetch } = useQuery({
    queryKey: ['admissionInterviews', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/admission-interviews/schools/${user?.schoolId}/interviews/scheduled`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch applications (for scheduling)
  const { data: appsData } = useQuery({
    queryKey: ['applicationsForInterview', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/admissions/schools/${user?.schoolId}/applications`, {
        params: { status: 'awaiting_interview', limit: 100 }
      });
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Schedule interview
  const scheduleInterviewMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/admission-interviews/schools/${user?.schoolId}/interviews`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Interview scheduled successfully');
      setShowModal(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to schedule interview');
    }
  });

  // Record interview result
  const recordResultMutation = useMutation({
    mutationFn: async ({ interviewId, data }) => {
      const response = await api.put(`/admission-interviews/schools/${user?.schoolId}/interviews/${interviewId}/result`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Interview result recorded successfully');
      setShowResultModal(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to record result');
    }
  });

  const interviews = interviewsData?.data || [];
  const applications = appsData?.data || [];

  const handleScheduleInterview = (e) => {
    e.preventDefault();
    if (!formData.applicationId || !formData.scheduledDate) {
      toast.error('Application and date are required');
      return;
    }
    scheduleInterviewMutation.mutate({
      ...formData,
      panelMembers: formData.panelMembers ? formData.panelMembers.split(',').map(s => s.trim()) : []
    });
  };

  const handleRecordResult = (e) => {
    e.preventDefault();
    if (!resultData.recommendation) {
      toast.error('Recommendation is required');
      return;
    }
    recordResultMutation.mutate({
      interviewId: selectedInterview.id,
      data: resultData
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-kora-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admission Interviews</h1>
          <p className="text-gray-500 mt-1">Schedule and manage admission interviews</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2 mt-3 md:mt-0"
        >
          <FaPlus /> Schedule Interview
        </button>
      </div>

      {/* Interviews Table */}
      {interviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaUserClock className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Interviews Scheduled</h3>
          <p className="text-gray-500">Click "Schedule Interview" to schedule your first interview</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Application</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Panel</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {interviews.map((interview) => (
                  <tr key={interview.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {interview.admission_applications?.student_first_name} {interview.admission_applications?.student_last_name}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm">{interview.admission_applications?.application_number}</td>
                    <td className="px-4 py-3 text-sm">{interview.scheduled_date ? new Date(interview.scheduled_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{interview.scheduled_time || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">
                      {interview.panel_members?.length > 0 ? interview.panel_members.length : '-'} members
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                        interview.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {interview.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {interview.status !== 'completed' && (
                        <button
                          onClick={() => {
                            setSelectedInterview(interview);
                            setResultData({ observations: '', score: '', recommendation: '' });
                            setShowResultModal(true);
                          }}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                        >
                          Record Result
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Schedule Interview</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleScheduleInterview}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application *</label>
                  <select
                    value={formData.applicationId}
                    onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="">Select Application</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.student_first_name} {app.student_last_name} ({app.application_number})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Panel Members</label>
                  <input
                    type="text"
                    value={formData.panelMembers}
                    onChange={(e) => setFormData({ ...formData, panelMembers: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    placeholder="Enter panel member emails separated by commas"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" disabled={scheduleInterviewMutation.isLoading} className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2">
                  {scheduleInterviewMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Result Modal */}
      {showResultModal && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Record Interview Result</h3>
              <button onClick={() => setShowResultModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {selectedInterview.admission_applications?.student_first_name} {selectedInterview.admission_applications?.student_last_name}
            </p>
            <form onSubmit={handleRecordResult}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observations</label>
                  <textarea
                    value={resultData.observations}
                    onChange={(e) => setResultData({ ...resultData, observations: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    placeholder="Interview observations..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score (0-100)</label>
                  <input
                    type="number"
                    value={resultData.score}
                    onChange={(e) => setResultData({ ...resultData, score: e.target.value })}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation *</label>
                  <select
                    value={resultData.recommendation}
                    onChange={(e) => setResultData({ ...resultData, recommendation: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="">Select Recommendation</option>
                    <option value="approve">Approve</option>
                    <option value="reject">Reject</option>
                    <option value="waitlist">Waitlist</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowResultModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" disabled={recordResultMutation.isLoading} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2">
                  {recordResultMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionInterviews;