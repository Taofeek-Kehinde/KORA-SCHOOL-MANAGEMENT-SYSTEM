import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { FaSpinner, FaBook, FaCheckCircle, FaClock, FaEye } from 'react-icons/fa';
import StatCard from '../../components/StatCard';
import HomeworkSubmitModal from './HomeworkSubmitModal';

const HomeworkPage = () => {
  const { user } = useAuth();
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['studentHomework', user?.studentId],
    queryFn: async () => {
      const response = await api.get(`/homework/students/${user?.studentId}/homework`);
      return response.data;
    },
    enabled: !!user?.studentId,
  });

  const homeworkItems = data?.data || [];

  const pending = homeworkItems.filter(h => h.status === 'pending').length;
  const completed = homeworkItems.filter(h => h.status === 'submitted').length;

  const handleViewHomework = (item) => {
    setSelectedHomework(item);
    setShowSubmitModal(true);
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
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Homework</h1>
        <p className="text-gray-500 mt-1">Your assignments</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FaBook} title="Total" value={homeworkItems.length} color="blue" />
        <StatCard icon={FaCheckCircle} title="Completed" value={completed} color="green" />
        <StatCard icon={FaClock} title="Pending" value={pending} color="yellow" />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Assignments</h3>
        {homeworkItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FaBook className="text-4xl mx-auto mb-2 text-gray-300" />
            No homework assigned
          </div>
        ) : (
          <div className="space-y-3">
            {homeworkItems.map((item) => {
              const hw = item.homework || {};
              const isSubmitted = item.status === 'submitted';
              const hasScore = item.score !== null && item.score !== undefined;

              return (
                <div 
                  key={item.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewHomework(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{hw.title || 'Homework'}</p>
                      <p className="text-xs text-gray-500">
                        {hw.subjects?.name || 'No subject'} • Due: {hw.due_date ? new Date(hw.due_date).toLocaleDateString() : 'N/A'}
                      </p>
                      {isSubmitted && hasScore && (
                        <p className="text-sm font-semibold text-green-600 mt-1">
                          Score: {item.score}/{item.max_score || 100}
                        </p>
                      )}
                      {isSubmitted && item.teacher_feedback && (
                        <p className="text-xs text-gray-600 mt-1">
                          Feedback: {item.teacher_feedback}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isSubmitted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isSubmitted ? 'Submitted' : 'Pending'}
                      </span>
                      <button 
                        className="text-xs text-blue-600 flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewHomework(item);
                        }}
                      >
                        <FaEye className="text-xs" /> {isSubmitted ? 'View' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showSubmitModal && selectedHomework && (
        <HomeworkSubmitModal
          homeworkEntry={selectedHomework}
          studentId={user?.studentId}
          onClose={() => {
            setShowSubmitModal(false);
            setSelectedHomework(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default HomeworkPage;