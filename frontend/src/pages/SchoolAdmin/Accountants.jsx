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
  FaSearch,
  FaUserTie,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaTimes,
  FaCheck,
  FaMoneyBillWave,
} from 'react-icons/fa';

const Accountants = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedAccountant, setSelectedAccountant] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    position: 'Accountant',
    department: 'Finance'
  });

  // ✅ Fetch accountants using useQuery
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['accountants', user?.schoolId, searchTerm],
    queryFn: async () => {
      const response = await api.get(`/accountants/schools/${user?.schoolId}/accountants`, {
        params: { search: searchTerm, limit: 100 }
      });
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // ✅ Create accountant using useMutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/accountants/schools/${user?.schoolId}/accountants`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Accountant created! Temp Password: ${data.data.temp_password}`);
      queryClient.invalidateQueries(['accountants', user?.schoolId]);
      setShowModal(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create accountant');
    }
  });

  // ✅ Update accountant using useMutation
  const updateMutation = useMutation({
    mutationFn: async ({ accountantId, data }) => {
      const response = await api.put(`/accountants/schools/${user?.schoolId}/accountants/${accountantId}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Accountant updated successfully');
      queryClient.invalidateQueries(['accountants', user?.schoolId]);
      setShowModal(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update accountant');
    }
  });

  // ✅ Delete accountant using useMutation
  const deleteMutation = useMutation({
    mutationFn: async (accountantId) => {
      const response = await api.delete(`/accountants/schools/${user?.schoolId}/accountants/${accountantId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Accountant deleted successfully');
      queryClient.invalidateQueries(['accountants', user?.schoolId]);
      setShowConfirm(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete accountant');
    }
  });

  const accountants = data?.data || [];

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      position: 'Accountant',
      department: 'Finance'
    });
  };

  const handleOpenModal = (accountant = null) => {
    if (accountant) {
      setSelectedAccountant(accountant);
      setFormData({
        firstName: accountant.first_name || '',
        lastName: accountant.last_name || '',
        email: accountant.email || '',
        password: '',
        phone: accountant.phone || '',
        position: accountant.position || 'Accountant',
        department: accountant.department || 'Finance'
      });
    } else {
      setSelectedAccountant(null);
      resetForm();
    }
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!selectedAccountant && !formData.password) {
      toast.error('Password is required for new accountant');
      return;
    }
    if (selectedAccountant) {
      updateMutation.mutate({ accountantId: selectedAccountant.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (accountantId) => {
    setConfirmId(accountantId);
    setShowConfirm(true);
  };

  const confirmDelete = () => {
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Accountants</h1>
          <p className="text-gray-500 mt-1">Manage school accountants</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          >
            <FaPlus />
            Add Accountant
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search accountants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
      </div>

      {/* Accountants List */}
      {accountants.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaUserTie className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Accountants Found</h3>
          <p className="text-gray-500 mb-4">Click "Add Accountant" to create your first accountant</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountants.map((accountant) => (
            <div key={accountant.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <FaUserTie className="text-green-600 text-xl" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {accountant.first_name} {accountant.last_name}
                    </h4>
                    <p className="text-xs text-gray-500">{accountant.position || 'Accountant'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenModal(accountant)}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(accountant.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <FaEnvelope className="text-gray-400" />
                  {accountant.email}
                </p>
                {accountant.phone && (
                  <p className="flex items-center gap-2">
                    <FaPhone className="text-gray-400" />
                    {accountant.phone}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <FaBriefcase className="text-gray-400" />
                  {accountant.department || 'Finance'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedAccountant ? 'Edit Accountant' : 'Add Accountant'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                </div>

                {!selectedAccountant && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input
                      type="text"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                      placeholder="Set a temporary password"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  {selectedAccountant ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Delete Accountant</h3>
            <p className="text-gray-500 mb-4">Are you sure you want to delete this accountant?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
              >
                {deleteMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accountants;