import React from 'react';
import { FaTimes, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const ConfirmDialog = ({
  title,
  message,
  type = 'warning',
  onConfirm,
  onCancel,
  isLoading
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: FaExclamationTriangle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          buttonColor: 'bg-red-500 hover:bg-red-600'
        };
      case 'warning':
        return {
          icon: FaExclamationTriangle,
          iconColor: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          buttonColor: 'bg-yellow-500 hover:bg-yellow-600'
        };
      default:
        return {
          icon: FaCheckCircle,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          buttonColor: 'bg-kora-primary hover:bg-kora-secondary'
        };
    }
  };

  const styles = getTypeStyles();
  const Icon = styles.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={`bg-white rounded-xl max-w-md w-full p-6 border ${styles.borderColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${styles.bgColor}`}>
              <Icon className={`text-xl ${styles.iconColor}`} />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg">
            <FaTimes />
          </button>
        </div>

        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-white rounded-lg ${styles.buttonColor} disabled:opacity-50`}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;