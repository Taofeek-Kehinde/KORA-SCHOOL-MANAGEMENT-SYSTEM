import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import {
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaMapMarker,
  FaUser,
  FaCheck,
  FaArrowRight,
  FaArrowLeft,
  FaSpinner,
  FaCheckCircle,
  FaClock,
  FaUpload,
  FaImage,
  FaUserTie,
} from 'react-icons/fa';

const SchoolRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    schoolName: '',
    schoolEmail: '',
    phoneNumber: '',
    country: 'Nigeria',
    state: '',
    city: '',
    schoolAddress: '',
    schoolType: 'private',
    schoolLogo: null,
    website: '',
    registrationNumber: '',
    principalName: '',
    vicePrincipalName: '',
    adminFullName: '',
    adminEmail: '',
    adminPhone: '',
  });

  const schoolTypes = [
    { value: 'nursery', label: 'Nursery School' },
    { value: 'primary', label: 'Primary School' },
    { value: 'junior_secondary', label: 'Junior Secondary School' },
    { value: 'senior_secondary', label: 'Senior Secondary School' },
    { value: 'combined', label: 'Combined Primary & Secondary' },
    { value: 'faith_based', label: 'Faith-Based School' },
    { value: 'international', label: 'International School' },
    { value: 'government', label: 'Government School' },
    { value: 'private', label: 'Private School' },
  ];

  const countries = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Other'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // =============================================
  // IMAGE COMPRESSION - FIXES "Payload Too Large"
  // =============================================
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 70% quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 2MB.');
        return;
      }

      setLogoFile(file);
      
      try {
        // Compress the image before uploading
        const compressedImage = await compressImage(file);
        setLogoPreview(compressedImage);
        setFormData(prev => ({ ...prev, schoolLogo: compressedImage }));
        toast.success('Logo uploaded successfully');
      } catch (error) {
        toast.error('Failed to process image');
        console.error('Image compression error:', error);
      }
    }
  };

  const handleSubmitSchoolDetails = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data - ensure logo is compressed
      const submitData = { ...formData };
      
      const response = await api.post('/registration/details', submitData);
      setRegistrationId(response.data.data.registration_id);
      toast.success('School details saved. Please verify your email.');
      setStep(2);
    } catch (error) {
      console.error('Submission error:', error);
      if (error.response?.status === 413) {
        toast.error('Image is too large. Please upload a smaller image.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to save school details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setLoading(true);
    try {
      const response = await api.post('/registration/verify-email', {
        registrationId: registrationId,
        token: 'demo-token'
      });
      toast.success('Email verified successfully!');
      if (response.data.data.all_verified) {
        setStep(4);
      } else {
        setStep(3);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    try {
      await api.post('/registration/resend-email', {
        registrationId: registrationId
      });
      toast.success('Verification email resent successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend email');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyPhone = async () => {
    setLoading(true);
    try {
      const response = await api.post('/registration/verify-phone', {
        registrationId: registrationId,
        code: verificationCode
      });
      toast.success('Phone verified successfully!');
      if (response.data.data.all_verified) {
        setStep(4);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify phone');
    } finally {
      setLoading(false);
    }
  };

  const handleResendPhone = async () => {
    setResendLoading(true);
    try {
      await api.post('/registration/resend-phone', {
        registrationId: registrationId
      });
      toast.success('Verification code resent successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    setLoading(true);
    try {
      const response = await api.post('/registration/submit-review', {
        registrationId: registrationId
      });
      toast.success('Registration submitted for review!');
      setStep(5);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit for review');
    } finally {
      setLoading(false);
    }
  };

  // Render Step 1: School Details (same as before)
  const renderStep1 = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Register Your School</h2>
        <p className="text-gray-500 mt-1">Fill in the details below to get started</p>
      </div>

      <form onSubmit={handleSubmitSchoolDetails}>
        <div className="space-y-6">
          {/* School Details Section */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaBuilding className="text-kora-primary" />
              School Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="e.g., Diamond College"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Email *</label>
                <input
                  type="email"
                  name="schoolEmail"
                  value={formData.schoolEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="school@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="08012345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Type</label>
                <select
                  name="schoolType"
                  value={formData.schoolType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                >
                  {schoolTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="https://www.yourschool.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="RC123456"
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaMapMarker className="text-kora-primary" />
              Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                >
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="Lagos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="Ikeja"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School Address</label>
                <input
                  type="text"
                  name="schoolAddress"
                  value={formData.schoolAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="123 Education Street"
                />
              </div>
            </div>
          </div>

          {/* School Leadership */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaUserTie className="text-kora-primary" />
              School Leadership
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Principal Name</label>
                <input
                  type="text"
                  name="principalName"
                  value={formData.principalName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="Dr. John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vice Principal Name</label>
                <input
                  type="text"
                  name="vicePrincipalName"
                  value={formData.vicePrincipalName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="Mrs. Jane Doe"
                />
              </div>
            </div>
          </div>

          {/* School Logo */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaImage className="text-kora-primary" />
              School Logo
            </h3>
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current.click()}
                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-kora-primary transition-colors overflow-hidden"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="School Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400">
                    <FaUpload className="text-2xl mx-auto" />
                    <span className="text-xs">Upload Logo</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="text-sm text-gray-500">
                <p>Recommended: Square image (300x300)</p>
                <p>Max size: 2MB</p>
                <p>Auto-compressed to reduce size</p>
                {logoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoPreview(null);
                      setLogoFile(null);
                      setFormData(prev => ({ ...prev, schoolLogo: null }));
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Administrator Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaUser className="text-kora-primary" />
              Administrator Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="adminFullName"
                  value={formData.adminFullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email *</label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Phone</label>
                <input
                  type="tel"
                  name="adminPhone"
                  value={formData.adminPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                  placeholder="08012345678"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaArrowRight />}
            Next Step
          </button>
        </div>
      </form>
    </div>
  );

  // Render Step 2: Verify Email
  const renderStep2 = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Verify Your Email</h2>
        <p className="text-gray-500">We've sent a verification link to your email</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <FaEnvelope className="text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm text-blue-700">
              A verification email has been sent to <strong>{formData.adminEmail}</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">Please check your inbox and click the verification link.</p>
            <p className="text-xs text-blue-600">Link expires in 24 hours.</p>
          </div>
        </div>
      </div>

      <div className="text-center space-y-3">
        <button
          onClick={handleVerifyEmail}
          disabled={loading}
          className="px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
          I've Verified My Email
        </button>
        <button
          onClick={handleResendEmail}
          disabled={resendLoading}
          className="text-sm text-kora-primary hover:underline block"
        >
          {resendLoading ? <FaSpinner className="animate-spin inline" /> : 'Resend verification email'}
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <FaArrowLeft /> Back
        </button>
        <button
          onClick={() => setStep(3)}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          Skip for now <FaArrowRight />
        </button>
      </div>
    </div>
  );

  // Render Step 3: Verify Phone
  const renderStep3 = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Verify Your Phone</h2>
        <p className="text-gray-500">Enter the verification code sent to your phone</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <FaPhone className="text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm text-blue-700">
              A verification code has been sent to <strong>{formData.phoneNumber}</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">Code expires in 10 minutes.</p>
          </div>
        </div>
      </div>

      <div className="max-w-xs mx-auto">
        <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary text-center text-2xl font-mono"
          placeholder="000000"
          maxLength="6"
        />
        <button
          onClick={handleVerifyPhone}
          disabled={loading || verificationCode.length < 6}
          className="w-full mt-4 px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
          Verify Phone
        </button>
        <button
          onClick={handleResendPhone}
          disabled={resendLoading}
          className="mt-2 text-sm text-kora-primary hover:underline block mx-auto"
        >
          {resendLoading ? <FaSpinner className="animate-spin inline" /> : 'Resend code'}
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
        <button
          onClick={() => setStep(2)}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <FaArrowLeft /> Back
        </button>
        <button
          onClick={() => setStep(4)}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          Skip for now <FaArrowRight />
        </button>
      </div>
    </div>
  );

  // Render Step 4: Submit Review
  const renderStep4 = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Almost There!</h2>
        <p className="text-gray-500">Your registration is complete. Submit for review.</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <FaCheckCircle className="text-green-500 text-2xl" />
          <div>
            <p className="font-semibold text-green-800">All verified!</p>
            <p className="text-sm text-green-700">
              Email verified • Phone {formData.phoneNumber ? 'verified' : 'skipped'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-700 mb-2">Registration Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-gray-500">School:</span>
          <span className="font-medium">{formData.schoolName}</span>
          <span className="text-gray-500">Email:</span>
          <span className="font-medium">{formData.schoolEmail}</span>
          <span className="text-gray-500">Admin:</span>
          <span className="font-medium">{formData.adminFullName}</span>
          <span className="text-gray-500">Type:</span>
          <span className="font-medium">{schoolTypes.find(t => t.value === formData.schoolType)?.label || formData.schoolType}</span>
          <span className="text-gray-500">Location:</span>
          <span className="font-medium">{formData.city}, {formData.state}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <button
          onClick={() => {
            if (formData.phoneNumber) {
              setStep(3);
            } else {
              setStep(2);
            }
          }}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
        >
          <FaArrowLeft /> Back
        </button>
        <button
          onClick={handleSubmitForReview}
          disabled={loading}
          className="flex-1 px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaArrowRight />}
          Submit for Review
        </button>
      </div>
    </div>
  );

  // Render Step 5: Success
  const renderStep5 = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-2xl mx-auto">
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaCheckCircle className="text-green-500 text-4xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Registration Submitted!</h2>
        <p className="text-gray-500 mt-2">
          Your school registration has been submitted for review.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6 text-left">
          <div className="flex items-start gap-3">
            <FaClock className="text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800">What happens next?</p>
              <ul className="text-sm text-blue-700 space-y-1 mt-1">
                <li>• An administrator will review your application</li>
                <li>• You will receive an email notification once approved</li>
                <li>• You can then log in and start configuring your school dashboard</li>
              </ul>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary"
        >
          Return to Home
        </button>
      </div>
    </div>
  );

  // Progress Steps
  const progressSteps = [
    { id: 1, label: 'School Details' },
    { id: 2, label: 'Verify Email' },
    { id: 3, label: 'Verify Phone' },
    { id: 4, label: 'Submit Review' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {progressSteps.map((item, index) => (
              <div key={item.id} className="flex-1">
                <div className={`h-1 ${step > item.id ? 'bg-kora-primary' : step === item.id ? 'bg-kora-primary' : 'bg-gray-200'}`} />
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step > item.id ? 'bg-kora-primary text-white' :
                    step === item.id ? 'bg-kora-primary text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {step > item.id ? <FaCheck /> : item.id}
                  </div>
                  <span className={`text-xs ${step >= item.id ? 'text-gray-700' : 'text-gray-400'}`}>
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
    </div>
  );
};

export default SchoolRegistration;