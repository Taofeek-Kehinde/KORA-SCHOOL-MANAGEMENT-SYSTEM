import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import api from "../utils/api";
import { FaSpinner } from "react-icons/fa";
import HomeworkSubmitModal from '../components/HomeworkSubmitModal';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [selectedHomework, setSelectedHomework] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['studentDashboard', user?.studentId],
    queryFn: async () => {
      if (!user?.studentId) return { data: {} };
      const response = await api.get(`/student-dashboard/students/${user?.studentId}/dashboard`);
      return response.data;
    },
    enabled: !!user?.studentId,
  });

  const { data: homeworkData } = useQuery({
    queryKey: ['studentHomework', user?.studentId],
    queryFn: async () => {
      const response = await api.get(`/homework/students/${user?.studentId}/homework`);
      return response.data;
    },
    enabled: !!user?.studentId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-kora-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h3 className="text-xl font-semibold text-gray-700">Failed to Load</h3>
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  const studentHomework = homeworkData?.data || [];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 min-w-0 overflow-x-clip">
      {/* This page is now just a placeholder - use sidebar to navigate */}
      <div className="text-center py-12 text-gray-400">
        <p>Use the sidebar to navigate to different sections</p>
      </div>

      {/* Homework Submit Modal */}
      {selectedHomework && (
        <HomeworkSubmitModal
          homeworkEntry={selectedHomework}
          studentId={user?.studentId}
          onClose={() => setSelectedHomework(null)}
        />
      )}
    </div>
  );
};

export default StudentDashboard;