import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../utils/axios';
import { FaTimes, FaPercent, FaCalendarAlt, FaBuilding } from 'react-icons/fa';

const PromoCampaignModal = ({ campaign, onClose, onSuccess }) => {
  const isEditing = !!campaign;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountPercentage: 15,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    targetSchoolTypes: [],
    maxSchools: '',
    isActive: true
  });

  const schoolTypeOptions = [
    { value: 'nursery', label: 'Nursery' },
    { value: 'primary', label: 'Primary' },
    { value: 'junior_secondary', label: 'Junior Secondary' },
    { value: 'senior_secondary', label: 'Senior Secondary' },
    { value: 'combined', label: 'Combined' },
    { value: 'faith_based', label: 'Faith Based' },
    { value: 'international', label: 'International' },
    { value: 'government', label: 'Government' },
    { value: 'private', label: 'Private' },
  ];

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
        discountPercentage: campaign.discount_percentage || 15,
        validFrom: campaign.valid_from || '',
        validUntil: campaign.valid_until || '',
        targetSchoolTypes: campaign.target_school_types || [],
        maxSchools: campaign.max_schools || '',
        isActive: campaign.is_active !== undefined ? campaign.is_active : true
      });
    }
  }, [campaign]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTypeToggle = (type) => {
    setFormData(prev => {
      const current = prev.targetSchoolTypes || [];
      if (current.includes(type)) {
        return { ...prev, targetSchoolTypes: current.filter(t => t !== type) };
      } else {
        return { ...prev, targetSchoolTypes: [...current, type] };
      }
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/admin/subscription/promo-campaigns', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Campaign created successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/admin/subscription/promo-campaigns/${campaign.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Campaign updated successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update campaign');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Campaign name is required');
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
      <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Edit Promo Campaign' : 'Create Promo Campaign'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                placeholder="e.g., Back to School Promo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                placeholder="Campaign description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaPercent className="inline mr-1" />
                Discount Percentage *
              </label>
              <input
                type="number"
                name="discountPercentage"
                value={formData.discountPercentage}
                onChange={handleChange}
                required
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaCalendarAlt className="inline mr-1" />
                  Valid From *
                </label>
                <input
                  type="date"
                  name="validFrom"
                  value={formData.validFrom}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaCalendarAlt className="inline mr-1" />
                  Valid Until *
                </label>
                <input
                  type="date"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaBuilding className="inline mr-1" />
                Target School Types
              </label>
              <div className="flex flex-wrap gap-2">
                {schoolTypeOptions.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeToggle(type.value)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      (formData.targetSchoolTypes || []).includes(type.value)
                        ? 'bg-kora-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Select specific school types or leave all selected for all types</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Schools</label>
              <input
                type="number"
                name="maxSchools"
                value={formData.maxSchools}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                placeholder="Leave empty for unlimited"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
                />
                <span className="text-sm text-gray-700">Active</span>
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
              className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : (isEditing ? 'Update Campaign' : 'Create Campaign')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromoCampaignModal;