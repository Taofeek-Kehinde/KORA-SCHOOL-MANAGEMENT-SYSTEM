import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { FaSpinner, FaUser, FaEnvelope, FaPhone, FaBriefcase } from 'react-icons/fa';

const ParentsPage = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['studentParents', user?.studentId],
    queryFn: async () => {
      const response = await api.get(`/student-dashboard/students/${user?.studentId}/dashboard`);
      return response.data;
    },
    enabled: !!user?.studentId,
  });

  const parents = data?.data?.parentDetails?.parents || [];

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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Parents / Guardians</h1>
        <p className="text-gray-500 mt-1">Your parent/guardian information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parents.length > 0 ? (
          parents.map((parent) => (
            <div key={parent.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-kora-primary/10 flex items-center justify-center">
                  <FaUser className="text-kora-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{parent.firstName} {parent.lastName}</p>
                  <p className="text-xs text-gray-500">{parent.relationship}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <FaEnvelope className="text-gray-400" /> {parent.email || 'N/A'}
                </p>
                <p className="flex items-center gap-2">
                  <FaPhone className="text-gray-400" /> {parent.phone || 'N/A'}
                </p>
                {parent.occupation && (
                  <p className="flex items-center gap-2">
                    <FaBriefcase className="text-gray-400" /> {parent.occupation}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-400">
            <FaUser className="text-4xl mx-auto mb-2 text-gray-300" />
            No parent information available
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentsPage;