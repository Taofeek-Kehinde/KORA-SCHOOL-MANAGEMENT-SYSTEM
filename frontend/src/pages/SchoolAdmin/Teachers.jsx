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
  FaUser,
  FaEnvelope,
  FaPhone,
  FaGraduationCap,
  FaSearch,
} from 'react-icons/fa';
import TeacherModal from './components/TeacherModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const Teachers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  // Fetch teachers
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['teachers', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/teachers/schools/${user?.schoolId}/teachers`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (teacherId) => {
      const response = await api.delete(`/teachers/schools/${user?.schoolId}/teachers/${teacherId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Teacher deleted successfully');
      queryClient.invalidateQueries(['teachers', user?.schoolId]);
      setShowConfirm(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete teacher');
    }
  });

  const teachers = data?.data || [];

  const filteredTeachers = teachers.filter(teacher =>
    teacher.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-3xl text-kora-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Teachers</h1>
          <p className="text-gray-500 mt-1">Manage all teachers in your school</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            onClick={() => {
              setSelectedTeacher(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          >
            <FaPlus /> Add Teacher
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
            <FaUser className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Teachers Found</h3>
            <p className="text-gray-500">Click "Add Teacher" to get started</p>
          </div>
        ) : (
          filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-kora-primary/10 flex items-center justify-center">
                    <FaUser className="text-kora-primary text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {teacher.first_name} {teacher.last_name}
                    </h4>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <FaEnvelope className="text-xs" /> {teacher.email}
                    </p>
                    {teacher.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <FaPhone className="text-xs" /> {teacher.phone}
                      </p>
                    )}
                    {teacher.specialization && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <FaGraduationCap className="text-xs" /> {teacher.specialization}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setShowModal(true);
                    }}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => {
                      setConfirmId(teacher.id);
                      setShowConfirm(true);
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <TeacherModal
          teacher={selectedTeacher}
          schoolId={user?.schoolId}
          onClose={() => {
            setShowModal(false);
            setSelectedTeacher(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['teachers', user?.schoolId]);
            refetch();
            setShowModal(false);
            setSelectedTeacher(null);
          }}
        />
      )}

      {/* Confirm Dialog */}
      {showConfirm && (
        <ConfirmDialog
          title="Delete Teacher"
          message="Are you sure you want to delete this teacher? This action cannot be undone."
          type="danger"
          onConfirm={() => deleteMutation.mutate(confirmId)}
          onCancel={() => {
            setShowConfirm(false);
            setConfirmId(null);
          }}
          isLoading={deleteMutation.isLoading}
        />
      )}
    </div>
  );
};

export default Teachers;