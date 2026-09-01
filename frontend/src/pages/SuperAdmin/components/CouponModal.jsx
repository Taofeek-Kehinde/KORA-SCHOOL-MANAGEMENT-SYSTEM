import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../utils/axios';
import { FaTimes, FaPercent, FaCalendarAlt, FaBuilding } from 'react-icons/fa';

const CouponModal = ({ coupon, onClose, onSuccess }) => {
  const isEditing = !!coupon;

  const [formData, setFormData] = useState({
    schoolId: '',
    code: '',
    discountPercentage: 10,
    description: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxUses: '',
    isActive: true
  });

  const { data: schoolsData } = useQuery({
    queryKey: ['allSchools'],
    queryFn: async () => {
      const response = await api.get('/admin/schools', { params: { limit: 1000 } });
      return response.data;
    }
  });

  useEffect(() => {
    if (coupon) {
      setFormData({
        schoolId: coupon.school_id || '',
        code: coupon.code || '',
        discountPercentage: coupon.discount_percentage || 10,
        description: coupon.description || '',
        validFrom: coupon.valid_from || '',
        validUntil: coupon.valid_until || '',
        maxUses: coupon.max_uses || '',
        isActive: coupon.is_active !== undefined ? coupon.is_active : true
      });
    }
  }, [coupon]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/admin/subscription/coupons', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Coupon created successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create coupon');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/admin/subscription/coupons/${coupon.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Coupon updated successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update coupon');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.code) {
      toast.error('Coupon code is required');
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Edit Coupon' : 'Create Coupon'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary font-mono uppercase"
                placeholder="e.g., DISCOUNT50"
                disabled={isEditing}
              />
              <p className="text-xs text-gray-400 mt-1">Code will be automatically uppercase</p>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                placeholder="What is this coupon for?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FaBuilding className="inline mr-1" />
                School (Optional)
              </label>
              <select
                name="schoolId"
                value={formData.schoolId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
              >
                <option value="">All Schools</option>
                {(schoolsData?.data || []).map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
              <input
                type="number"
                name="maxUses"
                value={formData.maxUses}
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
              {isLoading ? 'Saving...' : (isEditing ? 'Update Coupon' : 'Create Coupon')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CouponModal;