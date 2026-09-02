import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import * as XLSX from 'xlsx';
import {
  FaUpload,
  FaFileExcel,
  FaDownload,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaSpinner,
  FaUsers,
  FaEye,
  FaArrowRight,
  FaArrowLeft,
  FaCheckCircle,
  FaTimesCircle,
  FaFileUpload,
} from 'react-icons/fa';

const BulkImport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [importResult, setImportResult] = useState(null);

  // Upload and parse file
  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post(`/bulk-import/schools/${user?.schoolId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: (data) => {
      setPreviewData(data.data);
      setCurrentStep(2);
      toast.success(`File parsed! ${data.data.valid_rows} valid rows found`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to parse file');
    }
  });

  // Import students
  const importMutation = useMutation({
    mutationFn: async (students) => {
      const response = await api.post(`/bulk-import/schools/${user?.schoolId}/import`, {
        students
      });
      return response.data;
    },
    onSuccess: (data) => {
      setImportResult(data.data);
      setCurrentStep(3);
      toast.success(`Successfully imported ${data.data.summary.successful} students!`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to import students');
    }
  });

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/bulk-import/template', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student-import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded!');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // Upload file
  const handleUpload = () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    uploadMutation.mutate(formData);
  };

  // Import students
  const handleImport = () => {
    if (!previewData?.valid || previewData.valid.length === 0) {
      toast.error('No valid students to import');
      return;
    }

    const students = previewData.valid.map(v => v.data);
    importMutation.mutate(students);
  };

  // Reset and start over
  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setImportResult(null);
    setCurrentStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Bulk Student Import</h1>
          <p className="text-gray-500 mt-1">Import multiple students from Excel/CSV file</p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2 mt-3 md:mt-0"
        >
          <FaDownload />
          Download Template
        </button>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-between mb-8">
        {['Upload File', 'Preview', 'Import Results'].map((label, index) => (
          <div key={index} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep > index ? 'bg-green-500' : currentStep === index + 1 ? 'bg-kora-primary' : 'bg-gray-300'
            } text-white text-sm font-medium`}>
              {currentStep > index ? <FaCheck /> : index + 1}
            </div>
            <span className={`ml-2 text-sm ${currentStep >= index + 1 ? 'text-gray-700' : 'text-gray-400'}`}>
              {label}
            </span>
            {index < 2 && <div className={`w-16 h-0.5 mx-2 ${currentStep > index ? 'bg-green-500' : 'bg-gray-300'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload File */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <FaFileExcel className="text-6xl text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Drop your Excel/CSV file here
            </h3>
            <p className="text-gray-500 mb-4">
              or click to browse files (Max: 10MB)
            </p>
            <label
              htmlFor="file-upload"
              className="px-6 py-3 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary cursor-pointer inline-block"
            >
              <FaUpload className="inline mr-2" />
              Select File
            </label>
            {file && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={uploadMutation.isLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {uploadMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                  Upload & Parse
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Required Columns:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700">
              <span>• First Name *</span>
              <span>• Last Name *</span>
              <span>• Gender *</span>
              <span>• Date of Birth *</span>
              <span>• Admission Number</span>
              <span>• Class ID</span>
              <span>• Email</span>
              <span>• Phone</span>
              <span>• House</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview Data */}
      {currentStep === 2 && previewData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{previewData.total_rows}</p>
              <p className="text-sm text-gray-500">Total Rows</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{previewData.valid_rows}</p>
              <p className="text-sm text-gray-500">Valid</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{previewData.invalid_rows}</p>
              <p className="text-sm text-gray-500">Invalid</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{previewData.duplicate_rows}</p>
              <p className="text-sm text-gray-500">Duplicates</p>
            </div>
          </div>

          {/* Valid Students Preview */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              Valid Students ({previewData.valid.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">DOB</th>
                    <th className="px-4 py-3">Admission</th>
                    <th className="px-4 py-3">Class</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {previewData.valid.slice(0, 10).map((student, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{student.row_number}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {student.data.first_name} {student.data.last_name}
                      </td>
                      <td className="px-4 py-3 capitalize">{student.data.gender}</td>
                      <td className="px-4 py-3">{student.data.date_of_birth}</td>
                      <td className="px-4 py-3">{student.data.admission_number}</td>
                      <td className="px-4 py-3">{student.data.class_id || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.valid.length > 10 && (
              <p className="text-sm text-gray-500 mt-2">
                Showing 10 of {previewData.valid.length} students
              </p>
            )}
          </div>

          {/* Invalid Students */}
          {previewData.invalid.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaExclamationTriangle className="text-red-500" />
                Invalid Rows ({previewData.invalid.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-50">
                    <tr className="text-left text-xs font-medium text-red-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Row</th>
                      <th className="px-4 py-3">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewData.invalid.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">Row {item.row_number}</td>
                        <td className="px-4 py-3">
                          <ul className="list-disc list-inside text-sm text-red-600">
                            {item.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Duplicate Students */}
          {previewData.duplicates.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaTimesCircle className="text-yellow-500" />
                Duplicate Records ({previewData.duplicates.length})
              </h3>
              <div className="space-y-2">
                {previewData.duplicates.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-yellow-50 rounded-lg p-3">
                    <span className="text-sm text-gray-700">Row {item.row_number}</span>
                    <span className="text-sm text-yellow-700">{item.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <FaArrowLeft />
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing || previewData.valid.length === 0}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
            >
              {importing ? <FaSpinner className="animate-spin" /> : <FaUsers />}
              Import {previewData.valid.length} Students
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {currentStep === 3 && importResult && (
        <div className="space-y-6">
          {/* Success Summary */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800">Import Complete!</h2>
            <p className="text-green-600 mt-2">
              Successfully imported {importResult.summary.successful} out of {importResult.summary.total} students
            </p>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{importResult.summary.successful}</p>
              <p className="text-sm text-gray-500">Successfully Imported</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{importResult.summary.failed}</p>
              <p className="text-sm text-gray-500">Failed</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{importResult.summary.total}</p>
              <p className="text-sm text-gray-500">Total Processed</p>
            </div>
          </div>

          {/* Successful Imports */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Successfully Imported</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-50">
                  <tr className="text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Admission</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {importResult.successful.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {item.student.first_name} {item.student.last_name}
                      </td>
                      <td className="px-4 py-3">{item.student.admission_number}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Success
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Failed Imports */}
          {importResult.failed.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Failed Imports</h3>
              <div className="space-y-2">
                {importResult.failed.map((item, idx) => (
                  <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="font-medium text-red-700">
                      {item.student.first_name} {item.student.last_name}
                    </p>
                    <p className="text-sm text-red-600">{item.error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary"
            >
              Import More Students
            </button>
            <button
              onClick={() => navigate('/school/students')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              View Students
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkImport;