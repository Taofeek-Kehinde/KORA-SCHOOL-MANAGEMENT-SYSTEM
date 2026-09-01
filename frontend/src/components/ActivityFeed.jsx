import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaUserPlus,
  FaMoneyBillWave,
  FaClock,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaKey,
} from 'react-icons/fa';

const ActivityFeed = ({ activities }) => {
  const getActivityIcon = (action) => {
    const iconMap = {
      'CREATE': FaUserPlus,
      'UPDATE': FaEdit,
      'DELETE': FaTrash,
      'APPROVE': FaCheckCircle,
      'REJECT': FaTimesCircle,
      'PAYMENT': FaMoneyBillWave,
      'SUSPEND': FaClock,
      'STUDENT': FaUserGraduate,
      'TEACHER': FaChalkboardTeacher,
      'PASSWORD_RESET': FaKey,
    };
    const Icon = iconMap[action] || FaEdit;
    return Icon;
  };

  const getActivityColor = (action) => {
    if (action.includes('APPROVE') || action.includes('CREATE')) return 'text-green-500 bg-green-100';
    if (action.includes('REJECT') || action.includes('DELETE')) return 'text-red-500 bg-red-100';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'text-blue-500 bg-blue-100';
    if (action.includes('SUSPEND')) return 'text-yellow-500 bg-yellow-100';
    if (action.includes('PAYMENT')) return 'text-emerald-500 bg-emerald-100';
    if (action.includes('PASSWORD')) return 'text-orange-500 bg-orange-100';
    return 'text-gray-500 bg-gray-100';
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FaClock className="text-4xl mx-auto mb-2 text-gray-300" />
        <p>No recent activities</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, index) => {
          const Icon = getActivityIcon(activity.action);
          const colorClass = getActivityColor(activity.action);

          return (
            <li key={activity.id || index}>
              <div className="relative pb-8">
                {index < activities.length - 1 && (
                  <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" />
                )}
                <div className="relative flex items-start space-x-3">
                  <div className={`relative px-3 py-2 rounded-full ${colorClass}`}>
                    <Icon className="text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between">
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">{activity.users?.full_name || 'System'}</span>
                        <span className="text-gray-500 ml-1">
                          {activity.action.replace(/_/g, ' ').toLowerCase()}
                        </span>
                        <span className="text-gray-500 ml-1">on</span>
                        <span className="font-medium ml-1">{activity.entity_type}</span>
                      </p>
                      <span className="text-xs text-gray-400 whitespace-nowrap mt-1 sm:mt-0">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ActivityFeed;