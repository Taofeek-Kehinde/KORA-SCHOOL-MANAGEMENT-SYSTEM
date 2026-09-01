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
  FaUserGraduate,
  FaEnvelope,
  FaPhone,
  FaSearch,
  FaUsers,
} from 'react-icons/fa';
import StudentModal from './components/StudentModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const Students = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  // Fetch students
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['students', user?.schoolId, searchTerm],
    queryFn: async () => {
      const response = await api.get(`/students/schools/${user?.schoolId}/students`, {
        params: { search: searchTerm || undefined, limit: 100 }
      });
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (studentId) => {
      const response = await api.delete(`/students/schools/${user?.schoolId}/students/${studentId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Student deleted successfully');
      queryClient.invalidateQueries(['students', user?.schoolId]);
      setShowConfirm(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    }
  });

  const students = data?.data || [];
  const total = data?.pagination?.total || 0;

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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Students</h1>
          <p className="text-gray-500 mt-1">Manage all students in your school ({total})</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            onClick={() => {
              setSelectedStudent(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          >
            <FaPlus /> Add Student
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name or admission number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3 hidden md:table-cell">Admission</th>
                <th className="px-4 py-3 hidden lg:table-cell">Class</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    <FaUsers className="text-4xl mx-auto mb-2 text-gray-300" />
                    No students found
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <FaEnvelope className="text-[10px]" />
                          {student.email || 'No email'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-gray-600">
                      {student.admission_number}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-gray-600">
                      {student.classes?.name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmId(student.id);
                            setShowConfirm(true);
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showModal && (
        <StudentModal
          student={selectedStudent}
          schoolId={user?.schoolId}
          onClose={() => {
            setShowModal(false);
            setSelectedStudent(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['students', user?.schoolId]);
            refetch();
            setShowModal(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {showConfirm && (
        <ConfirmDialog
          title="Delete Student"
          message="Are you sure you want to delete this student? This action cannot be undone."
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

export default Students;