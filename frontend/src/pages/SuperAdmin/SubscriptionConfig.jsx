import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/axios';
import BillingWorkflow from './components/BillingWorkflow';
import {
  FaMoneyBillWave,
  FaClock,
  FaCalendarAlt,
  FaPercent,
  FaTicketAlt,
  FaBullhorn,
  FaBell,
  FaBan,
  FaUndo,
  FaSave,
  FaSpinner,
  FaBuilding,
  FaUserGraduate,
  FaCreditCard,
  FaReceipt,
  FaFileInvoice,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowLeft,
  FaSync,
  FaWallet,
} from 'react-icons/fa';

const SubscriptionConfig = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('config');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    pricePerStudent: 800,
    billingFrequency: 'monthly',
    academicSession: '',
    currentTerm: '',
    trialStartDate: '',
    trialEndDate: '',
    gracePeriodDays: 7,
    discountPercentage: 0,
    couponCode: '',
    promoCampaignId: '',
    renewalReminderDays: 7,
    latePaymentDays: 7,
    autoSuspendAfterDays: 30,
    manualSuspension: false,
    autoReactivate: false
  });

  // Fetch school details
  const { data: schoolData, isLoading: schoolLoading } = useQuery({
    queryKey: ['schoolConfig', schoolId],
    queryFn: async () => {
      const response = await api.get(`/admin/subscription/schools/${schoolId}/config`);
      return response.data;
    }
  });

  // Fetch billing summary
  const { data: billingData, refetch: refetchBilling } = useQuery({
    queryKey: ['billingSummary', schoolId],
    queryFn: async () => {
      const response = await api.get(`/admin/subscription/schools/${schoolId}/billing-summary`);
      return response.data;
    }
  });

  // Fetch promo campaigns
  const { data: campaignsData } = useQuery({
    queryKey: ['promoCampaigns'],
    queryFn: async () => {
      const response = await api.get('/admin/subscription/promo-campaigns', {
        params: { active_only: true }
      });
      return response.data;
    }
  });

  // Fetch students for invoice generation
  const { data: studentsData } = useQuery({
    queryKey: ['schoolStudents', schoolId],
    queryFn: async () => {
      const response = await api.get(`/admin/schools/${schoolId}/students`);
      return response.data;
    },
    enabled: activeTab === 'billing'
  });

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/admin/subscription/schools/${schoolId}/config`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Configuration updated successfully');
      queryClient.invalidateQueries(['schoolConfig', schoolId]);
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update configuration');
      setIsSaving(false);
    }
  });

  // Generate invoice mutation
  const generateInvoiceMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/admin/subscription/schools/${schoolId}/invoices`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.data.summary.total_invoices} invoices generated successfully`);
      refetchBilling();
      setIsGeneratingInvoice(false);
      setSelectedStudents([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate invoices');
      setIsGeneratingInvoice(false);
    }
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async ({ invoiceId, data }) => {
      const response = await api.put(`/admin/subscription/invoices/${invoiceId}/pay`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payment processed successfully');
      refetchBilling();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to process payment');
    }
  });

  // Run billing automation
  const runAutomationMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/subscription/billing/automate');
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Billing automation completed: ${data.data.invoices_generated} invoices generated`);
      refetchBilling();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to run automation');
    }
  });

  // Load data into form
  useEffect(() => {
    if (schoolData?.data) {
      const config = schoolData.data;
      setFormData({
        pricePerStudent: config.price_per_student || 800,
        billingFrequency: config.billing_frequency || 'monthly',
        academicSession: config.academic_session || '',
        currentTerm: config.current_term || '',
        trialStartDate: config.trial_start_date?.split('T')[0] || '',
        trialEndDate: config.trial_end_date?.split('T')[0] || '',
        gracePeriodDays: config.grace_period_days || 7,
        discountPercentage: config.discount_percentage || 0,
        couponCode: config.coupon_code || '',
        promoCampaignId: config.promo_campaign_id || '',
        renewalReminderDays: config.renewal_reminder_days || 7,
        latePaymentDays: config.late_payment_days || 7,
        autoSuspendAfterDays: config.auto_suspend_after_days || 30,
        manualSuspension: config.manual_suspension || false,
        autoReactivate: config.auto_reactivate || false
      });
    }
  }, [schoolData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    updateConfigMutation.mutate(formData);
  };

  const handleGenerateInvoice = () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    setIsGeneratingInvoice(true);
    generateInvoiceMutation.mutate({
      studentIds: selectedStudents,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const handleSelectAllStudents = (e) => {
    if (e.target.checked) {
      setSelectedStudents(studentsData?.data?.map(s => s.id) || []);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const billingSummary = billingData?.data || {};
  const school = schoolData?.data || {};
  const campaigns = campaignsData?.data || [];
  const students = studentsData?.data || [];

  const tabs = [
    { id: 'config', label: 'Configuration', icon: FaWallet },
    { id: 'billing', label: 'Billing & Invoices', icon: FaFileInvoice },
    { id: 'automation', label: 'Automation', icon: FaSync },
  ];

  // Render Configuration Tab
  const renderConfigTab = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Price Per Student */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaMoneyBillWave className="inline mr-1" />
            Price Per Student (₦) *
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
          <p className="text-xs text-gray-400 mt-1">Current students: {billingSummary.total_students || 0}</p>
        </div>

        {/* Billing Frequency */}
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

        {/* Academic Session */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaCalendarAlt className="inline mr-1" />
            Academic Session
          </label>
          <input
            type="text"
            name="academicSession"
            value={formData.academicSession}
            onChange={handleChange}
            placeholder="e.g., 2025/2026"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>

        {/* Current Term */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaCalendarAlt className="inline mr-1" />
            Current Term
          </label>
          <input
            type="text"
            name="currentTerm"
            value={formData.currentTerm}
            onChange={handleChange}
            placeholder="e.g., First Term"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>

        {/* Trial Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaCalendarAlt className="inline mr-1" />
            Trial Start Date
          </label>
          <input
            type="date"
            name="trialStartDate"
            value={formData.trialStartDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>

        {/* Trial End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaCalendarAlt className="inline mr-1" />
            Trial End Date
          </label>
          <input
            type="date"
            name="trialEndDate"
            value={formData.trialEndDate}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>

        {/* Grace Period */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaClock className="inline mr-1" />
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

        {/* Discount Percentage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaPercent className="inline mr-1" />
            Discount Percentage
          </label>
          <input
            type="number"
            name="discountPercentage"
            value={formData.discountPercentage}
            onChange={handleChange}
            min="0"
            max="100"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>

        {/* Coupon Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaTicketAlt className="inline mr-1" />
            Coupon Code
          </label>
          <input
            type="text"
            name="couponCode"
            value={formData.couponCode}
            onChange={handleChange}
            placeholder="Enter coupon code"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>

        {/* Promo Campaign */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaBullhorn className="inline mr-1" />
            Promo Campaign
          </label>
          <select
            name="promoCampaignId"
            value={formData.promoCampaignId}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          >
            <option value="">No Campaign</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name} ({campaign.discount_percentage}% off)
              </option>
            ))}
          </select>
        </div>

        {/* Renewal Reminder Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaBell className="inline mr-1" />
            Renewal Reminder (Days Before)
          </label>
          <input
            type="number"
            name="renewalReminderDays"
            value={formData.renewalReminderDays}
            onChange={handleChange}
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>

        {/* Late Payment Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaClock className="inline mr-1" />
            Late Payment Days (Grace)
          </label>
          <input
            type="number"
            name="latePaymentDays"
            value={formData.latePaymentDays}
            onChange={handleChange}
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>

        {/* Auto Suspend After Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaBan className="inline mr-1" />
            Auto Suspend After (Days)
          </label>
          <input
            type="number"
            name="autoSuspendAfterDays"
            value={formData.autoSuspendAfterDays}
            onChange={handleChange}
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>

        {/* Checkboxes */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="manualSuspension"
              checked={formData.manualSuspension}
              onChange={handleChange}
              className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
            />
            <span className="text-sm text-gray-700">Enable Manual Suspension</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="autoReactivate"
              checked={formData.autoReactivate}
              onChange={handleChange}
              className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
            />
            <span className="text-sm text-gray-700">
              <FaUndo className="inline mr-1" />
              Enable Auto Reactivation
            </span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => navigate('/admin/schools')}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
        >
          <FaArrowLeft />
          Back
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? <FaSpinner className="animate-spin" /> : <FaSave />}
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </form>
  );

  // Render Billing & Invoices Tab
  const renderBillingTab = () => (
    <div className="space-y-6">
      {/* Billing Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-600">
            <FaCheckCircle />
            <span className="text-sm font-medium">Paid</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{billingSummary.invoices?.paid || 0}</p>
          <p className="text-sm text-gray-500">₦{billingSummary.invoices?.paid_amount?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-yellow-600">
            <FaClock />
            <span className="text-sm font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{billingSummary.invoices?.pending || 0}</p>
          <p className="text-sm text-gray-500">₦{billingSummary.invoices?.pending_amount?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-600">
            <FaExclamationTriangle />
            <span className="text-sm font-medium">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{billingSummary.invoices?.overdue || 0}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-600">
            <FaReceipt />
            <span className="text-sm font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{billingSummary.invoices?.total || 0}</p>
          <p className="text-sm text-gray-500">₦{billingSummary.invoices?.total_amount?.toLocaleString() || 0}</p>
        </div>
      </div>

      {/* Generate Invoice Section */}
      <div className="border border-gray-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FaFileInvoice className="text-kora-primary" />
          Generate Invoices
        </h4>
        
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              onChange={handleSelectAllStudents}
              checked={selectedStudents.length === students.length && students.length > 0}
              className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
            />
            <span className="text-sm font-medium">Select All Students</span>
            <span className="text-sm text-gray-500 ml-2">({students.length} active students)</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {students.map((student) => (
              <label key={student.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => handleStudentToggle(student.id)}
                  className="w-4 h-4 text-kora-primary rounded border-gray-300 focus:ring-kora-primary"
                />
                <span>{student.first_name} {student.last_name}</span>
                <span className="text-gray-400 text-xs">({student.admission_number})</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGenerateInvoice}
            disabled={isGeneratingInvoice || selectedStudents.length === 0}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
          >
            {isGeneratingInvoice ? <FaSpinner className="animate-spin" /> : <FaCreditCard />}
            {isGeneratingInvoice ? 'Generating...' : `Generate Invoices (${selectedStudents.length} students)`}
          </button>
          <button
            onClick={() => runAutomationMutation.mutate()}
            disabled={runAutomationMutation.isLoading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <FaSync className={runAutomationMutation.isLoading ? 'animate-spin' : ''} />
            Run Automation
          </button>
        </div>
      </div>

      {/* Estimated Bill */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Estimated Monthly Bill</p>
            <p className="text-2xl font-bold text-gray-800">
              ₦{billingSummary.estimated_monthly_bill?.toLocaleString() || 0}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {billingSummary.total_students || 0} students × ₦{billingSummary.price_per_student || 0}
            </p>
            <p className="text-sm text-gray-500">
              {billingSummary.billing_frequency || 'monthly'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Automation Tab
  const renderAutomationTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">Billing Automation</h4>
        <p className="text-sm text-gray-600 mb-4">
          Run automated billing tasks including invoice generation, renewal reminders, 
          automatic suspensions, and reactivations.
        </p>
        <button
          onClick={() => runAutomationMutation.mutate()}
          disabled={runAutomationMutation.isLoading}
          className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
        >
          <FaSync className={runAutomationMutation.isLoading ? 'animate-spin' : ''} />
          {runAutomationMutation.isLoading ? 'Running...' : 'Run Automation Now'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4">
          <h5 className="font-medium text-gray-800 flex items-center gap-2">
            <FaBell className="text-yellow-500" />
            Renewal Reminders
          </h5>
          <p className="text-sm text-gray-500 mt-1">
            Reminders sent {formData.renewalReminderDays} days before renewal
          </p>
          <span className="text-xs text-gray-400">Status: Active</span>
        </div>

        <div className="border border-gray-200 rounded-xl p-4">
          <h5 className="font-medium text-gray-800 flex items-center gap-2">
            <FaBan className="text-red-500" />
            Automatic Suspension
          </h5>
          <p className="text-sm text-gray-500 mt-1">
            Suspends after {formData.autoSuspendAfterDays} days without payment
          </p>
          <span className="text-xs text-gray-400">
            Status: {formData.manualSuspension ? 'Manual Only' : 'Automatic'}
          </span>
        </div>

        <div className="border border-gray-200 rounded-xl p-4">
          <h5 className="font-medium text-gray-800 flex items-center gap-2">
            <FaUndo className="text-green-500" />
            Auto Reactivation
          </h5>
          <p className="text-sm text-gray-500 mt-1">
            Reactivates subscription when payment is received
          </p>
          <span className="text-xs text-gray-400">
            Status: {formData.autoReactivate ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div className="border border-gray-200 rounded-xl p-4">
          <h5 className="font-medium text-gray-800 flex items-center gap-2">
            <FaClock className="text-blue-500" />
            Grace Period
          </h5>
          <p className="text-sm text-gray-500 mt-1">
            {formData.gracePeriodDays} days grace period after due date
          </p>
          <span className="text-xs text-gray-400">
            Late payment after {formData.latePaymentDays} days
          </span>
        </div>
      </div>
    </div>
  );

  if (schoolLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kora-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Subscription Configuration
          </h1>
          <p className="text-gray-500 mt-1">
            {school.name} - Configure billing and subscription settings
          </p>
        </div>
        <div className="flex items-center gap-3 mt-3 md:mt-0">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            school.subscription_status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : school.subscription_status === 'trial'
              ? 'bg-blue-100 text-blue-800'
              : school.subscription_status === 'suspended'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {school.subscription_status || 'Pending'}
          </span>
          <button
            onClick={() => navigate('/admin/schools')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <FaArrowLeft />
            Back to Schools
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-kora-primary text-kora-primary font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'config' && renderConfigTab()}
          {activeTab === 'billing' && renderBillingTab()}
          {activeTab === 'automation' && renderAutomationTab()}
        </div>
        <div className="mt-6">
  <BillingWorkflow 
    schoolId={schoolId}
    onGenerate={handleGenerateInvoice}
    onProcess={() => {}}
  />
</div>

      </div>
    </div>
  );
};

export default SubscriptionConfig;