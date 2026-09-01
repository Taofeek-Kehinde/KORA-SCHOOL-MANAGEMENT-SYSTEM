import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../utils/axios';
import { FaTimes, FaMoneyBillWave, FaClock, FaPercent, FaCalendarAlt } from 'react-icons/fa';

const SubscriptionPlanModal = ({ plan, onClose, onSuccess }) => {
  const isEditing = !!plan;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerStudent: 800,
    billingFrequency: 'monthly',
    freeTrialDays: 14,
    gracePeriodDays: 7,
    features: {},
    isActive: true
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        pricePerStudent: plan.price_per_student || 800,
        billingFrequency: plan.billing_frequency || 'monthly',
        freeTrialDays: plan.free_trial_days || 14,
        gracePeriodDays: plan.grace_period_days || 7,
        features: plan.features || {},
        isActive: plan.is_active !== undefined ? plan.is_active : true
      });
    }
  }, [plan]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/admin/subscription/plans', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Plan created successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create plan');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/admin/subscription/plans/${plan.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Plan updated successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update plan');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                placeholder="e.g., Premium Plan"
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
                placeholder="Plan description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaMoneyBillWave className="inline mr-1" />
                  Price per Student (₦) *
                </label>
                <input
                  type="number"
                  name="pricePerStudent"
                  value={formData.pricePerStudent}
                  onChange={handleChange}
                  required
                  min="0"
                  step="50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaClock className="inline mr-1" />
                  Billing Frequency *
                </label>
                <select
                  name="billingFrequency"
                  value={formData.billingFrequency}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                >
                  <option value="monthly">Monthly</option>
                  <option value="termly">Termly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaCalendarAlt className="inline mr-1" />
                  Free Trial (Days)
                </label>
                <input
                  type="number"
                  name="freeTrialDays"
                  value={formData.freeTrialDays}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FaCalendarAlt className="inline mr-1" />
                  Grace Period (Days)
                </label>
                <input
                  type="number"
                  name="gracePeriodDays"
                  value={formData.gracePeriodDays}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                />
              </div>
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
              {isLoading ? 'Saving...' : (isEditing ? 'Update Plan' : 'Create Plan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionPlanModal;