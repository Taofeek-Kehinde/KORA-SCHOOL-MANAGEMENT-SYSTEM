import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import {
  FaTimes,
  FaSpinner,
  FaCheck,
  FaGlobe,
  FaImage,
  FaPalette,
  FaPaintBrush,
  FaEye,
  FaExternalLinkAlt,
  FaCopy,
  FaSchool,
} from 'react-icons/fa';

const WhiteLabelConfig = ({ schoolId, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    customDomain: '',
    customLogo: '',
    customColours: {
      primary: '#4F46E5',
      secondary: '#7C3AED'
    },
    customLoginPage: false,
    useSchoolLogo: true
  });
  const [logoPreview, setLogoPreview] = useState(null);

  // Fetch white label config
  const { data, isLoading } = useQuery({
    queryKey: ['whiteLabel', schoolId],
    queryFn: async () => {
      if (!schoolId) return { data: {} };
      const response = await api.get(`/white-label/schools/${schoolId}/white-label`);
      return response.data;
    },
    enabled: !!schoolId,
  });

  // Update white label mutation
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (!schoolId) throw new Error('School ID not found');
      const response = await api.put(`/white-label/schools/${schoolId}/white-label`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('White label configuration updated successfully');
      queryClient.invalidateQueries(['whiteLabel', schoolId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update configuration');
    }
  });

  useEffect(() => {
    if (data?.data) {
      const config = data.data;
      setFormData({
        customDomain: config.custom_domain || '',
        customLogo: config.custom_logo || '',
        customColours: config.custom_colours || { primary: '#4F46E5', secondary: '#7C3AED' },
        customLoginPage: config.custom_login_page || false,
        useSchoolLogo: config.use_school_logo !== undefined ? config.use_school_logo : true
      });
      setLogoPreview(config.custom_logo || config.default_logo);
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleColourChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      customColours: { ...prev.customColours, [name]: value }
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setFormData(prev => ({ ...prev, customLogo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-xl max-w-2xl w-full p-8 text-center">
          <FaSpinner className="animate-spin text-3xl text-kora-primary mx-auto" />
          <p className="text-gray-500 mt-2">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">White Label Configuration</h3>
            <p className="text-sm text-gray-500">Customize the platform for your school</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Custom Domain */}
          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <FaGlobe className="text-kora-primary" />
              Custom Domain
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Domain URL
                </label>
                <input
                  type="text"
                  name="customDomain"
                  value={formData.customDomain}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="portal.yourschool.com"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter your custom domain (e.g., portal.yourschool.com)
                </p>
              </div>
            </div>
          </div>

          {/* Custom Logo */}
          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <FaImage className="text-kora-primary" />
              Custom Logo
            </h4>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Custom Logo" className="w-full h-full object-contain" />
                ) : (
                  <FaImage className="text-3xl text-gray-300" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="logoUpload"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="logoUpload"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer inline-block"
                >
                  Upload Logo
                </label>
                <p className="text-xs text-gray-400 mt-1">Recommended: 500x500px PNG</p>
              </div>
            </div>
          </div>

          {/* Custom Colours */}
          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <FaPalette className="text-kora-primary" />
              Custom Colours
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Colour</label>
                <input
                  type="color"
                  name="primary"
                  value={formData.customColours?.primary || '#4F46E5'}
                  onChange={handleColourChange}
                  className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Colour</label>
                <input
                  type="color"
                  name="secondary"
                  value={formData.customColours?.secondary || '#7C3AED'}
                  onChange={handleColourChange}
                  className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Custom Login Page */}
          <div className="border-b border-gray-200 pb-4">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <FaPaintBrush className="text-kora-primary" />
              Custom Login Page
            </h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="customLoginPage"
                  checked={formData.customLoginPage}
                  onChange={handleChange}
                  className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
                />
                <span className="text-sm text-gray-700">Enable custom login page</span>
              </label>
              <p className="text-xs text-gray-400">
                The custom login page will reflect your school's branding and colours.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isLoading}
              className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
            >
              {updateMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WhiteLabelConfig;