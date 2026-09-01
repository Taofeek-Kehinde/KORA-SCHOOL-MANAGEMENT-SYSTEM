import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import { FaTimes, FaSpinner, FaCheck } from 'react-icons/fa';

const GradingModal = ({ rule, schoolId, onClose, onSuccess }) => {
  const isEditing = !!rule;

  const [formData, setFormData] = useState({
    grade: '',
    minScore: '',
    maxScore: '',
    description: '',
    isPass: true
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        grade: rule.grade || '',
        minScore: rule.min_score || '',
        maxScore: rule.max_score || '',
        description: rule.description || '',
        isPass: rule.is_pass !== undefined ? rule.is_pass : true
      });
    }
  }, [rule]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/academic/schools/${schoolId}/grading`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Grading rule created successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create grading rule');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/academic/schools/${schoolId}/grading/${rule.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Grading rule updated successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update grading rule');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.grade || !formData.minScore || !formData.maxScore) {
      toast.error('Grade, min score, and max score are required');
      return;
    }
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Edit Grading Rule' : 'Add Grading Rule'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                placeholder="e.g., A, B, C"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Score *</label>
                <input
                  type="number"
                  name="minScore"
                  value={formData.minScore}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Score *</label>
                <input
                  type="number"
                  name="maxScore"
                  value={formData.maxScore}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                placeholder="e.g., Excellent performance"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isPass"
                  checked={formData.isPass}
                  onChange={handleChange}
                  className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
                />
                <span className="text-sm text-gray-700">Passing Grade</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
              {isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradingModal;