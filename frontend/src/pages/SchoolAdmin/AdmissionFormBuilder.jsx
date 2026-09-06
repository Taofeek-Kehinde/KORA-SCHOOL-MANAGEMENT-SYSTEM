import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaPlus, FaTrash, FaSpinner, FaSave, FaArrowUp, FaArrowDown,
  FaCheck, FaTimes, FaEdit, FaGripVertical
} from 'react-icons/fa';

const AdmissionFormBuilder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formFields, setFormFields] = useState([]);
  const [settings, setSettings] = useState({
    acceptanceFeeEnabled: false,
    acceptanceFeeAmount: 0,
    entranceExamEnabled: false,
    interviewEnabled: false,
    capacityQuotas: {},
    maxApplicationsPerParent: 5
  });

  // Fetch current settings
  const { data: settingsData } = useQuery({
    queryKey: ['admissionSettings', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/admission-forms/schools/${user?.schoolId}/settings`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const defaultFields = [
    { id: 'studentFirstName', label: 'First Name', type: 'text', required: true, enabled: true },
    { id: 'studentLastName', label: 'Last Name', type: 'text', required: true, enabled: true },
    { id: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, enabled: true },
    { id: 'gender', label: 'Gender', type: 'select', required: true, enabled: true },
    { id: 'classApplyingFor', label: 'Class Applying For', type: 'select', required: true, enabled: true },
    { id: 'previousSchool', label: 'Previous School', type: 'text', required: false, enabled: true },
    { id: 'stateOfOrigin', label: 'State of Origin', type: 'text', required: false, enabled: true },
    { id: 'parentName', label: 'Parent Name', type: 'text', required: true, enabled: true },
    { id: 'parentPhone', label: 'Parent Phone', type: 'tel', required: true, enabled: true },
    { id: 'parentEmail', label: 'Parent Email', type: 'email', required: false, enabled: true },
  ];

  const availableFieldTypes = ['text', 'email', 'tel', 'date', 'select', 'textarea', 'number', 'checkbox'];

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/admission-forms/schools/${user?.schoolId}/settings`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Form settings saved successfully');
      queryClient.invalidateQueries(['admissionSettings', user?.schoolId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    }
  });

  React.useEffect(() => {
    if (settingsData?.data) {
      const existingFields = settingsData.data.form_fields || [];
      if (existingFields.length > 0) {
        setFormFields(existingFields);
      } else {
        setFormFields(defaultFields);
      }
      setSettings({
        acceptanceFeeEnabled: settingsData.data.acceptance_fee_enabled || false,
        acceptanceFeeAmount: settingsData.data.acceptance_fee_amount || 0,
        entranceExamEnabled: settingsData.data.entrance_exam_enabled || false,
        interviewEnabled: settingsData.data.interview_enabled || false,
        capacityQuotas: settingsData.data.capacity_quotas || {},
        maxApplicationsPerParent: settingsData.data.max_applications_per_parent || 5
      });
    }
  }, [settingsData]);

  const handleAddField = () => {
    const newField = {
      id: `custom_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      enabled: true
    };
    setFormFields(prev => [...prev, newField]);
  };

  const handleRemoveField = (index) => {
    setFormFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleField = (index) => {
    setFormFields(prev => prev.map((field, i) => 
      i === index ? { ...field, enabled: !field.enabled } : field
    ));
  };

  const handleToggleRequired = (index) => {
    setFormFields(prev => prev.map((field, i) => 
      i === index ? { ...field, required: !field.required } : field
    ));
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setFormFields(prev => {
      const newFields = [...prev];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      return newFields;
    });
  };

  const handleMoveDown = (index) => {
    if (index === formFields.length - 1) return;
    setFormFields(prev => {
      const newFields = [...prev];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      return newFields;
    });
  };

  const handleFieldChange = (index, field, value) => {
    setFormFields(prev => prev.map((f, i) => 
      i === index ? { ...f, [field]: value } : f
    ));
  };

  const handleSave = () => {
    updateSettingsMutation.mutate({
      formFields,
      ...settings
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admission Form Builder</h1>
          <p className="text-gray-500 mt-1">Customize your admission form fields</p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateSettingsMutation.isLoading}
          className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2 mt-3 md:mt-0"
        >
          {updateSettingsMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
          Save Settings
        </button>
      </div>

      {/* Form Settings */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Admission Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.acceptanceFeeEnabled}
                onChange={(e) => setSettings({ ...settings, acceptanceFeeEnabled: e.target.checked })}
                className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
              />
              <span className="text-sm text-gray-700">Enable Acceptance Fee</span>
            </label>
            {settings.acceptanceFeeEnabled && (
              <input
                type="number"
                value={settings.acceptanceFeeAmount}
                onChange={(e) => setSettings({ ...settings, acceptanceFeeAmount: parseFloat(e.target.value) })}
                placeholder="Acceptance Fee Amount"
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
              />
            )}
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.entranceExamEnabled}
                onChange={(e) => setSettings({ ...settings, entranceExamEnabled: e.target.checked })}
                className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
              />
              <span className="text-sm text-gray-700">Enable Entrance Exam</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.interviewEnabled}
                onChange={(e) => setSettings({ ...settings, interviewEnabled: e.target.checked })}
                className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
              />
              <span className="text-sm text-gray-700">Enable Interview</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Applications per Parent</label>
            <input
              type="number"
              value={settings.maxApplicationsPerParent}
              onChange={(e) => setSettings({ ...settings, maxApplicationsPerParent: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            />
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Form Fields</h3>
          <button
            onClick={handleAddField}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          >
            <FaPlus /> Add Field
          </button>
        </div>

        <div className="space-y-3">
          {formFields.map((field, index) => (
            <div key={field.id || index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaGripVertical className="text-gray-400" />
                  <span className="font-medium text-gray-800">{field.label}</span>
                  {field.required && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Required</span>
                  )}
                  {field.enabled && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Active</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleMoveUp(index)} className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-lg" disabled={index === 0}>
                    <FaArrowUp className="text-sm" />
                  </button>
                  <button onClick={() => handleMoveDown(index)} className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-lg" disabled={index === formFields.length - 1}>
                    <FaArrowDown className="text-sm" />
                  </button>
                  <button onClick={() => handleToggleField(index)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                    {field.enabled ? <FaCheck className="text-sm" /> : <FaTimes className="text-sm" />}
                  </button>
                  <button onClick={() => handleToggleRequired(index)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg">
                    *
                  </button>
                  <button onClick={() => handleRemoveField(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <FaTrash className="text-sm" />
                  </button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  placeholder="Field Label"
                />
                <select
                  value={field.type}
                  onChange={(e) => handleFieldChange(index, 'type', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  {availableFieldTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdmissionFormBuilder;