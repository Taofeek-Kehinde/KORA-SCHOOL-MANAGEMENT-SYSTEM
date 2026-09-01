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
  FaBriefcase,
  FaSearch,
} from 'react-icons/fa';
import StaffModal from './components/StaffModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const Staff = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['staff', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/staff/schools/${user?.schoolId}/staff`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (staffId) => {
      const response = await api.delete(`/staff/schools/${user?.schoolId}/staff/${staffId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Staff deleted successfully');
      queryClient.invalidateQueries(['staff', user?.schoolId]);
      setShowConfirm(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete staff');
    }
  });

  const staff = data?.data || [];

  const filteredStaff = staff.filter(item =>
    item.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.position.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Staff</h1>
          <p className="text-gray-500 mt-1">Manage all non-teaching staff</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            onClick={() => {
              setSelectedStaff(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          >
            <FaPlus /> Add Staff
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
            <FaUser className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Staff Found</h3>
            <p className="text-gray-500">Click "Add Staff" to get started</p>
          </div>
        ) : (
          filteredStaff.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <FaUser className="text-purple-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {item.first_name} {item.last_name}
                    </h4>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <FaBriefcase className="text-xs" /> {item.position}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <FaEnvelope className="text-xs" /> {item.email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setSelectedStaff(item);
                      setShowModal(true);
                    }}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => {
                      setConfirmId(item.id);
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

      {showModal && (
        <StaffModal
          staff={selectedStaff}
          schoolId={user?.schoolId}
          onClose={() => {
            setShowModal(false);
            setSelectedStaff(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['staff', user?.schoolId]);
            refetch();
            setShowModal(false);
            setSelectedStaff(null);
          }}
        />
      )}

      {showConfirm && (
        <ConfirmDialog
          title="Delete Staff"
          message="Are you sure you want to delete this staff member?"
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

export default Staff;