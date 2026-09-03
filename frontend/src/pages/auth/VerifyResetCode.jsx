import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaArrowLeft, FaSpinner, FaClock } from 'react-icons/fa';

const OTP_LENGTH = 6;
const EXPIRATION_TIME = 30 * 60; // 30 minutes in seconds

const VerifyResetCode = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get email from URL immediately
  const emailFromQuery = searchParams.get('email');

  const [email, setEmail] = useState(emailFromQuery || '');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(EXPIRATION_TIME);

  // Check if email is missing on mount
  useEffect(() => {
    console.log('Email from query:', emailFromQuery);
    if (!emailFromQuery) {
      toast.error('Email not found. Please start the password reset process again.');
      setIsLoading(false);
      navigate('/forgot-password', { replace: true });
    } else {
      setIsLoading(false);
    }
  }, [emailFromQuery, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      toast.error('Code has expired. Please request a new one.');
      navigate('/forgot-password', { replace: true });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigate]);

  const otpValue = useMemo(() => code.join(''), [code]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

    if (!emailFromQuery) {
      toast.error('Email not found. Please start the password reset process again.');
      navigate('/forgot-password', { replace: true });
      return;
    }

    if (currentOtp.length !== OTP_LENGTH) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    const cleanEmail = String(emailFromQuery).trim().toLowerCase();

    setIsVerifying(true);
    try {
      const response = await api.post('/auth/verify-reset-code', {
        email: cleanEmail,
        code: currentOtp
      });

      toast.success(response.data.message || 'Code verified successfully');
      // Redirect to password reset page with email and code
      navigate(`/set-new-password?email=${encodeURIComponent(cleanEmail)}&code=${currentOtp}`);
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!emailFromQuery) {
      toast.error('Email not found. Please start the password reset process again.');
      navigate('/forgot-password', { replace: true });
      return;
    }

    const cleanEmail = String(emailFromQuery).trim().toLowerCase();
    setIsVerifying(true);
    try {
      await api.post('/auth/forgot-password', { email: cleanEmail });
      toast.success('New code sent to your email');
      setCode(['', '', '', '', '', '']);
    } catch (error) {
      console.error('Resend error:', error);
      toast.error(error.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kora-primary mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
          <Link to="/forgot-password" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
            <FaArrowLeft className="text-sm" />
            Back
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Verify Your Code</h1>
            <p className="text-gray-500 mt-2">
              Enter the 6-digit code sent to <strong className="text-gray-700">{emailFromQuery || 'your email'}</strong>
            </p>
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
                placeholder="0"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleVerifyCode}
            disabled={isVerifying}
            className="w-full py-3 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {isVerifying ? <FaSpinner className="animate-spin" /> : null}
            {isVerifying ? 'Verifying...' : 'Verify Code'}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={isVerifying}
            className="w-full mt-3 py-2 text-kora-primary border border-kora-primary rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 font-medium"
          >
            Resend Code
          </button>
        </div>
      )}
    </div>
  );
};

export default VerifyResetCode;
