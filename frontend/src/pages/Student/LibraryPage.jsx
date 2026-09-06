import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import { FaSpinner, FaBookOpen, FaExclamationTriangle } from 'react-icons/fa';
import StatCard from '../../components/StatCard';

const LibraryPage = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['studentLibrary', user?.studentId],
    queryFn: async () => {
      const response = await api.get(`/library/students/${user?.studentId}/loans`);
      return response.data;
    },
    enabled: !!user?.studentId,
  });

  const loans = data?.data || [];
  const active = loans.filter(l => l.status === 'issued').length;
  const overdue = loans.filter(l => l.status === 'overdue').length;
  const totalFines = loans.reduce((sum, l) => sum + (l.fine_amount || 0), 0);

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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Library</h1>
        <p className="text-gray-500 mt-1">Your library loans</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FaBookOpen} title="Total Loans" value={loans.length} color="blue" />
        <StatCard icon={FaBookOpen} title="Active" value={active} color="green" />
        <StatCard icon={FaExclamationTriangle} title="Overdue" value={overdue} color="red" />
        <StatCard icon={FaBookOpen} title="Fines" value={`₦${totalFines}`} color="yellow" />
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Loan History</h3>
        {loans.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FaBookOpen className="text-4xl mx-auto mb-2 text-gray-300" />
            No library loans found
          </div>
        ) : (
          <div className="space-y-2">
            {loans.map((loan) => (
              <div key={loan.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="font-medium text-gray-800">{loan.books?.title || 'Book'}</p>
                  <p className="text-xs text-gray-500">{loan.books?.author}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  loan.status === 'returned' ? 'bg-green-100 text-green-800' :
                  loan.status === 'overdue' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {loan.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;