import React, { useState } from 'react';
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
} from 'react-icons/fa';

const BillingWorkflow = ({ schoolId, onGenerate, onProcess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

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
      label: 'School Pays',
      description: 'Payment received',
      color: 'green'
    },
    {
      id: 7,
      icon: FaReceipt,
      label: 'Receipt Generated',
      description: 'Receipt created',
      color: 'emerald'
    },
    {
      id: 8,
      icon: FaCheckCircle,
      label: 'Subscription Activated',
      description: 'Subscription activated',
      color: 'teal'
    },
    {
      id: 9,
      icon: FaCalendarAlt,
      label: 'Next Renewal Scheduled',
      description: 'Renewal date set',
      color: 'cyan'
    }
  ];

  const simulateWorkflow = async () => {
    setIsRunning(true);
    setCurrentStep(0);
    
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i + 1);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    setIsRunning(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Billing Workflow</h3>
          <p className="text-sm text-gray-500">Visual representation of the billing process</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={simulateWorkflow}
            disabled={isRunning}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
          >
            {isRunning ? <FaSpinner className="animate-spin" /> : <FaCalculator />}
            {isRunning ? 'Running...' : 'Run Workflow'}
          </button>
          <button
            onClick={() => {
              setCurrentStep(0);
              setIsRunning(false);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Example: 845 Active Students × ₦1,000 = ₦845,000 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold">Example:</span>
          <span>845 Active Students</span>
          <span className="text-gray-400">×</span>
          <span>₦1,000</span>
          <span className="text-gray-400">=</span>
          <span className="font-bold text-kora-primary">₦845,000</span>
        </div>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-0">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep > index;
            const isCurrent = currentStep === index + 1;
            
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

            const borderColor = isActive ? colorClasses[step.color] : 'bg-gray-100 text-gray-400 border-gray-200';

            return (
              <div key={step.id} className="relative flex items-start gap-4 pb-6 last:pb-0">
                {/* Step circle */}
                <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  isActive ? colorClasses[step.color] : 'bg-gray-100 text-gray-400 border-gray-200'
                } ${isCurrent ? 'ring-2 ring-kora-primary ring-offset-2' : ''}`}>
                  {isActive ? <Icon className="text-sm" /> : <span className="text-xs font-medium">{step.id}</span>}
                </div>

                {/* Step content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium text-sm ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {isActive && (
                      <FaCheckCircle className="text-green-500 text-xs" />
                    )}
                  </div>
                  <p className={`text-xs ${isActive ? 'text-gray-500' : 'text-gray-300'}`}>
                    {step.description}
                  </p>
                </div>

                {/* Status indicator */}
                {isActive && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <FaCheckCircle className="text-green-500" />
                    Completed
                  </div>
                )}
                {isCurrent && !isActive && (
                  <div className="flex items-center gap-1 text-xs text-kora-primary">
                    <FaSpinner className="animate-spin" />
                    Processing...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {currentStep === steps.length && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <FaCheckCircle className="text-green-500 text-2xl mx-auto mb-2" />
          <p className="font-semibold text-green-800">Billing Workflow Complete!</p>
          <p className="text-sm text-green-600">Subscription activated and renewal scheduled</p>
        </div>
      )}
    </div>
  );
};

export default BillingWorkflow;