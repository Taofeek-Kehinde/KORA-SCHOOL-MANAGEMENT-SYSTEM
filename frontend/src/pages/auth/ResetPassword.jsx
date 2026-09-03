import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaArrowLeft, FaCheckCircle, FaEye, FaEyeSlash, FaLock, FaSpinner } from 'react-icons/fa';

const OTP_LENGTH = 6;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get('email') || '';
  const codeFromQuery = searchParams.get('code') || '';

  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    }
  }, [emailFromQuery]);

  useEffect(() => {
    if (codeFromQuery && codeFromQuery.length === OTP_LENGTH) {
      const digits = codeFromQuery.split('').slice(0, OTP_LENGTH);
      const next = Array.from({ length: OTP_LENGTH }).map((_, i) => digits[i] || '');
      setCode(next);
      // small delay to ensure state updates before verifying
      setTimeout(() => {
        handleVerifyCode();
      }, 250);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeFromQuery]);

  const otpValue = useMemo(() => code.join(''), [code]);

  const handleCodeInput = (index, value) => {
    const sanitizedValue = value.replace(/\D/g, '').slice(0, 1);
    const nextCode = [...code];
    nextCode[index] = sanitizedValue;
    setCode(nextCode);

    if (sanitizedValue && index < OTP_LENGTH - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleCodeKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyCode = async () => {
    const currentOtp = otpValue.trim();

    if (!email) {
      toast.error('Please enter your email first');
      return;
    }

    if (currentOtp.length !== OTP_LENGTH) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    const cleanEmail = String(email || '').trim().toLowerCase();

    setIsVerifying(true);
    try {
      const response = await api.post('/auth/verify-reset-code', {
        email: cleanEmail,
        code: currentOtp
      });

      toast.success(response.data.message || 'Code verified successfully');
      setIsCodeVerified(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email || !newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const cleanEmail = String(email || '').trim().toLowerCase();

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email: cleanEmail,
        code: otpValue,
        newPassword
      });

      toast.success(response.data.message || 'Password updated successfully');
      setTimeout(() => navigate('/login'), 1200);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const resetCodeView = (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
        <Link to="/forgot-password" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <FaArrowLeft className="text-sm" />
          Back
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Verify Your Code</h1>
          <p className="text-gray-500 mt-2">
            Enter the 6-digit code sent to <strong>{email || 'your email'}</strong>
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          />
        </div>

        <div className="flex justify-between gap-2 mb-6">
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={code[index]}
              onChange={(e) => handleCodeInput(index, e.target.value)}
              onKeyDown={(e) => handleCodeKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleVerifyCode}
          disabled={isVerifying}
          className="w-full py-3 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isVerifying ? <FaSpinner className="animate-spin" /> : null}
          {isVerifying ? 'Verifying...' : 'Verify Code'}
        </button>
      </div>
    </div>
  );

  const passwordResetView = (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="text-3xl text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Create New Password</h1>
          <p className="text-gray-500 mt-2">Your code has been verified successfully.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full py-3 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin" /> : null}
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );

  return isCodeVerified ? passwordResetView : resetCodeView;
};

export default ResetPassword;
