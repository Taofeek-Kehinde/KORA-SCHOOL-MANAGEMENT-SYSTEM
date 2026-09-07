import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaSpinner, FaSave, FaPlus, FaTrash } from 'react-icons/fa';

const ApprovalWorkflows = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [workflowType, setWorkflowType] = useState('lesson_notes');
  const [stages, setStages] = useState([
    { name: 'Teacher Creates', role: 'teacher' },
    { name: 'HOD Reviews', role: 'hod' },
    { name: 'VP Approves', role: 'vp' }
  ]);
  const [isEnabled, setIsEnabled] = useState(true);

  // Fetch workflows
  const { data: workflowsData, isLoading, refetch } = useQuery({
    queryKey: ['approvalWorkflows', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/approval-workflows/schools/${user?.schoolId}/approval-workflows`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const workflows = workflowsData?.data || [];

  // Load workflow data when workflows change or workflowType changes
  useEffect(() => {
    if (workflows.length > 0) {
      const found = workflows.find(w => w.workflow_type === workflowType);
      if (found) {
        setStages(found.stages || []);
        setIsEnabled(found.is_enabled !== undefined ? found.is_enabled : true);
      } else {
        // Reset to default for this workflow type
        const defaultStages = {
          lesson_notes: [
            { name: 'Teacher Creates', role: 'teacher' },
            { name: 'HOD Reviews', role: 'hod' },
            { name: 'VP Approves', role: 'vp' }
          ],
          schemes_of_work: [
            { name: 'Teacher Creates', role: 'teacher' },
            { name: 'HOD Reviews', role: 'hod' },
            { name: 'VP Approves', role: 'vp' }
          ],
          ca_scores: [
            { name: 'Teacher Submits', role: 'teacher' },
            { name: 'HOD Verifies', role: 'hod' },
            { name: 'VP Approves', role: 'vp' }
          ],
          results: [
            { name: 'Teacher Submits', role: 'teacher' },
            { name: 'HOD Verifies', role: 'hod' },
            { name: 'VP Approves', role: 'vp' },
            { name: 'Principal Approves', role: 'principal' }
          ]
        };
        setStages(defaultStages[workflowType] || [
          { name: 'Teacher Creates', role: 'teacher' },
          { name: 'HOD Reviews', role: 'hod' },
          { name: 'VP Approves', role: 'vp' }
        ]);
        setIsEnabled(true);
      }
    }
  }, [workflows, workflowType]);

  // Configure workflow
  const configureMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/approval-workflows/schools/${user?.schoolId}/approval-workflows/configure`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Workflow configured successfully');
      refetch();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to configure workflow')
  });

  const handleSave = () => {
    if (!stages || stages.length === 0) {
      toast.error('Please add at least one stage');
      return;
    }
    configureMutation.mutate({
      workflowType,
      stages,
      isEnabled
    });
  };

  const handleAddStage = () => {
    setStages(prev => [...prev, { name: '', role: 'teacher' }]);
  };

  const handleRemoveStage = (index) => {
    if (stages.length <= 1) {
      toast.error('Must have at least one stage');
      return;
    }
    setStages(prev => prev.filter((_, i) => i !== index));
  };

  const handleStageChange = (index, field, value) => {
    setStages(prev => prev.map((stage, i) => i === index ? { ...stage, [field]: value } : stage));
  };

  const workflowTypes = [
    { value: 'lesson_notes', label: 'Lesson Notes' },
    { value: 'schemes_of_work', label: 'Schemes of Work' },
    { value: 'ca_scores', label: 'Continuous Assessment' },
    { value: 'results', label: 'Examination Results' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-kora-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Approval Workflows</h1>
        <p className="text-gray-500 mt-1">Configure approval stages for academic content</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        {/* Workflow Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Workflow Type</label>
          <select
            value={workflowType}
            onChange={(e) => setWorkflowType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            {workflowTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Stages */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Approval Stages</h3>
          <div className="space-y-3">
            {stages.map((stage, index) => (
              <div key={index} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                <span className="text-gray-400 font-bold w-6 text-center">{index + 1}</span>
                <input
                  type="text"
                  value={stage.name}
                  onChange={(e) => handleStageChange(index, 'name', e.target.value)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-lg"
                  placeholder="Stage Name"
                />
                <select
                  value={stage.role}
                  onChange={(e) => handleStageChange(index, 'role', e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg"
                >
                  <option value="teacher">Teacher</option>
                  <option value="hod">Head of Department</option>
                  <option value="vp">Vice Principal</option>
                  <option value="principal">Principal</option>
                </select>
                <button onClick={() => handleRemoveStage(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
          <button onClick={handleAddStage} className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
            <FaPlus /> Add Stage
          </button>
        </div>

        {/* Enable/Disable */}
        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
            />
            <span className="text-sm text-gray-700">Enable this workflow</span>
          </label>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={configureMutation.isLoading}
          className="w-full px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {configureMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaSave />}
          Save Workflow
        </button>
      </div>

      {/* Existing Workflows */}
      {workflows.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Configured Workflows</h3>
          <div className="space-y-3">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {workflowTypes.find(t => t.value === workflow.workflow_type)?.label || workflow.workflow_type}
                    </p>
                    <p className="text-sm text-gray-500">{workflow.stages?.length || 0} stages</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${workflow.is_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {workflow.is_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalWorkflows;