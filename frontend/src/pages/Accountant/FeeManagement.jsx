import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  FaSearch,
  FaFileInvoice,
  FaMoneyBillWave,
  FaCheck,
  FaSpinner,
  FaTimes,
  FaEye,
  FaCreditCard,
} from 'react-icons/fa';

const FeeManagement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'card',
    reference: ''
  });

  // Fetch invoices
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['invoices', user?.schoolId, statusFilter, searchTerm],
    queryFn: async () => {
      const response = await api.get(`/accountant/schools/${user?.schoolId}/invoices`, {
        params: {
          status: statusFilter || undefined,
          search: searchTerm || undefined,
          limit: 50
        }
      });
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Process payment mutation
  const payMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/accountant/schools/${user?.schoolId}/payments`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      queryClient.invalidateQueries(['invoices', user?.schoolId]);
      refetch();
      setSelectedInvoice(null);
      setPaymentData({ amount: '', paymentMethod: 'card', reference: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  });

  const invoices = data?.data || [];
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleProcessPayment = () => {
    if (!selectedInvoice) return;
    const amount = paymentData.amount || selectedInvoice.total_amount - (selectedInvoice.paid_amount || 0);
    
    payMutation.mutate({
      invoiceId: selectedInvoice.id,
      amount: parseFloat(amount),
      paymentMethod: paymentData.paymentMethod,
      reference: paymentData.reference || `PAY-${Date.now()}`
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-3xl text-kora-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Fee Management</h1>
          <p className="text-gray-500 mt-1">View invoices and record payments</p>
        </div>
        <div className="flex gap-3 mt-3 md:mt-0">
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">No invoices found</td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{invoice.invoice_number}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-800">
                          {invoice.students?.first_name} {invoice.students?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{invoice.students?.admission_number}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(invoice.total_amount)}</td>
                    <td className="px-4 py-3">{formatCurrency(invoice.paid_amount || 0)}</td>
                    <td className="px-4 py-3 font-bold text-red-600">
                      {formatCurrency(invoice.total_amount - (invoice.paid_amount || 0))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {invoice.status !== 'paid' && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setPaymentData({
                              amount: invoice.total_amount - (invoice.paid_amount || 0),
                              paymentMethod: 'card',
                              reference: ''
                            });
                          }}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1"
                        >
                          <FaCreditCard className="text-sm" />
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Record Payment</h3>
              <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Student</p>
                <p className="font-medium text-gray-800">
                  {selectedInvoice.students?.first_name} {selectedInvoice.students?.last_name}
                </p>
                <p className="text-xs text-gray-500">{selectedInvoice.students?.admission_number}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                >
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference (Optional)</label>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="e.g., TRANS123456"
                />
              </div>

              <button
                onClick={handleProcessPayment}
                disabled={payMutation.isLoading}
                className="w-full px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {payMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManagement;