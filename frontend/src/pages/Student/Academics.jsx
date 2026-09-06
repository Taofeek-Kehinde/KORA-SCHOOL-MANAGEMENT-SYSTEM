import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { FaSpinner, FaBook, FaChartLine } from 'react-icons/fa';

const Academics = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['studentAcademics', user?.studentId],
    queryFn: async () => {
      const response = await api.get(`/student-dashboard/students/${user?.studentId}/dashboard`);
      return response.data;
    },
    enabled: !!user?.studentId,
  });

  const academic = data?.data?.academicPerformance || {};

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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Academics</h1>
        <p className="text-gray-500 mt-1">Your academic performance</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaBook className="text-kora-primary" />
          Subject Performance
        </h3>
        {academic.subjects?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3 text-center">CA1</th>
                  <th className="px-4 py-3 text-center">CA2</th>
                  <th className="px-4 py-3 text-center">CA3</th>
                  <th className="px-4 py-3 text-center">Exam</th>
                  <th className="px-4 py-3 text-center">Total</th>
                  <th className="px-4 py-3 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {academic.subjects.map((subject, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{subject.subject}</td>
                    <td className="px-4 py-3 text-center">{subject.ca1}</td>
                    <td className="px-4 py-3 text-center">{subject.ca2}</td>
                    <td className="px-4 py-3 text-center">{subject.ca3}</td>
                    <td className="px-4 py-3 text-center">{subject.exam}</td>
                    <td className="px-4 py-3 text-center font-bold">{subject.total}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-kora-primary">{subject.grade}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">No grades available yet</div>
        )}
      </div>
    </div>
  );
};

export default Academics;