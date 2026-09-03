import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import {
  FaMoneyBillWave,
  FaChartLine,
  FaClock,
  FaExclamationTriangle,
  FaFileInvoice,
  FaSpinner,
  FaDownload,
  FaCreditCard,
  FaWallet,
} from 'react-icons/fa';
import StatCard from '../../components/StatCard';

const FinancialReports = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('month');

  const { data, isLoading, error } = useQuery({
    queryKey: ['financialReport', user?.schoolId, period],
    queryFn: async () => {
      const response = await api.get(`/accountant/schools/${user?.schoolId}/report`, {
        params: { period }
      });
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-3xl text-kora-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h3 className="text-xl font-semibold text-gray-700">Failed to Load Report</h3>
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  const report = data?.data || {};
  const summary = report.summary || {};
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Financial Reports</h1>
          <p className="text-gray-500 mt-1">Revenue and payment summary</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2"
          >
            <FaDownload />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={FaMoneyBillWave}
          title="Total Revenue"
          value={formatCurrency(summary.total_revenue)}
          color="green"
        />
        <StatCard
          icon={FaChartLine}
          title="Monthly Revenue"
          value={formatCurrency(summary.monthly_revenue)}
          color="emerald"
        />
        <StatCard
          icon={FaExclamationTriangle}
          title="Outstanding"
          value={formatCurrency(summary.total_outstanding)}
          color="red"
        />
        <StatCard
          icon={FaFileInvoice}
          title="Total Payments"
          value={summary.total_payments || 0}
          color="blue"
        />
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
          {Object.keys(report.payment_methods || {}).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(report.payment_methods).map(([method, data]) => (
                <div key={method} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <FaCreditCard className="text-kora-primary" />
                    <span className="capitalize">{method}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatCurrency(data.amount)}</p>
                    <p className="text-xs text-gray-500">{data.count} payments</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No payment data</div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Payments</h3>
          {report.recent_payments?.length > 0 ? (
            <div className="space-y-2">
              {report.recent_payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="font-medium text-gray-800">{payment.reference || 'Payment'}</p>
                    <p className="text-xs text-gray-500">{new Date(payment.payment_date).toLocaleDateString()}</p>
                  </div>
                  <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No recent payments</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;