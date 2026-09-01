import React from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

const StatCard = ({
  icon: Icon,
  title,
  value,
  color = 'blue',
  subtitle,
  isCurrency = false,
  trend
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    pink: 'bg-pink-50 text-pink-600',
    teal: 'bg-teal-50 text-teal-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  const formattedValue = isCurrency
    ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value)
    : typeof value === 'number'
      ? value.toLocaleString()
      : value;

  return (
    <div className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-xl font-bold text-gray-800 mt-1 truncate">{formattedValue}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {trend.isPositive ? (
                <FaArrowUp className="text-green-500 text-xs" />
              ) : (
                <FaArrowDown className="text-red-500 text-xs" />
              )}
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.value}%
              </span>
              <span className="text-xs text-gray-400">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-xl flex-shrink-0 ${colorClasses[color]}`}>
          <Icon className="text-xl" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;