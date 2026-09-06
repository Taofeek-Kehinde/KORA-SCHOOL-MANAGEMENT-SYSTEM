import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaSpinner, FaCheck, FaTimes, FaFileAlt, FaDownload, FaPrint } from 'react-icons/fa';

const AdmissionLetters = () => {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [letterType, setLetterType] = useState('admission');

  // Fetch application
  const { data: appData } = useQuery({
    queryKey: ['applicationForLetter', applicationId],
    queryFn: async () => {
      const response = await api.get(`/admissions/schools/${user?.schoolId}/applications/${applicationId}`);
      return response.data;
    },
    enabled: !!applicationId,
  });

  // Fetch letters
  const { data: lettersData, isLoading, refetch } = useQuery({
    queryKey: ['admissionLetters', applicationId],
    queryFn: async () => {
      const response = await api.get(`/admission-letters/applications/${applicationId}/letters`);
      return response.data;
    },
    enabled: !!applicationId,
  });

  // Generate letter
  const generateLetterMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/admission-letters/schools/${user?.schoolId}/applications/${applicationId}/letters`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Admission letter generated successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate letter');
    }
  });

  const letters = lettersData?.data || [];
  const application = appData?.data;

  const handleGenerate = () => {
    generateLetterMutation.mutate({ letterType });
  };

  const handlePrint = (letter) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(letter.content);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-kora-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admission Letters</h1>
        <p className="text-gray-500 mt-1">
          {application ? `${application.student_first_name} ${application.student_last_name} - ${application.application_number}` : 'Generate admission letters'}
        </p>
      </div>

      {/* Generate Letter */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Letter</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={letterType}
            onChange={(e) => setLetterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          >
            <option value="admission">Admission Letter</option>
            <option value="rejection">Rejection Letter</option>
            <option value="waitlist">Waitlist Letter</option>
          </select>
          <button
            onClick={handleGenerate}
            disabled={generateLetterMutation.isLoading}
            className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
          >
            {generateLetterMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaFileAlt />}
            Generate Letter
          </button>
        </div>
      </div>

      {/* Letters List */}
      {letters.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaFileAlt className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Letters Generated</h3>
          <p className="text-gray-500">Click "Generate Letter" to create the first letter</p>
        </div>
      ) : (
        <div className="space-y-4">
          {letters.map((letter) => (
            <div key={letter.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{letter.letter_type}</p>
                  <p className="text-xs text-gray-500">{new Date(letter.generated_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePrint(letter)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                  >
                    <FaPrint className="text-sm" /> Print
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdmissionLetters;