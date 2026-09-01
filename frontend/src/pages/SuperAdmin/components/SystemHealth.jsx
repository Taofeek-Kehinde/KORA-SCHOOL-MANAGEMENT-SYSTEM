import React from 'react';
import { FaServer, FaDatabase, FaSms, FaEnvelope, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

const SystemHealth = ({ status, storage, sms, email }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return 'text-green-500 bg-green-50';
      case 'degraded':
        return 'text-yellow-500 bg-yellow-50';
      case 'down':
        return 'text-red-500 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return FaCheckCircle;
      case 'degraded':
        return FaExclamationTriangle;
      case 'down':
        return FaTimesCircle;
      default:
        return FaServer;
    }
  };

  const StatusIcon = getStatusIcon(status);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const healthItems = [
    {
      icon: FaServer,
      label: 'Server Status',
      value: status || 'Unknown',
      color: getStatusColor(status),
      icon: StatusIcon,
    },
    {
      icon: FaDatabase,
      label: 'Storage',
      value: storage?.storage_used && storage?.storage_total 
        ? `${formatBytes(storage.storage_used)} / ${formatBytes(storage.storage_total)}`
        : 'N/A',
      subtitle: storage?.storage_percentage ? `${storage.storage_percentage}% used` : '',
    },
    {
      icon: FaSms,
      label: 'SMS Usage',
      value: sms?.sms_usage !== undefined ? `${sms.sms_usage} / ${sms.sms_limit}` : 'N/A',
      subtitle: sms?.sms_usage && sms?.sms_limit 
        ? `${((sms.sms_usage / sms.sms_limit) * 100).toFixed(0)}% used`
        : '',
    },
    {
      icon: FaEnvelope,
      label: 'Email Usage',
      value: email?.email_usage !== undefined ? `${email.email_usage} / ${email.email_limit}` : 'N/A',
      subtitle: email?.email_usage && email?.email_limit 
        ? `${((email.email_usage / email.email_limit) * 100).toFixed(0)}% used`
        : '',
    },
  ];

  return (
    <>
      {healthItems.map((item, index) => (
        <div key={index} className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${item.color}`}>
              <item.icon className="text-xl" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500">{item.label}</p>
              <p className="text-lg font-semibold text-gray-800">{item.value}</p>
              {item.subtitle && (
                <p className="text-xs text-gray-400">{item.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default SystemHealth;