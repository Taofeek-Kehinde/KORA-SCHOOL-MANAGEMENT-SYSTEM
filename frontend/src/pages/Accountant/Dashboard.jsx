import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import {
  FaMoneyBillWave,
  FaCreditCard,
  FaClock,
  FaExclamationTriangle,
  FaUsers,
  FaChartLine,
  FaFileInvoice,
  FaSpinner,
} from 'react-icons/fa';
import StatCard from '../../components/StatCard';

const AccountantDashboard = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['accountantDashboard', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/accountant/schools/${user?.schoolId}/dashboard`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-kora-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h3 className="text-xl font-semibold text-gray-700">Failed to Load Dashboard</h3>
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  const dashboard = data?.data || {};
  const summary = dashboard.summary || {};
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
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Accountant Dashboard</h1>
        <p className="text-gray-500 mt-1">Financial overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={FaMoneyBillWave}
          title="Total Revenue"
          value={formatCurrency(summary.total_paid)}
          color="green"
        />
        <StatCard
          icon={FaClock}
          title="Pending"
          value={formatCurrency(summary.total_pending)}
          color="yellow"
        />
        <StatCard
          icon={FaExclamationTriangle}
          title="Overdue"
          value={formatCurrency(summary.total_overdue)}
          color="red"
        />
        <StatCard
          icon={FaFileInvoice}
          title="Invoices"
          value={summary.total_invoices || 0}
          color="blue"
        />
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Payments</h3>
        {dashboard.recent_payments?.length > 0 ? (
          <div className="space-y-2">
            {dashboard.recent_payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-800">
                    {payment.students?.first_name} {payment.students?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{payment.students?.admission_number}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatCurrency(payment.paid_amount || payment.total_amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">No recent payments</div>
        )}
      </div>

      {/* Outstanding Students */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Outstanding Fees</h3>
        {dashboard.outstanding_students?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dashboard.outstanding_students.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {invoice.students?.first_name} {invoice.students?.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm">{invoice.students?.classes?.name || 'N/A'}</td>
                    <td className="px-4 py-3 font-bold text-red-600">
                      {formatCurrency(invoice.total_amount - (invoice.paid_amount || 0))}
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(invoice.due_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">No outstanding fees</div>
        )}
      </div>
    </div>
  );
};

export default AccountantDashboard;