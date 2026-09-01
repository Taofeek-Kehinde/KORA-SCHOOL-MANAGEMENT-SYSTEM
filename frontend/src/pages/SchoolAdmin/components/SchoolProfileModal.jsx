import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import { FaTimes, FaSpinner, FaCheck, FaPalette, FaQuoteRight, FaPen, FaFileAlt } from 'react-icons/fa';

const SchoolProfileModal = ({ profile, schoolId, onClose, onSuccess }) => {
  const isEditing = !!profile;

  const [formData, setFormData] = useState({
    schoolColours: { primary: '#4F46E5', secondary: '#7C3AED', accent: '#10B981' },
    motto: '',
    signature: '',
    reportCardDesign: { template: 'default', showLogo: true, showMotto: true }
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        schoolColours: profile.school_colours || { primary: '#4F46E5', secondary: '#7C3AED', accent: '#10B981' },
        motto: profile.motto || '',
        signature: profile.signature_url || '',
        reportCardDesign: profile.report_card_design || { template: 'default', showLogo: true, showMotto: true }
      });
    }
  }, [profile]);

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
      schoolColours: { ...prev.schoolColours, [name]: value }
    }));
  };

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/academic/schools/${schoolId}/profile`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('School profile updated successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update school profile');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const isLoading = updateMutation.isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">School Profile Settings</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* School Colours */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FaPalette className="text-kora-primary" />
                School Colours
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Primary</label>
                  <input
                    type="color"
                    name="primary"
                    value={formData.schoolColours.primary}
                    onChange={handleColourChange}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Secondary</label>
                  <input
                    type="color"
                    name="secondary"
                    value={formData.schoolColours.secondary}
                    onChange={handleColourChange}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Accent</label>
                  <input
                    type="color"
                    name="accent"
                    value={formData.schoolColours.accent}
                    onChange={handleColourChange}
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Motto */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FaQuoteRight className="text-kora-primary" />
                School Motto
              </h4>
              <input
                type="text"
                name="motto"
                value={formData.motto}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                placeholder="e.g., Excellence in Education"
              />
            </div>

            {/* Signature */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FaPen className="text-kora-primary" />
                School Signature
              </h4>
              <input
                type="text"
                name="signature"
                value={formData.signature}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                placeholder="Signature image URL"
              />
            </div>

            {/* Report Card Design */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FaFileAlt className="text-kora-primary" />
                Report Card Design
              </h4>
              <div className="space-y-2">
                <select
                  name="template"
                  value={formData.reportCardDesign.template}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    reportCardDesign: { ...prev.reportCardDesign, template: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                >
                  <option value="default">Default</option>
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                  <option value="minimal">Minimal</option>
                </select>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.reportCardDesign.showLogo}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      reportCardDesign: { ...prev.reportCardDesign, showLogo: e.target.checked }
                    }))}
                    className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
                  />
                  <span className="text-sm text-gray-700">Show Logo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.reportCardDesign.showMotto}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      reportCardDesign: { ...prev.reportCardDesign, showMotto: e.target.checked }
                    }))}
                    className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
                  />
                  <span className="text-sm text-gray-700">Show Motto</span>
                </label>
              </div>
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolProfileModal;