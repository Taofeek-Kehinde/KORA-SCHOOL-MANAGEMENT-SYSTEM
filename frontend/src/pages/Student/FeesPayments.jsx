import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { FaSpinner, FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import StatCard from '../../components/StatCard';

const FeesPayments = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['studentFees', user?.studentId],
    queryFn: async () => {
      const response = await api.get(`/student-dashboard/students/${user?.studentId}/dashboard`);
      return response.data;
    },
    enabled: !!user?.studentId,
  });

  const fees = data?.data?.outstandingFees || {};
  const payments = data?.data?.paymentHistory || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-kora-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Fees & Payments</h1>
        <p className="text-gray-500 mt-1">View your fees and payment history</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FaMoneyBillWave} title="Outstanding" value={formatCurrency(fees.totalOutstanding)} color="red" />
        <StatCard icon={FaCreditCard} title="Total Paid" value={formatCurrency(payments.totalPaid)} color="green" />
        <StatCard icon={FaMoneyBillWave} title="Invoices" value={fees.totalInvoices || 0} color="blue" />
        <StatCard icon={FaCreditCard} title="Paid Invoices" value={payments.totalPayments || 0} color="emerald" />
      </div>

      {/* Outstanding Invoices */}
      {fees.invoices?.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Outstanding Invoices</h3>
          <div className="space-y-2">
            {fees.invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-800">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
                <p className="font-bold text-red-600">{formatCurrency(invoice.balance)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.payments?.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h3>
          <div className="space-y-2">
            {payments.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-800">{payment.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(payment.paidAt).toLocaleDateString()} • {payment.paymentMethod}
                  </p>
                </div>
                <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {fees.invoices?.length === 0 && payments.payments?.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <FaMoneyBillWave className="text-4xl mx-auto mb-2 text-gray-300" />
          No fee records found
        </div>
      )}
    </div>
  );
};

export default FeesPayments;