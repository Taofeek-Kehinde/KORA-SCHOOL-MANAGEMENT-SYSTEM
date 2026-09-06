import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaUser, FaUsers, FaPhone, FaEnvelope, FaMapMarker, FaCalendarAlt, FaSpinner, FaCheck, FaUpload, FaTimes, FaArrowRight, FaArrowLeft } from 'react-icons/fa';

const ApplyForAdmission = () => {
  const { user } = useAuth();
  const { schoolId: urlSchoolId } = useParams();
  const schoolId = urlSchoolId || user?.schoolId;
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    studentFirstName: '',
    studentLastName: '',
    studentMiddleName: '',
    dateOfBirth: '',
    gender: '',
    nationality: 'Nigeria',
    stateOfOrigin: '',
    localGovernment: '',
    residentialAddress: '',
    previousSchool: '',
    classApplyingFor: '',
    parentName: '',
    parentRelationship: 'guardian',
    parentPhone: '',
    parentEmail: '',
    parentOccupation: '',
    parentEmployer: '',
    parentAddress: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    passportUrl: ''
  });

  // Fetch classes
  const { data: classesData } = useQuery({
    queryKey: ['classes', schoolId],
    queryFn: async () => {
      const response = await api.get(`/academic/schools/${schoolId}/classes`);
      return response.data;
    },
    enabled: !!schoolId,
  });

  const classes = classesData?.data || [];

  // Submit application
  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post(`/admissions/schools/${schoolId}/applications`, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Application submitted successfully!');
      navigate(`/admissions/status/${data.data.id}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.studentFirstName || !formData.studentLastName || !formData.parentName || !formData.parentPhone) {
      toast.error('Please fill in all required fields');
      return;
    }
    submitMutation.mutate(formData);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(3, prev + 1));
  const prevStep = () => setCurrentStep(prev => Math.max(1, prev - 1));

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Apply for Admission</h1>
        <p className="text-gray-500 mt-1">Complete the application form to apply for admission</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {['Student Details', 'Parent Details', 'Emergency Contact'].map((label, index) => (
          <div key={index} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep > index ? 'bg-green-500' : currentStep === index + 1 ? 'bg-kora-primary' : 'bg-gray-300'} text-white text-sm font-medium`}>
              {currentStep > index ? <FaCheck /> : index + 1}
            </div>
            <span className={`ml-2 text-sm ${currentStep >= index + 1 ? 'text-gray-700' : 'text-gray-400'}`}>{label}</span>
            {index < 2 && <div className={`w-12 h-0.5 mx-2 ${currentStep > index ? 'bg-green-500' : 'bg-gray-300'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-md p-6">
          {/* Step 1: Student Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Student Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" name="studentFirstName" value={formData.studentFirstName} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input type="text" name="studentLastName" value={formData.studentLastName} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <input type="text" name="studentMiddleName" value={formData.studentMiddleName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary">
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Applying For *</label>
                  <select name="classApplyingFor" value={formData.classApplyingFor} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary">
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                  <input type="text" name="nationality" value={formData.nationality} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State of Origin</label>
                  <input type="text" name="stateOfOrigin" value={formData.stateOfOrigin} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LGA</label>
                  <input type="text" name="localGovernment" value={formData.localGovernment} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous School</label>
                  <input type="text" name="previousSchool" value={formData.previousSchool} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Residential Address</label>
                  <textarea name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} rows="2" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
              </div>
              <button type="button" onClick={nextStep} className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2">
                Next <FaArrowRight />
              </button>
            </div>
          )}

          {/* Step 2: Parent Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Parent/Guardian Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name *</label>
                  <input type="text" name="parentName" value={formData.parentName} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <select name="parentRelationship" value={formData.parentRelationship} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary">
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" name="parentPhone" value={formData.parentPhone} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input type="text" name="parentOccupation" value={formData.parentOccupation} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
                  <input type="text" name="parentEmployer" value={formData.parentEmployer} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent Address</label>
                  <textarea name="parentAddress" value={formData.parentAddress} onChange={handleChange} rows="2" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={prevStep} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                  <FaArrowLeft /> Back
                </button>
                <button type="button" onClick={nextStep} className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary flex items-center gap-2">
                  Next <FaArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Emergency Contact */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                  <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <input type="text" name="emergencyContactRelationship" value={formData.emergencyContactRelationship} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={prevStep} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
                  <FaArrowLeft /> Back
                </button>
                <button type="submit" disabled={submitMutation.isLoading} className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2">
                  {submitMutation.isLoading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  Submit Application
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default ApplyForAdmission;