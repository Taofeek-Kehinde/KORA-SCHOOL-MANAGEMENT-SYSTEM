import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaTimes, FaSpinner, FaCheck, FaBook, FaCalendarAlt, FaChalkboardTeacher } from 'react-icons/fa';

const HomeworkSubmitModal = ({ homeworkEntry, studentId, onClose }) => {
  const queryClient = useQueryClient();
  const [submissionText, setSubmissionText] = useState('');

  const hw = homeworkEntry?.homework || {};
  const isAlreadySubmitted = homeworkEntry?.status === 'submitted';
  const hasScore = homeworkEntry?.score !== null && homeworkEntry?.score !== undefined;

  useEffect(() => {
    if (homeworkEntry?.submission_text) {
      setSubmissionText(homeworkEntry.submission_text);
    }
  }, [homeworkEntry]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/homework/student-homework/${homeworkEntry.id}`, {
        status: 'submitted',
        submissionText
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Homework submitted successfully!');
      queryClient.invalidateQueries(['studentHomework', studentId]);
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit homework');
    }
  });

  const handleSubmit = () => {
    if (!submissionText.trim()) {
      toast.error('Please write your answer before submitting');
      return;
    }
    submitMutation.mutate();
  };

  if (!homeworkEntry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FaBook className="text-kora-primary" />
              {hw.title}
            </h3>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <FaChalkboardTeacher className="text-xs" />
                {hw.subjects?.name || 'Subject'}
              </span>
              <span className="flex items-center gap-1">
                <FaCalendarAlt className="text-xs" />
                Due: {hw.due_date ? new Date(hw.due_date).toLocaleDateString() : 'N/A'}
              </span>
              {hw.teachers && (
                <span>
                  By: {hw.teachers.first_name} {hw.teachers.last_name}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaTimes />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Details</label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 whitespace-pre-wrap text-gray-800">
            {hw.description || 'No additional instructions provided.'}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isAlreadySubmitted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isAlreadySubmitted ? 'Submitted' : 'Pending'}
          </span>
          
          {isAlreadySubmitted && hasScore && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Score: {homeworkEntry.score}/{homeworkEntry.max_score || 100}
            </span>
          )}
        </div>

        {isAlreadySubmitted && homeworkEntry.teacher_feedback && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800">Teacher Feedback:</p>
            <p className="text-sm text-gray-700">{homeworkEntry.teacher_feedback}</p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isAlreadySubmitted ? 'Your Submission' : 'Your Answer'}
          </label>
          <textarea
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            rows="8"
            readOnly={isAlreadySubmitted}
            placeholder="Type your answer here..."
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary ${
              isAlreadySubmitted ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {isAlreadySubmitted ? 'Close' : 'Cancel'}
          </button>
          {!isAlreadySubmitted && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitMutation.isLoading}
              className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
            >
              {submitMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
              Submit Assignment
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeworkSubmitModal;