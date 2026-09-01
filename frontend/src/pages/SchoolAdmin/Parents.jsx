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
  FaUserFriends,
  FaEnvelope,
  FaPhone,
  FaSearch,
  FaUsers,
  FaChild,
} from 'react-icons/fa';
import ParentModal from './components/ParentModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const Parents = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  // Fetch parents
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['parents', user?.schoolId, searchTerm],
    queryFn: async () => {
      const response = await api.get(`/parents/schools/${user?.schoolId}/parents`, {
        params: { search: searchTerm || undefined, limit: 100 }
      });
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (parentId) => {
      const response = await api.delete(`/parents/schools/${user?.schoolId}/parents/${parentId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Parent deleted successfully');
      queryClient.invalidateQueries(['parents', user?.schoolId]);
      setShowConfirm(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete parent');
    }
  });

  const parents = data?.data || [];
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Parents</h1>
          <p className="text-gray-500 mt-1">Manage all parents ({total})</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            onClick={() => {
              setSelectedParent(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          >
            <FaPlus /> Add Parent
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search parents by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3 hidden md:table-cell">Contact</th>
                <th className="px-4 py-3 hidden lg:table-cell">Children</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {parents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                    <FaUsers className="text-4xl mx-auto mb-2 text-gray-300" />
                    No parents found
                  </td>
                </tr>
              ) : (
                parents.map((parent) => (
                  <tr key={parent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">
                          {parent.first_name} {parent.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{parent.relationship || 'Guardian'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-sm text-gray-600">
                        <p className="flex items-center gap-1">
                          <FaEnvelope className="text-xs" /> {parent.email}
                        </p>
                        <p className="flex items-center gap-1">
                          <FaPhone className="text-xs" /> {parent.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {parent.children?.map((child, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                            {child.students?.first_name} {child.students?.last_name}
                          </span>
                        ))}
                        {(!parent.children || parent.children.length === 0) && (
                          <span className="text-xs text-gray-400">No children linked</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedParent(parent);
                            setShowModal(true);
                          }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmId(parent.id);
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

      {showModal && (
        <ParentModal
          parent={selectedParent}
          schoolId={user?.schoolId}
          onClose={() => {
            setShowModal(false);
            setSelectedParent(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries(['parents', user?.schoolId]);
            refetch();
            setShowModal(false);
            setSelectedParent(null);
          }}
        />
      )}

      {showConfirm && (
        <ConfirmDialog
          title="Delete Parent"
          message="Are you sure you want to delete this parent?"
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

export default Parents;