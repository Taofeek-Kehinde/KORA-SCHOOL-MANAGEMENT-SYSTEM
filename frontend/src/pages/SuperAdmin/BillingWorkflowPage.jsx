import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaCalculator,
  FaFileInvoice,
  FaEnvelope,
  FaSms,
  FaBell,
  FaCreditCard,
  FaReceipt,
  FaCheckCircle,
  FaCalendarAlt,
  FaSpinner,
  FaPlay,
  FaArrowLeft,
  FaCheck,
  FaClock,
  FaExclamationTriangle,
} from 'react-icons/fa';

const BillingWorkflowPage = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [workflowResult, setWorkflowResult] = useState(null);

  // Fetch school details
  const { data: schoolData } = useQuery({
    queryKey: ['school', schoolId],
    queryFn: async () => {
      const response = await api.get(`/admin/schools/${schoolId}`);
      return response.data;
    }
  });

  // Fetch billing status
  const { data: billingStatus, refetch: refetchBilling } = useQuery({
    queryKey: ['billingStatus', schoolId],
    queryFn: async () => {
      const response = await api.get(`/admin/billing/schools/${schoolId}/billing/status`);
      return response.data;
    }
  });

  // Run billing workflow mutation
  const runWorkflowMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/admin/billing/schools/${schoolId}/billing/workflow`);
      return response.data;
    },
    onSuccess: (data) => {
      setWorkflowResult(data.data);
      setCurrentStep(5); // All 5 initial steps complete
      toast.success('Billing workflow completed successfully');
      refetchBilling();
      setIsRunning(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to run billing workflow');
      setIsRunning(false);
    }
  });

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async ({ invoiceId, paymentData }) => {
      const response = await api.post(`/admin/billing/invoices/${invoiceId}/pay`, paymentData);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Payment processed successfully');
      setWorkflowResult(data.data);
      setCurrentStep(9); // All 9 steps complete
      refetchBilling();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to process payment');
    }
  });

  const steps = [
    {
      id: 1,
      icon: FaCalculator,
      label: 'Calculate Bill',
      description: 'Active Students × Price Per Student',
      color: 'blue'
    },
    {
      id: 2,
      icon: FaFileInvoice,
      label: 'Generate Invoice',
      description: 'Invoice Generated',
      color: 'indigo'
    },
    {
      id: 3,
      icon: FaEnvelope,
      label: 'Email Sent',
      description: 'Invoice sent via email',
      color: 'purple'
    },
    {
      id: 4,
      icon: FaSms,
      label: 'SMS Reminder',
      description: 'SMS reminder sent',
      color: 'pink'
    },
    {
      id: 5,
      icon: FaBell,
      label: 'Dashboard Notification',
      description: 'Notification displayed',
      color: 'yellow'
    },
    {
      id: 6,
      icon: FaCreditCard,
      label: 'Process Payment',
      description: 'Payment received',
      color: 'green'
    },
    {
      id: 7,
      icon: FaReceipt,
      label: 'Generate Receipt',
      description: 'Receipt created',
      color: 'emerald'
    },
    {
      id: 8,
      icon: FaCheckCircle,
      label: 'Activate Subscription',
      description: 'Subscription activated',
      color: 'teal'
    },
    {
      id: 9,
      icon: FaCalendarAlt,
      label: 'Schedule Renewal',
      description: 'Renewal date set',
      color: 'cyan'
    }
  ];

  const runWorkflow = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    
    // Animate through steps 1-5
    for (let i = 0; i < 5; i++) {
      setCurrentStep(i + 1);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Execute actual workflow
    runWorkflowMutation.mutate();
  };

  const handleProcessPayment = (invoiceId) => {
    processPaymentMutation.mutate({
      invoiceId,
      paymentData: {
        paymentMethod: 'card',
        reference: `PAY-${Date.now()}`,
        amount: billingStatus?.data?.invoices?.pending_amount || 0
      }
    });
  };

  const school = schoolData?.data || {};
  const billing = billingStatus?.data || {};
  const hasPendingInvoices = (billing.invoices?.pending || 0) > 0;

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    pink: 'bg-pink-50 text-pink-600 border-pink-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    teal: 'bg-teal-50 text-teal-600 border-teal-200',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-200',
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Billing Workflow</h1>
          <p className="text-gray-500 mt-1">{school.name}</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <button
            onClick={() => navigate(`/admin/schools/${schoolId}/subscription`)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          >
            <FaArrowLeft />
            Back to Configuration
          </button>
          <button
            onClick={runWorkflow}
            disabled={isRunning}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
          >
            {isRunning ? <FaSpinner className="animate-spin" /> : <FaPlay />}
            {isRunning ? 'Running...' : 'Run Full Workflow'}
          </button>
        </div>
      </div>

      {/* Billing Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-500">Students</p>
          <p className="text-2xl font-bold text-gray-800">{billing.students?.total || 0}</p>
          <p className="text-xs text-gray-400">₦{billing.students?.estimated_bill?.toLocaleString() || 0} estimated</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-500">Price/Student</p>
          <p className="text-2xl font-bold text-gray-800">₦{billing.school?.price_per_student || 0}</p>
          <p className="text-xs text-gray-400">{billing.school?.billing_frequency || 'monthly'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-500">Pending Invoices</p>
          <p className={`text-2xl font-bold ${hasPendingInvoices ? 'text-yellow-600' : 'text-green-600'}`}>
            {billing.invoices?.pending || 0}
          </p>
          <p className="text-xs text-gray-400">₦{billing.invoices?.pending_amount?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4">
          <p className="text-sm text-gray-500">Subscription Status</p>
          <p className={`text-2xl font-bold ${
            billing.school?.subscription_status === 'active' ? 'text-green-600' :
            billing.school?.subscription_status === 'suspended' ? 'text-red-600' :
            'text-yellow-600'
          }`}>
            {billing.school?.subscription_status || 'pending'}
          </p>
          <p className="text-xs text-gray-400">
            {billing.school?.subscription_end_date ? 
              `Renews: ${new Date(billing.school.subscription_end_date).toLocaleDateString()}` : 
              'No renewal date'}
          </p>
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <FaPlay className="text-kora-primary" />
          Billing Workflow Steps
        </h3>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-0">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep > index;
              const isCurrent = currentStep === index + 1;
              const isCompleted = currentStep > index;
              
              return (
                <div key={step.id} className="relative flex items-start gap-4 pb-6 last:pb-0">
                  {/* Step circle */}
                  <div className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isCompleted ? colorClasses[step.color] : 'bg-gray-100 text-gray-400 border-gray-200'
                  } ${isCurrent && !isCompleted ? 'ring-2 ring-kora-primary ring-offset-2' : ''}`}>
                    {isCompleted ? <FaCheck className="text-sm" /> : <Icon className="text-sm" />}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                        Step {step.id}: {step.label}
                      </p>
                      {isCompleted && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                      )}
                      {isCurrent && !isCompleted && (
                        <span className="text-xs text-kora-primary bg-kora-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FaSpinner className="animate-spin" />
                          Processing...
                        </span>
                      )}
                      {!isCompleted && !isCurrent && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${isCompleted ? 'text-gray-500' : 'text-gray-300'}`}>
                      {step.description}
                    </p>
                    
                    {/* Show results for completed steps */}
                    {isCompleted && workflowResult && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                        {step.id === 1 && (
                          <span>
                            {billing.students?.total || 0} students × ₦{billing.school?.price_per_student || 0} = 
                            <strong> ₦{billing.students?.estimated_bill?.toLocaleString() || 0}</strong>
                          </span>
                        )}
                        {step.id === 2 && workflowResult.summary && (
                          <span>
                            {workflowResult.summary.totalInvoices} invoices generated for {workflowResult.summary.studentCount} students
                          </span>
                        )}
                        {step.id === 3 && workflowResult.notifications?.email && (
                          <span>
                            {workflowResult.notifications.email.success ? 'Email sent successfully' : 'Email failed'}
                          </span>
                        )}
                        {step.id === 4 && workflowResult.notifications?.sms && (
                          <span>
                            {workflowResult.notifications.sms.success ? 'SMS sent successfully' : 'SMS failed'}
                          </span>
                        )}
                        {step.id === 5 && workflowResult.notifications?.dashboard && (
                          <span>
                            {workflowResult.notifications.dashboard.success ? 'Notification sent' : 'Notification failed'}
                          </span>
                        )}
                        {step.id === 6 && workflowResult.invoice && (
                          <span>
                            Payment of ₦{workflowResult.invoice.total_amount?.toLocaleString()} processed
                          </span>
                        )}
                        {step.id === 7 && workflowResult.receipt && (
                          <span>
                            Receipt #{workflowResult.receipt.receipt_number} generated
                          </span>
                        )}
                        {step.id === 8 && workflowResult.subscription && (
                          <span>
                            {workflowResult.subscription.activated ? 'Subscription activated' : workflowResult.subscription.message}
                          </span>
                        )}
                        {step.id === 9 && workflowResult.next_renewal && (
                          <span>
                            Next renewal: {new Date(workflowResult.next_renewal.nextRenewalDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step action button for step 6 */}
                  {step.id === 6 && isCompleted && hasPendingInvoices && (
                    <button
                      onClick={() => handleProcessPayment(workflowResult?.invoices?.[0]?.id)}
                      disabled={processPaymentMutation.isLoading}
                      className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm flex items-center gap-1"
                    >
                      {processPaymentMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCreditCard />}
                      Process Payment
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion Status */}
        {currentStep === steps.length && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <FaCheckCircle className="text-green-500 text-3xl mx-auto mb-2" />
            <p className="font-semibold text-green-800 text-lg">Billing Workflow Complete!</p>
            <p className="text-sm text-green-600">
              All 9 steps completed successfully. Subscription activated and renewal scheduled.
            </p>
            <button
              onClick={() => {
                setCurrentStep(0);
                setWorkflowResult(null);
              }}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Reset Workflow
            </button>
          </div>
        )}

        {/* No pending invoices */}
        {!hasPendingInvoices && currentStep > 0 && currentStep < 6 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
            <FaCheckCircle />
            No pending invoices. All invoices are paid.
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingWorkflowPage;