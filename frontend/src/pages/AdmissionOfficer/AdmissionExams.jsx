import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaPlus, FaSpinner, FaCheck, FaTimes, FaClock, FaGraduationCap, FaCalendarAlt, FaEdit, FaTrash
} from 'react-icons/fa';

const AdmissionExams = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [formData, setFormData] = useState({
    applicationId: '',
    examType: 'paper',
    subjectId: '',
    scheduledDate: '',
    scheduledTime: ''
  });
  const [scoreData, setScoreData] = useState({
    score: '',
    totalMarks: ''
  });

  // Fetch scheduled exams
  const { data: examsData, isLoading, refetch } = useQuery({
    queryKey: ['admissionExams', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/admission-exams/schools/${user?.schoolId}/exams/scheduled`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch applications (for scheduling)
  const { data: appsData } = useQuery({
    queryKey: ['applicationsForExam', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/admissions/schools/${user?.schoolId}/applications`, {
        params: { status: 'awaiting_exam', limit: 100 }
      });
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch subjects
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/subjects`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Schedule exam
  const scheduleExamMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/admission-exams/schools/${user?.schoolId}/exams`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Exam scheduled successfully');
      setShowModal(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to schedule exam');
    }
  });

  // Record score
  const recordScoreMutation = useMutation({
    mutationFn: async ({ examId, data }) => {
      const response = await api.put(`/admission-exams/schools/${user?.schoolId}/exams/${examId}/score`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Exam score recorded successfully');
      setShowScoreModal(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to record score');
    }
  });

  const exams = examsData?.data || [];
  const applications = appsData?.data || [];
  const subjects = subjectsData?.data || [];

  const handleScheduleExam = (e) => {
    e.preventDefault();
    if (!formData.applicationId || !formData.scheduledDate) {
      toast.error('Application and date are required');
      return;
    }
    scheduleExamMutation.mutate(formData);
  };

  const handleRecordScore = (e) => {
    e.preventDefault();
    if (!scoreData.score || !scoreData.totalMarks) {
      toast.error('Score and total marks are required');
      return;
    }
    recordScoreMutation.mutate({
      examId: selectedExam.id,
      data: scoreData
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admission Exams</h1>
          <p className="text-gray-500 mt-1">Schedule and manage entrance exams</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2 mt-3 md:mt-0"
        >
          <FaPlus /> Schedule Exam
        </button>
      </div>

      {/* Exams Table */}
      {exams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaGraduationCap className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Exams Scheduled</h3>
          <p className="text-gray-500">Click "Schedule Exam" to schedule your first exam</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Application</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">
                        {exam.admission_applications?.student_first_name} {exam.admission_applications?.student_last_name}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm">{exam.admission_applications?.application_number}</td>
                    <td className="px-4 py-3 text-sm capitalize">{exam.exam_type}</td>
                    <td className="px-4 py-3 text-sm">{exam.scheduled_date ? new Date(exam.scheduled_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{exam.scheduled_time || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        exam.status === 'completed' ? 'bg-green-100 text-green-800' :
                        exam.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {exam.status === 'completed' ? `${exam.score}/${exam.total_marks}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {exam.status !== 'completed' && (
                        <button
                          onClick={() => {
                            setSelectedExam(exam);
                            setScoreData({ score: '', totalMarks: '' });
                            setShowScoreModal(true);
                          }}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                        >
                          Record Score
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

      {/* Schedule Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Schedule Exam</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleScheduleExam}>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                  <select
                    value={formData.examType}
                    onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="paper">Paper-Based</option>
                    <option value="cbt">Computer-Based (CBT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject (Optional)</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="">No Subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
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
                <button type="submit" disabled={scheduleExamMutation.isLoading} className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2">
                  {scheduleExamMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Score Modal */}
      {showScoreModal && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Record Exam Score</h3>
              <button onClick={() => setShowScoreModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {selectedExam.admission_applications?.student_first_name} {selectedExam.admission_applications?.student_last_name}
            </p>
            <form onSubmit={handleRecordScore}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Score *</label>
                  <input
                    type="number"
                    value={scoreData.score}
                    onChange={(e) => setScoreData({ ...scoreData, score: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks *</label>
                  <input
                    type="number"
                    value={scoreData.totalMarks}
                    onChange={(e) => setScoreData({ ...scoreData, totalMarks: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowScoreModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" disabled={recordScoreMutation.isLoading} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2">
                  {recordScoreMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  Save Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionExams;