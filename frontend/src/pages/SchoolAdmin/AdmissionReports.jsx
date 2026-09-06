import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import {
  FaSpinner, FaDownload, FaUsers, FaCheckCircle, FaTimesCircle, FaMoneyBillWave, FaFileAlt, FaChartBar
} from 'react-icons/fa';
import StatCard from '../../components/StatCard';

const AdmissionReports = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('overview');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Fetch reports
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admissionReports', user?.schoolId, reportType, dateFrom, dateTo],
    queryFn: async () => {
      const response = await api.get(`/admission-reports/schools/${user?.schoolId}/reports`, {
        params: {
          reportType,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined
        }
      });
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  // Fetch capacity status
  const { data: capacityData } = useQuery({
    queryKey: ['capacityStatus', user?.schoolId],
    queryFn: async () => {
      const response = await api.get(`/admission-reports/schools/${user?.schoolId}/capacity`);
      return response.data;
    },
    enabled: !!user?.schoolId,
  });

  const report = data?.data || {};
  const capacity = capacityData?.data || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleExport = () => {
    window.print();
  };

  const reportTypes = [
    { value: 'overview', label: 'Overview' },
    { value: 'by_class', label: 'By Class' },
    { value: 'by_gender', label: 'By Gender' },
    { value: 'by_location', label: 'By Location' },
    { value: 'revenue', label: 'Revenue' }
  ];

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
          <h3 className="text-xl font-semibold text-gray-700">Failed to Load Reports</h3>
          <p className="text-gray-500">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admission Reports</h1>
          <p className="text-gray-500 mt-1">Analyze admission data and trends</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2 mt-3 md:mt-0"
        >
          <FaDownload /> Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          >
            {reportTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            placeholder="To"
          />
        </div>
      </div>

      {/* Overview Report */}
      {reportType === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={FaUsers} title="Total Applications" value={report.total_applications || 0} color="blue" />
          <StatCard icon={FaCheckCircle} title="Approved" value={report.approved || 0} color="green" />
          <StatCard icon={FaTimesCircle} title="Rejected" value={report.rejected || 0} color="red" />
          <StatCard icon={FaCheckCircle} title="Enrolled" value={report.enrolled || 0} color="emerald" />
        </div>
      )}

      {/* By Class Report */}
      {reportType === 'by_class' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Applications by Class</h3>
          {Object.keys(report.by_class || {}).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(report.by_class).map(([className, count]) => (
                <div key={className} className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-kora-primary">{count}</p>
                  <p className="text-sm text-gray-500">{className}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No data available</p>
          )}
        </div>
      )}

      {/* By Gender Report */}
      {reportType === 'by_gender' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Applications by Gender</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{report.by_gender?.male || 0}</p>
              <p className="text-sm text-gray-500">Male</p>
            </div>
            <div className="bg-pink-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-pink-600">{report.by_gender?.female || 0}</p>
              <p className="text-sm text-gray-500">Female</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-600">{report.by_gender?.other || 0}</p>
              <p className="text-sm text-gray-500">Other</p>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Report */}
      {reportType === 'revenue' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={FaMoneyBillWave} title="Total Revenue" value={formatCurrency(report.total_revenue)} color="green" />
          <StatCard icon={FaMoneyBillWave} title="Paid Revenue" value={formatCurrency(report.paid_revenue)} color="emerald" />
          <StatCard icon={FaMoneyBillWave} title="Outstanding" value={formatCurrency(report.outstanding_revenue)} color="red" />
          <StatCard icon={FaMoneyBillWave} title="Fees Paid" value={report.fee_paid_count || 0} color="blue" />
        </div>
      )}

      {/* Capacity Status */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Capacity Quotas</h3>
        {Object.keys(capacity).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(capacity).map(([classId, data]) => (
              <div key={classId} className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-gray-800">{classId}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="text-gray-400">Capacity:</span> {data.capacity}</p>
                  <p><span className="text-gray-400">Enrolled:</span> {data.enrolled}</p>
                  <p><span className="text-gray-400">Remaining:</span> {data.remaining}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                    data.is_full ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {data.is_full ? 'Full' : 'Available'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No capacity quotas set</p>
        )}
      </div>
    </div>
  );
};

export default AdmissionReports;