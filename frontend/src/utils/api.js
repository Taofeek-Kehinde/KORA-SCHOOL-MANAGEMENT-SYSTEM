import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isLoginAttempt = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
    const isSessionCheck = requestUrl.includes('/auth/me');
    const isStrictModeCancel = error.code === 'ERR_CANCELED';
    const isNetworkDrop = error.code === 'ECONNABORTED' || error.message === 'Network Error';

    // Keep the current session intact unless the user is actively logging in.
    // A stale or invalid token should be discarded immediately so it is not reused.
    if (error.response?.status === 401 && isSessionCheck) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !isLoginAttempt) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      return Promise.reject(error);
    }

    if (isStrictModeCancel) {
      return Promise.reject(error);
    }

    if (isNetworkDrop) {
      console.warn('Backend server took too long to respond or is offline. Retaining session.');
      return Promise.reject(error);
    }

    if (error.response) {
      console.error('Response Error:', error.response.status, error.response.data);
    }

    return Promise.reject(error);
  }
);


export default api;
