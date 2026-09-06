import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaTimes, FaSpinner, FaSave, FaUser, FaCheckCircle } from 'react-icons/fa';

const HomeworkSubmissionsModal = ({ homework, onClose }) => {
  const queryClient = useQueryClient();
  const [gradingId, setGradingId] = useState(null);
  const [scoreInput, setScoreInput] = useState('');
  const [maxScoreInput, setMaxScoreInput] = useState('100');
  const [feedbackInput, setFeedbackInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['homeworkSubmissions', homework.id],
    queryFn: async () => {
      const response = await api.get(`/homework/${homework.id}/submissions`);
      return response.data;
    },
    enabled: !!homework.id,
  });

  const submissions = data?.data || [];

  const gradeMutation = useMutation({
    mutationFn: async ({ studentHomeworkId, score, maxScore, feedback }) => {
      const response = await api.put(`/homework/student-homework/${studentHomeworkId}/grade`, {
        score, maxScore, feedback
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Grade saved');
      queryClient.invalidateQueries(['homeworkSubmissions', homework.id]);
      setGradingId(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save grade');
    }
  });

  const startGrading = (submission) => {
    setGradingId(submission.id);
    setScoreInput(submission.score ?? '');
    setMaxScoreInput(submission.max_score ?? '100');
    setFeedbackInput(submission.teacher_feedback ?? '');
  };

  const handleSaveGrade = (studentHomeworkId) => {
    if (scoreInput === '' || isNaN(Number(scoreInput))) {
      toast.error('Please enter a valid score');
      return;
    }
    gradeMutation.mutate({
      studentHomeworkId,
      score: Number(scoreInput),
      maxScore: Number(maxScoreInput) || 100,
      feedback: feedbackInput
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">{homework.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{submissions.length} student(s)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaTimes />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <FaSpinner className="animate-spin text-2xl text-kora-primary mx-auto" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No students assigned yet</div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-gray-400" />
                    <span className="font-medium text-gray-800">
                      {sub.students?.first_name} {sub.students?.last_name}
                    </span>
                    <span className="text-xs text-gray-400">{sub.students?.admission_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sub.status === 'submitted' ? 'bg-green-100 text-green-800' :
                      sub.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {sub.status}
                    </span>
                    {sub.score !== null && sub.score !== undefined && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
                        <FaCheckCircle /> {sub.score}/{sub.max_score}
                      </span>
                    )}
                  </div>
                </div>

                {sub.submission_text ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap mb-2">
                    {sub.submission_text}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic mb-2">No submission yet</p>
                )}

                {sub.teacher_feedback && gradingId !== sub.id && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 mb-2">
                    <strong>Feedback:</strong> {sub.teacher_feedback}
                  </div>
                )}

                {gradingId === sub.id ? (
                  <div className="space-y-2 mt-3 border-t border-gray-100 pt-3">
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        value={scoreInput}
                        onChange={(e) => setScoreInput(e.target.value)}
                        placeholder="Score"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <span>/</span>
                      <input
                        type="number"
                        value={maxScoreInput}
                        onChange={(e) => setMaxScoreInput(e.target.value)}
                        placeholder="Max"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <textarea
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="Feedback for student (optional)"
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveGrade(sub.id)}
                        disabled={gradeMutation.isLoading}
                        className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2 text-sm"
                      >
                        {gradeMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                        Save Grade
                      </button>
                      <button
                        onClick={() => setGradingId(null)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  sub.submission_text && (
                    <button
                      onClick={() => startGrading(sub)}
                      className="text-sm text-kora-primary hover:underline mt-1"
                    >
                      {sub.score !== null && sub.score !== undefined ? 'Update Grade' : 'Grade this submission'}
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkSubmissionsModal;