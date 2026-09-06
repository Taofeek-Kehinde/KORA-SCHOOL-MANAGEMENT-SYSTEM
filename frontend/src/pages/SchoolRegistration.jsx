import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { motion } from 'framer-motion';
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
  FaShieldAlt,
  FaGraduationCap,
  FaSchool
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
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 2MB.');
        return;
      }

      setLogoFile(file);
      
      try {
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

  const renderStep1 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 md:p-8 max-w-3xl mx-auto border border-white/50 select-none"
    >
      <div className="text-center mb-8">
        <motion.div 
          whileHover={{ scale: 1.05, rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden"
        >
          <img
            src="/hero.png"
            alt="Kora School Management"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
          style={{ 
            fontFamily: "'Poppins', 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
            textShadow: "0 2px 25px rgba(99, 102, 241, 0.3), 0 4px 40px rgba(99, 102, 241, 0.15)"
          }}
        >
          Register Your School
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500 mt-1 font-light select-none"
          style={{ 
            fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
            textShadow: "0 1px 10px rgba(0, 0, 0, 0.05)"
          }}
        >
          Fill in the details below to get started
        </motion.p>
      </div>

      <form onSubmit={handleSubmitSchoolDetails}>
        <div className="space-y-6">
          <div className="border-b border-gray-200/60 pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2 select-none" style={{ 
              fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
              textShadow: "0 1px 8px rgba(0, 0, 0, 0.06)"
            }}>
              <FaBuilding className="text-blue-500" />
              School Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
                }}>School Name *</label>
                <input
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                  style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                  placeholder="e.g., Diamond College"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
                }}>School Email *</label>
                <input
                  type="email"
                  name="schoolEmail"
                  value={formData.schoolEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                  style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                  placeholder="school@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
                }}>Phone Number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                  style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                  placeholder="08012345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
                }}>School Type</label>
                <select
                  name="schoolType"
                  value={formData.schoolType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                  style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                >
                  {schoolTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
                }}>Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                  style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                  placeholder="https://www.yourschool.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
                }}>Registration Number</label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                  style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                  placeholder="RC123456"
                />
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200/60 pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2 select-none" style={{ 
              fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
              textShadow: "0 1px 8px rgba(0, 0, 0, 0.06)"
            }}>
              <FaMapMarker className="text-blue-500" />
              Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
                }}>Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                  style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                >
                  {countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
                }}>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                  style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                  placeholder="Lagos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
                }}>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                  style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                  placeholder="Ikeja"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
                }}>School Address</label>
                <input
                  type="text"
                  name="schoolAddress"
                  value={formData.schoolAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                  style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                  placeholder="123 Education Street"
                />
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200/60 pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2 select-none" style={{ 
              fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
              textShadow: "0 1px 8px rgba(0, 0, 0, 0.06)"
            }}>
              <FaUserTie className="text-blue-500" />
              School Leadership
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
                }}>Principal Name</label>
                <input
                  type="text"
                  name="principalName"
                  value={formData.principalName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                  style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                  placeholder="Dr. John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
                }}>Vice Principal Name</label>
                <input
                  type="text"
                  name="vicePrincipalName"
                  value={formData.vicePrincipalName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                  style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                  placeholder="Mrs. Jane Doe"
                />
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200/60 pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2 select-none" style={{ 
              fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
              textShadow: "0 1px 8px rgba(0, 0, 0, 0.06)"
            }}>
              <FaImage className="text-blue-500" />
              School Logo
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current.click()}
                className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all duration-300 overflow-hidden bg-gray-50/50"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="School Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400 select-none">
                    <FaUpload className="text-3xl mx-auto" />
                    <span className="text-xs font-medium">Upload Logo</span>
                  </div>
                )}
              </motion.div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="text-sm text-gray-500 space-y-1 select-none" style={{ 
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
              }}>
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
                    className="text-red-500 hover:text-red-600 font-medium transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2 select-none" style={{ 
              fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
              textShadow: "0 1px 8px rgba(0, 0, 0, 0.06)"
            }}>
              <FaUser className="text-blue-500" />
              Administrator Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
                }}>Full Name *</label>
                <input
                  type="text"
                  name="adminFullName"
                  value={formData.adminFullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                  style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
                }}>Admin Email *</label>
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                  style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
                }}>Admin Phone</label>
                <input
                  type="tel"
                  name="adminPhone"
                  value={formData.adminPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-300"
                  style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
                  placeholder="08012345678"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200/60 flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-70 flex items-center gap-2 font-medium select-none"
            style={{ 
              fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
              textShadow: "0 2px 12px rgba(255, 255, 255, 0.3)"
            }}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaArrowRight />}
            Next Step
          </motion.button>
        </div>
      </form>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl mx-auto border border-white/50 select-none"
    >
      <div className="text-center mb-8">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden"
        >
          <img
            src="/hero.png"
            alt="Kora School Management"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
          style={{ 
            fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
            textShadow: "0 2px 25px rgba(99, 102, 241, 0.3), 0 4px 40px rgba(99, 102, 241, 0.15)"
          }}
        >
          Verify Your Email
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500 mt-1 font-light select-none"
          style={{ 
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            textShadow: "0 1px 10px rgba(0, 0, 0, 0.05)"
          }}
        >
          We've sent a verification link to your email
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <FaEnvelope className="text-blue-500 mt-0.5 text-lg" />
          <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
            <p className="text-sm text-blue-700 select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>
              A verification email has been sent to <strong>{formData.adminEmail}</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1 select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>Please check your inbox and click the verification link.</p>
            <p className="text-xs text-blue-600 select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>Link expires in 24 hours.</p>
          </div>
        </div>
      </motion.div>

      <div className="text-center space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleVerifyEmail}
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-70 flex items-center gap-2 mx-auto font-medium select-none"
          style={{ 
            fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
            textShadow: "0 2px 12px rgba(255, 255, 255, 0.3)"
          }}
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
          I've Verified My Email
        </motion.button>
        <button
          onClick={handleResendEmail}
          disabled={resendLoading}
          className="text-sm text-blue-600 hover:text-indigo-600 font-medium transition-colors block mx-auto select-none"
          style={{ 
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
          }}
        >
          {resendLoading ? <FaSpinner className="animate-spin inline mr-1" /> : null}
          {resendLoading ? 'Sending...' : 'Resend verification email'}
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200/60 flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors font-medium select-none"
          style={{ 
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
          }}
        >
          <FaArrowLeft /> Back
        </button>
        <button
          onClick={() => setStep(3)}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors font-medium select-none"
          style={{ 
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
          }}
        >
          Skip for now <FaArrowRight />
        </button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl mx-auto border border-white/50 select-none"
    >
      <div className="text-center mb-8">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden"
        >
          <img
            src="/hero.png"
            alt="Kora School Management"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
          style={{ 
            fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
            textShadow: "0 2px 25px rgba(99, 102, 241, 0.3), 0 4px 40px rgba(99, 102, 241, 0.15)"
          }}
        >
          Verify Your Phone
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500 mt-1 font-light select-none"
          style={{ 
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            textShadow: "0 1px 10px rgba(0, 0, 0, 0.05)"
          }}
        >
          Enter the verification code sent to your phone
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <FaPhone className="text-blue-500 mt-0.5 text-lg" />
          <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
            <p className="text-sm text-blue-700 select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>
              A verification code has been sent to <strong>{formData.phoneNumber}</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1 select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>Code expires in 10 minutes.</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-xs mx-auto">
        <label className="block text-sm font-medium text-gray-700 mb-1.5 select-none" style={{ 
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
        }}>Verification Code</label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-center text-2xl font-mono bg-gray-50/50 hover:border-blue-300"
          placeholder="000000"
          maxLength="6"
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleVerifyPhone}
          disabled={loading || verificationCode.length < 6}
          className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 font-medium select-none"
          style={{ 
            fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
            textShadow: "0 2px 12px rgba(255, 255, 255, 0.3)"
          }}
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaCheck />}
          Verify Phone
        </motion.button>
        <button
          onClick={handleResendPhone}
          disabled={resendLoading}
          className="mt-2 text-sm text-blue-600 hover:text-indigo-600 font-medium transition-colors block mx-auto select-none"
          style={{ 
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
          }}
        >
          {resendLoading ? <FaSpinner className="animate-spin inline mr-1" /> : null}
          {resendLoading ? 'Sending...' : 'Resend code'}
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200/60 flex justify-between">
        <button
          onClick={() => setStep(2)}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors font-medium select-none"
          style={{ 
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
          }}
        >
          <FaArrowLeft /> Back
        </button>
        <button
          onClick={() => setStep(4)}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors font-medium select-none"
          style={{ 
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
          }}
        >
          Skip for now <FaArrowRight />
        </button>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl mx-auto border border-white/50 select-none"
    >
      <div className="text-center mb-8">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden"
        >
          <img
            src="/hero.png"
            alt="Kora School Management"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
          style={{ 
            fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
            textShadow: "0 2px 25px rgba(16, 185, 129, 0.3), 0 4px 40px rgba(16, 185, 129, 0.15)"
          }}
        >
          Almost There!
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500 mt-1 font-light select-none"
          style={{ 
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            textShadow: "0 1px 10px rgba(0, 0, 0, 0.05)"
          }}
        >
          Your registration is complete. Submit for review.
        </motion.p>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-xl p-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <FaCheckCircle className="text-green-500 text-2xl" />
          <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
            <p className="font-semibold text-green-800 select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>All verified!</p>
            <p className="text-sm text-green-700 select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>
              Email verified • Phone {formData.phoneNumber ? 'verified' : 'skipped'}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-200/60"
      >
        <h4 className="font-semibold text-gray-700 mb-2 select-none" style={{ 
          fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
          textShadow: "0 1px 8px rgba(0, 0, 0, 0.06)"
        }}>Registration Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-sm" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
          <span className="text-gray-500 select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>School:</span>
          <span className="font-medium select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>{formData.schoolName}</span>
          <span className="text-gray-500 select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>Email:</span>
          <span className="font-medium select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>{formData.schoolEmail}</span>
          <span className="text-gray-500 select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>Admin:</span>
          <span className="font-medium select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>{formData.adminFullName}</span>
          <span className="text-gray-500 select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>Type:</span>
          <span className="font-medium select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>{schoolTypes.find(t => t.value === formData.schoolType)?.label || formData.schoolType}</span>
          <span className="text-gray-500 select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>Location:</span>
          <span className="font-medium select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>{formData.city}, {formData.state}</span>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => {
            if (formData.phoneNumber) {
              setStep(3);
            } else {
              setStep(2);
            }
          }}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 flex items-center justify-center gap-2 font-medium flex-1 select-none"
          style={{ 
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)"
          }}
        >
          <FaArrowLeft /> Back
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmitForReview}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 font-medium select-none"
          style={{ 
            fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
            textShadow: "0 2px 12px rgba(255, 255, 255, 0.3)"
          }}
        >
          {loading ? <FaSpinner className="animate-spin" /> : <FaArrowRight />}
          Submit for Review
        </motion.button>
      </div>
    </motion.div>
  );

  const renderStep5 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl mx-auto border border-white/50 select-none"
    >
      <div className="text-center py-8">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden"
        >
          <img
            src="/hero.png"
            alt="Kora School Management"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
          style={{ 
            fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
            textShadow: "0 2px 25px rgba(16, 185, 129, 0.3), 0 4px 40px rgba(16, 185, 129, 0.15)"
          }}
        >
          Registration Submitted!
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-500 mt-2 font-light select-none"
          style={{ 
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            textShadow: "0 1px 10px rgba(0, 0, 0, 0.05)"
          }}
        >
          Your school registration has been submitted for review.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl p-4 mt-6 text-left"
        >
          <div className="flex items-start gap-3">
            <FaClock className="text-blue-500 mt-0.5 text-lg" />
            <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
              <p className="font-semibold text-blue-800 select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>What happens next?</p>
              <ul className="text-sm text-blue-700 space-y-1 mt-1">
                <li className="select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>• An administrator will review your application</li>
                <li className="select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>• You will receive an email notification once approved</li>
                <li className="select-none" style={{ textShadow: "0 1px 6px rgba(0, 0, 0, 0.04)" }}>• You can then log in and start configuring your school dashboard</li>
              </ul>
            </div>
          </div>
        </motion.div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/')}
          className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 font-medium select-none"
          style={{ 
            fontFamily: "'Poppins', 'Inter', 'Segoe UI', sans-serif",
            textShadow: "0 2px 12px rgba(255, 255, 255, 0.3)"
          }}
        >
          Return to Home
        </motion.button>
      </div>
    </motion.div>
  );

  const progressSteps = [
    { id: 1, label: 'School Details' },
    { id: 2, label: 'Verify Email' },
    { id: 3, label: 'Verify Phone' },
    { id: 4, label: 'Submit Review' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 md:py-12 relative overflow-hidden select-none">
      {/* Animated background circles */}
      <motion.div 
        className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-blue-200 rounded-full opacity-20"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0]
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div 
        className="absolute bottom-[-100px] left-[-100px] w-80 h-80 bg-purple-200 rounded-full opacity-20"
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, -90, 0]
        }}
        transition={{ 
          duration: 25, 
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full opacity-10"
        animate={{ 
          scale: [1, 1.5, 1],
        }}
        transition={{ 
          duration: 30, 
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {progressSteps.map((item, index) => (
              <div key={item.id} className="flex-1">
                <div className={`h-1 ${step > item.id ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : step === item.id ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-200'}`} />
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                    step > item.id ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' :
                    step === item.id ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {step > item.id ? <FaCheck className="text-sm" /> : item.id}
                  </div>
                  <span className={`text-xs font-medium ${step >= item.id ? 'text-gray-700' : 'text-gray-400'} select-none`} style={{ 
                    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                    textShadow: step >= item.id ? "0 1px 6px rgba(0, 0, 0, 0.04)" : "none"
                  }}>
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