import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaSpinner, FaCheck, FaTimes, FaGraduationCap, FaUserGraduate, FaUsers, FaArrowRight
} from 'react-icons/fa';

const Enrollment = () => {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    classId: '',
    studentStatus: 'active',
    boardingStatus: 'day'
  });

  // Fetch application
  const { data: appData, isLoading } = useQuery({
    queryKey: ['applicationForEnrollment', applicationId],
    queryFn: async () => {
      const response = await api.get(`/admissions/schools/${user?.schoolId}/applications/${applicationId}`);
      return response.data;
    },
    enabled: !!applicationId,
  });

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classesForEnrollment', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${user?.schoolId}/classes`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Enroll student mutation
  const enrollMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/admissions/schools/${user?.schoolId}/applications/${applicationId}/enroll`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Student enrolled successfully!');
      navigate('/admissions/dashboard');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to enroll student');
    }
  });

  const application = appData?.data;
  const classes = classesData?.data || [];

  const handleEnroll = (e) => {
    e.preventDefault();
    if (!formData.classId) {
      toast.error('Please select a class');
      return;
    }
    enrollMutation.mutate({
      ...formData,
      applicationId
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-kora-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Enroll Student</h1>
        <p className="text-gray-500 mt-1">Complete the enrollment for this approved application</p>
      </div>

      {application && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <FaGraduationCap className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {application.student_first_name} {application.student_last_name}
              </p>
              <p className="text-sm text-gray-500">{application.application_number}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-400">Parent:</span> {application.parent_name}</div>
            <div><span className="text-gray-400">Class:</span> {application.classes?.name || 'N/A'}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleEnroll} className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Enrollment Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Class *</label>
            <select
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Status</label>
            <select
              value={formData.studentStatus}
              onChange={(e) => setFormData({ ...formData, studentStatus: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Boarding Status</label>
            <select
              value={formData.boardingStatus}
              onChange={(e) => setFormData({ ...formData, boardingStatus: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            >
              <option value="day">Day Student</option>
              <option value="boarding">Boarding Student</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admissions/dashboard')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={enrollMutation.isLoading}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
          >
            {enrollMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
            Enroll Student
          </button>
        </div>
      </form>
    </div>
  );
};

export default Enrollment;