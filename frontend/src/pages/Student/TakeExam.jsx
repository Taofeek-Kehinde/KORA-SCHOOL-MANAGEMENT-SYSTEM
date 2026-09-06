import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaClock, FaQuestionCircle, FaSpinner, FaCheckCircle, FaTimesCircle, FaArrowRight, FaArrowLeft, FaPaperPlane } from 'react-icons/fa';

const TakeExam = () => {
  const { examId } = useParams();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // Fetch exam details
  const { data: examData, isLoading, error } = useQuery({
    queryKey: ['exam', examId],
    queryFn: async () => {
      const response = await api.get(`/exams/schools/${user?.schoolId}/exams/${examId}`);
      return response.data;
    },
    enabled: !!examId,
  });

  // Submit exam
  const submitExamMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/exams/schools/${user?.schoolId}/exams/${examId}/submit`, data);
      return response.data;
    },
    onSuccess: (data) => {
      setResult(data.data);
      setShowResult(true);
      toast.success('Exam submitted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit exam');
    }
  });

  const exam = examData?.data;
  const questions = exam?.questions || [];

  // Timer
  useEffect(() => {
    if (exam?.duration && !showResult) {
      setTimeLeft(exam.duration * 60);
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [exam?.duration, showResult]);

  const handleSelectAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer
    }));
    submitExamMutation.mutate({ answers: answersArray });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-kora-primary" />
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          {result?.percentage >= 50 ? (
            <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
          ) : (
            <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {result?.percentage >= 50 ? 'Congratulations!' : 'Keep Trying!'}
          </h2>
          <p className="text-gray-500 mb-4">You scored {result?.percentage}%</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              Score: {result?.score}/{result?.total_marks}
            </p>
            <p className="text-sm text-gray-600">
              Questions: {result?.total_questions}
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/student/dashboard'}
            className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Exam Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{exam.title}</h1>
            <p className="text-gray-500">{exam.subjects?.name}</p>
          </div>
          <div className="flex items-center gap-2 text-red-500 font-bold">
            <FaClock />
            <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
          </div>
        </div>
        {exam.instructions && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700">{exam.instructions}</p>
          </div>
        )}
      </div>

      {/* Question */}
      {questions.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-4">
            <span className="text-sm text-gray-500">Question {currentQuestion + 1} of {questions.length}</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            {questions[currentQuestion].question_text}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {questions[currentQuestion].options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectAnswer(questions[currentQuestion].id, option)}
                className={`w-full text-left px-4 py-3 border-2 rounded-lg transition-all ${
                  answers[questions[currentQuestion].id] === option
                    ? 'border-kora-primary bg-kora-primary/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                {option}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
            >
              <FaArrowLeft />
              Previous
            </button>

            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
              >
                Next
                <FaArrowRight />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitExamMutation.isLoading}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
              >
                {submitExamMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                Submit Exam
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeExam;