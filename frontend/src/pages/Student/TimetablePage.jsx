import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { FaSpinner, FaClock } from 'react-icons/fa';

const TimetablePage = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['studentTimetable', user?.studentId],
    queryFn: async () => {
      const response = await api.get(`/student-dashboard/students/${user?.studentId}/dashboard`);
      return response.data;
    },
    enabled: !!user?.studentId,
  });

  const timetable = data?.data?.timetable || [];
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Timetable</h1>
        <p className="text-gray-500 mt-1">Your weekly timetable</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timetable.map((day) => (
          <div key={day.day} className={`bg-white rounded-xl shadow-md p-4 ${day.day === currentDay ? 'border-2 border-kora-primary' : ''}`}>
            <h3 className={`font-semibold mb-3 ${day.day === currentDay ? 'text-kora-primary' : 'text-gray-800'}`}>
              {day.day}
              {day.day === currentDay && (
                <span className="ml-2 text-xs bg-kora-primary text-white px-2 py-0.5 rounded-full">Today</span>
              )}
            </h3>
            {day.periods.length > 0 ? (
              <div className="space-y-2">
                {day.periods.map((period, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-gray-400 w-20">
                      {period.startTime}-{period.endTime}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800">{period.subject}</p>
                      <p className="text-xs text-gray-500">{period.teacher}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No classes</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimetablePage;