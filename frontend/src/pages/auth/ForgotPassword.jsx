import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { FaEnvelope, FaSpinner, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!submitted) return;

    const tick = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          clearInterval(tick);
          navigate(`/verify-reset-code?email=${encodeURIComponent(email)}`);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [submitted, email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    const cleanEmail = String(email || '').trim().toLowerCase();

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: cleanEmail });
      toast.success(response.data.message || 'A 6-digit verification code has been sent to your email');
      setSubmitted(true);
      setCountdown(10);
      // Redirect immediately to verify code page so the user can enter the code
      navigate(`/verify-reset-code?email=${encodeURIComponent(cleanEmail)}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="text-3xl text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Check Your Email</h2>
          <p className="text-gray-500 mt-2">
            We've sent a 6-digit verification code to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-400 mt-3">Redirecting to code verification in {countdown}s</p>
          <button
            type="button"
            onClick={() => navigate(`/verify-reset-code?email=${encodeURIComponent(email)}`)}
            className="mt-6 inline-block text-kora-primary hover:underline font-medium"
          >
            Continue now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
        <Link to="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <FaArrowLeft className="text-sm" />
          Back to Login
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Forgot Password</h1>
          <p className="text-gray-500 mt-1">Enter your email to receive a 6-digit reset code</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@school.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-2 bg-kora-primary text-white rounded-lg hover:bg-kora-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin" /> : null}
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;