import { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const IDLE_TIMEOUT_MS = 60 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'pointerdown', 'focus'];

const clearSessionStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('lastActivityAt');
};

const touchSession = () => {
  localStorage.setItem('lastActivityAt', Date.now().toString());
};

const getStoredToken = () => {
  const token = localStorage.getItem('token');
  const lastActivityAt = Number(localStorage.getItem('lastActivityAt') || 0);

  if (!token) return null;

  if (lastActivityAt && Date.now() - lastActivityAt > IDLE_TIMEOUT_MS) {
    clearSessionStorage();
    return null;
  }

  return token;
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(getStoredToken());
  const timeoutRef = useRef(null);

  const resetIdleTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!localStorage.getItem('token')) {
      return;
    }

    const lastActivityAt = Number(localStorage.getItem('lastActivityAt') || Date.now());
    const idleMs = Date.now() - lastActivityAt;

    if (idleMs >= IDLE_TIMEOUT_MS) {
      clearSessionStorage();
      setToken(null);
      setUser(null);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      logout({ reason: 'idle' });
    }, IDLE_TIMEOUT_MS - idleMs);
  };

  useEffect(() => {
    if (token) {
      touchSession();
      resetIdleTimer();
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      delete api.defaults.headers.common['Authorization'];
      setLoading(false);
    }

    const handleActivity = () => {
      if (!localStorage.getItem('token')) return;
      touchSession();
      resetIdleTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleActivity();
      }
    };

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity);
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data;
      setUser({
        ...userData,
        schoolId: userData.school_id || userData.schoolId || null,
        studentId: userData.student_id || userData.studentId || null  // ← ADD THIS
      });
    } catch (error) {
      console.error('Fetch user error:', error);
      clearSessionStorage();
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('Login function called with:', email);
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);

      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      touchSession();
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token);
      setUser({
        ...user,
        schoolId: user.school_id || user.schoolId || null,
        studentId: user.student_id || user.studentId || null  // ← ADD THIS
      });
      return response.data;
    } catch (error) {
      console.error('Login API error:', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = ({ reason } = {}) => {
    if (reason === 'idle') {
      toast.error('Session expired due to inactivity. Please log in again.');
    }

    clearSessionStorage();
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};