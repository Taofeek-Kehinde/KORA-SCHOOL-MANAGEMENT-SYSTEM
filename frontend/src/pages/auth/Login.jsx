import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { 
  FaEnvelope, 
  FaLock, 
  FaSpinner, 
  FaSchool, 
  FaEye, 
  FaEyeSlash,
  FaGraduationCap,
  FaShieldAlt
} from 'react-icons/fa';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    const text = 'Welcome back! Sign in to your account';
    let index = 0;

    setTypedText('');

    const typingInterval = setInterval(() => {
      index += 1;
      setTypedText(text.slice(0, index));

      if (index >= text.length) {
        clearInterval(typingInterval);
      }
    }, 4000 / text.length);

    return () => clearInterval(typingInterval);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
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

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/50 relative z-10"
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
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
            style={{ 
              fontFamily: "'Poppins', 'Inter', system-ui, -apple-system, sans-serif",
              textShadow: "0 2px 20px rgba(99, 102, 241, 0.15)"
            }}
          >
            Kora School Management
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-500 mt-1 font-light min-h-[24px]"
            style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
          >
            {typedText}
          </motion.p>
        </div>

        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleSubmit}
        >
          <div className="space-y-5">
            <div>
              <label 
                className="block text-sm font-medium text-gray-700 mb-1.5"
                style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
              >
                Email Address
              </label>
              <div className="relative group">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@school.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-300"
                  style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
                  required
                />
              </div>
            </div>

            <div>
              <label 
                className="block text-sm font-medium text-gray-700 mb-1.5"
                style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
              >
                Password
              </label>
              <div className="relative group">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 group-hover:border-blue-300"
                  style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500 transition-colors duration-200 focus:outline-none"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2 transition-all duration-200" />
                <span 
                  className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-200"
                  style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
                >
                  Remember me
                </span>
              </label>
              <Link 
                to="/forgot-password" 
                className="text-sm text-blue-600 hover:text-indigo-600 hover:underline transition-all duration-200 font-medium"
                style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
              >
                Forgot password?
              </Link>
            </div>

            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 font-medium text-base"
              style={{ fontFamily: "'Poppins', 'Inter', system-ui, -apple-system, sans-serif" }}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <FaShieldAlt className="text-sm" />
                  <span>Sign In</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-gray-500"
          style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
        >
          Don't have an account?{' '}
          <Link 
            to="/register-school" 
            className="text-blue-600 hover:text-indigo-600 hover:underline font-medium transition-all duration-200"
          >
            Register School
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400"
          style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
        >
          <FaGraduationCap />
          <span>Secure • Encrypted • Trusted</span>
          <FaShieldAlt className="text-green-400" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;