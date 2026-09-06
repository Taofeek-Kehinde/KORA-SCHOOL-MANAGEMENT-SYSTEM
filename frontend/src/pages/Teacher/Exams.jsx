import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaFileAlt,
  FaClock,
  FaCheckCircle,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaEye,
  FaQuestionCircle,
} from 'react-icons/fa';

const Exams = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/classes`);
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

  // Fetch exams
  const { data: examsData, refetch } = useQuery({
    queryKey: ['exams', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/exams/schools/${user?.schoolId}/exams`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const classes = classesData?.data || [];
  const subjects = subjectsData?.data || [];
  const exams = examsData?.data || [];

  // Create exam mutation
  const createExamMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/exams/schools/${user?.schoolId}/exams`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Exam created successfully');
      setShowCreateModal(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create exam');
    }
  });

  const handleExamClick = (exam) => {
    setSelectedExam(exam);
    setShowDetails(true);
  };

  const handleViewResults = (exam) => {
    setSelectedExam(exam);
    setShowResults(true);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Exam Management</h1>
          <p className="text-gray-500 mt-1">Create and manage exams for your classes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2 mt-3 md:mt-0"
        >
          <FaPlus />
          Create Exam
        </button>
      </div>

      {/* Exams List */}
      {exams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaFileAlt className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Exams Yet</h3>
          <p className="text-gray-500">Click "Create Exam" to create your first exam</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">{exam.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {exam.subjects?.name} • {exam.classes?.name}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleExamClick(exam)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                  <button
                    onClick={() => handleViewResults(exam)}
                    className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg"
                    title="View Results"
                  >
                    <FaCheckCircle />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FaClock className="text-xs" />
                  {exam.duration} mins
                </span>
                <span>{exam.total_marks} marks</span>
                <span>{new Date(exam.exam_date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Exam Modal */}
      {showCreateModal && (
        <CreateExamModal
          classes={classes}
          subjects={subjects}
          schoolId={user?.schoolId}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createExamMutation.mutate(data)}
          isLoading={createExamMutation.isLoading}
        />
      )}

      {/* Exam Details Modal */}
      {showDetails && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">{selectedExam.title}</h3>
              <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>
            <p className="text-gray-500">
              {selectedExam.subjects?.name} • {selectedExam.classes?.name}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Duration: {selectedExam.duration} mins • Total Marks: {selectedExam.total_marks}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Date: {new Date(selectedExam.exam_date).toLocaleDateString()}
            </p>
            {selectedExam.instructions && (
              <div className="mt-4 bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{selectedExam.instructions}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exam Results Modal */}
      {showResults && selectedExam && (
        <ExamResultsModal
          examId={selectedExam.id}
          schoolId={user?.schoolId}
          onClose={() => setShowResults(false)}
        />
      )}
    </div>
  );
};

// Create Exam Modal Component
const CreateExamModal = ({ classes, subjects, schoolId, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    subjectId: '',
    classId: '',
    examDate: '',
    duration: 60,
    totalMarks: 100,
    instructions: '',
    questions: []
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    marks: 1
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.question) {
      toast.error('Question is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { ...currentQuestion }]
    }));
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      marks: 1
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.subjectId || !formData.classId) {
      toast.error('Title, subject, and class are required');
      return;
    }
    onSubmit({
      ...formData,
      schoolId
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Create Exam</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                placeholder="e.g., Mathematics Midterm Exam"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <select
                  name="subjectId"
                  value={formData.subjectId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="examDate"
                  value={formData.examDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                <input
                  type="number"
                  name="totalMarks"
                  value={formData.totalMarks}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                placeholder="e.g., Answer all questions. Each question carries 1 mark."
              />
            </div>

            {/* Questions Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FaQuestionCircle className="text-kora-primary" />
                Add Questions
              </h4>

              {/* Current Question */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Question text"
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                />
                <div className="grid grid-cols-2 gap-2">
                  {currentQuestion.options.map((opt, index) => (
                    <input
                      key={index}
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...currentQuestion.options];
                        newOptions[index] = e.target.value;
                        setCurrentQuestion({ ...currentQuestion, options: newOptions });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    value={currentQuestion.correctAnswer}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  >
                    <option value="">Select Answer</option>
                    {currentQuestion.options.map((opt, index) => (
                      <option key={index} value={opt}>
                        {String.fromCharCode(65 + index)}: {opt || `Option ${String.fromCharCode(65 + index)}`}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Marks"
                    value={currentQuestion.marks}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) })}
                    className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary"
                  >
                    Add Question
                  </button>
                </div>
              </div>

              {/* Added Questions */}
              {formData.questions.length > 0 && (
                <div className="mt-4 space-y-2">
                  {formData.questions.map((q, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-800">
                        Q{idx + 1}: {q.question}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Answer: {q.correctAnswer} • {q.marks} mark(s)
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
              Create Exam
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Exam Results Modal Component
const ExamResultsModal = ({ examId, schoolId, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['examResults', examId],
    queryFn: async () => {
      const response = await api.get(`/exams/schools/${schoolId}/exams/${examId}/results`);
      return response.data;
    },
    enabled: !!examId,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-xl p-6">
          <FaSpinner className="animate-spin text-3xl text-kora-primary" />
        </div>
      </div>
    );
  }

  const results = data?.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Exam Results</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaTimes />
          </button>
        </div>

        {results.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No results yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Percentage</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {result.students?.first_name} {result.students?.last_name}
                    </td>
                    <td className="px-4 py-3">{result.score}/{result.total_marks}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-kora-primary">{result.percentage}%</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(result.submitted_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exams;