import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { FaSpinner, FaBook, FaCheckCircle, FaClock } from 'react-icons/fa';
import StatCard from '../../components/StatCard';

const HomeworkPage = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
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
            {homeworkItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{item.homework?.title || 'Homework'}</p>
                    <p className="text-xs text-gray-500">
                      {item.homework?.subjects?.name} • Due: {item.homework?.due_date ? new Date(item.homework.due_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'submitted' ? 'bg-green-100 text-green-800' :
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkPage;