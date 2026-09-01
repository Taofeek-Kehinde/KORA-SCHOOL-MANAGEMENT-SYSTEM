import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaBuilding,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaUsers,
  FaChalkboardTeacher,
  FaUserTie,
  FaChartBar,
  FaEye,
  FaUniversity,
  FaMapMarker,
  FaPhone,
  FaEnvelope,
  FaUser,
  FaStar,
  FaSchool,
} from 'react-icons/fa';

import WhiteLabelConfig from './components/WhiteLabelConfig';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const Campuses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId; // Get schoolId from user

  const [showModal, setShowModal] = useState(false);
  const [showWhiteLabel, setShowWhiteLabel] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editingCampus, setEditingCampus] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    principalName: '',
    isMain: false
  });

  // Fetch campuses - ONLY if schoolId exists
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['campuses', schoolId],
    queryFn: async () => {
      if (!schoolId) return { data: [] };
      const response = await api.get(`/campuses/schools/${schoolId}/campuses`);
      return response.data;
    },
    enabled: !!schoolId,
  });

  // Create campus mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (!schoolId) throw new Error('School ID not found');
      const payload = {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        principalName: data.principalName,
        isMainCampus: !!data.isMain
      };
      const response = await api.post(`/campuses/schools/${schoolId}/campuses`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Campus created successfully');
      queryClient.invalidateQueries(['campuses', schoolId]);
      setShowModal(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create campus');
    }
  });

  // Update campus mutation
  const updateMutation = useMutation({
    mutationFn: async ({ campusId, data }) => {
      if (!schoolId) throw new Error('School ID not found');
      const payload = {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        principalName: data.principalName,
        isMainCampus: data.isMain === true
      };
      const response = await api.put(`/campuses/schools/${schoolId}/campuses/${campusId}`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Campus updated successfully');
      queryClient.invalidateQueries(['campuses', schoolId]);
      setShowModal(false);
      setEditingCampus(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update campus');
    }
  });

  // Delete campus mutation
  const deleteMutation = useMutation({
    mutationFn: async (campusId) => {
      if (!schoolId) throw new Error('School ID not found');
      const response = await api.delete(`/campuses/schools/${schoolId}/campuses/${campusId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Campus deleted successfully');
      queryClient.invalidateQueries(['campuses', schoolId]);
      setShowConfirm(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete campus');
    }
  });

  const campuses = data?.data || [];

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      principalName: '',
      isMain: false
    });
  };

  const handleOpenModal = (campus = null) => {
    if (campus) {
      setEditingCampus(campus);
      setFormData({
        name: campus.name || '',
        address: campus.address || '',
        phone: campus.phone || '',
        email: campus.email || '',
        principalName: campus.principal_name || '',
        isMain: campus.is_main_campus || false
      });
    } else {
      setEditingCampus(null);
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Campus name is required');
      return;
    }
    if (editingCampus) {
      updateMutation.mutate({ campusId: editingCampus.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (campusId) => {
    setConfirmId(campusId);
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(confirmId);
  };

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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Multi-Campus Management</h1>
          <p className="text-gray-500 mt-1">Manage all campuses and view consolidated reports</p>
        </div>
        <div className="flex flex-wrap gap-3 mt-3 md:mt-0">
  <button
    onClick={() => setShowWhiteLabel(true)}
    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
  >
    <FaSchool />
    White Label
  </button>
  <button
    onClick={() => toast('Consolidated report feature coming soon')}
    className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
  >
    <FaChartBar />
    Consolidated Report
  </button>
  <button
    onClick={() => handleOpenModal()}
    className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
  >
    <FaPlus />
    Add Campus
  </button>
</div>
      </div>

      {/* Campuses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campuses.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl shadow-md p-12 text-center">
            <FaUniversity className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Campuses Yet</h3>
            <p className="text-gray-500 mb-4">Click "Add Campus" to create your first campus</p>
          </div>
        ) : (
          campuses.map((campus) => (
            <div key={campus.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className={`p-4 ${campus.is_main_campus ? 'bg-kora-primary/10' : 'bg-gray-50'} border-b border-gray-200`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <FaBuilding className="text-kora-primary" />
                      <h3 className="font-semibold text-gray-800">{campus.name}</h3>
                      {campus.is_main_campus && (
                        <span className="flex items-center gap-1 text-xs bg-kora-primary text-white px-2 py-0.5 rounded-full">
                          <FaStar className="text-[10px]" />
                          Main
                        </span>
                      )}
                    </div>
                    {campus.principal_name && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <FaUser className="text-xs" />
                        {campus.principal_name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(campus)}
                      className="p-1.5 text-yellow-500 hover:bg-yellow-50 rounded-lg"
                      title="Edit Campus"
                    >
                      <FaEdit />
                    </button>
                    {!campus.is_main_campus && (
                      <button
                        onClick={() => handleDelete(campus.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        title="Delete Campus"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-2">
                {campus.address && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <FaMapMarker className="text-gray-400 text-xs" />
                    {campus.address}
                  </p>
                )}
                {campus.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <FaPhone className="text-gray-400 text-xs" />
                    {campus.phone}
                  </p>
                )}
                {campus.email && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <FaEnvelope className="text-gray-400 text-xs" />
                    {campus.email}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Campus Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingCampus ? 'Edit Campus' : 'Add New Campus'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingCampus(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campus Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    placeholder="e.g., Ibadan Campus"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    placeholder="123 Education Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    placeholder="08012345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    placeholder="campus@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Principal Name</label>
                  <input
                    type="text"
                    value={formData.principalName}
                    onChange={(e) => setFormData(prev => ({ ...prev, principalName: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    placeholder="Dr. John Smith"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isMain}
                      onChange={(e) => setFormData(prev => ({ ...prev, isMain: e.target.checked }))}
                      className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
                    />
                    <span className="text-sm text-gray-700">Set as Main Campus</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCampus(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
                >
                  {(createMutation.isLoading || updateMutation.isLoading) ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  {editingCampus ? 'Update Campus' : 'Create Campus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* White Label Config Modal */}
      {showWhiteLabel && schoolId && (
        <WhiteLabelConfig
          schoolId={schoolId}
          onClose={() => setShowWhiteLabel(false)}
        />
      )}

      {/* Confirm Dialog */}
      {showConfirm && (
        <ConfirmDialog
          title="Delete Campus"
          message="Are you sure you want to delete this campus? This action cannot be undone."
          type="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirm(false)}
          isLoading={deleteMutation.isLoading}
        />
      )}
    </div>
  );
};

export default Campuses;