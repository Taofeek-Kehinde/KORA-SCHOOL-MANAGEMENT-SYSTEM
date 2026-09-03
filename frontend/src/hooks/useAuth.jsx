import { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const IDLE_TIMEOUT_MS = 60 * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'pointerdown', 'focus'];

const clearSessionStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('lastActivityAt');
  localStorage.removeItem('currentUser');
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

const getStoredUser = () => {
  try {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    return null;
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser());
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
    const storedUser = getStoredUser();

    if (token) {
      touchSession();
      resetIdleTimer();
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else if (storedUser) {
      setUser(normalizeUser(storedUser));
      delete api.defaults.headers.common['Authorization'];
      setLoading(false);
    } else {
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
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

  const normalizeUser = (userData) => {
    if (!userData) return null;

    const fullName =
      userData.fullName ||
      userData.full_name ||
      [userData.first_name, userData.last_name].filter(Boolean).join(' ') ||
      userData.name ||
      null;

    return {
      ...userData,
      fullName,
      displayName: fullName || userData.email || 'User',
      schoolId: userData.school_id || userData.schoolId || null,
      studentId: userData.student_id || userData.studentId || null,
      parentId: userData.parent_id || userData.parentId || null
    };
  };

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data;
      const normalized = normalizeUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(normalized));
      setUser(normalized);
    } catch (error) {
      const storedUser = getStoredUser();
      const isRequestAborted =
        error?.code === 'ERR_CANCELED' ||
        error?.code === 'ECONNABORTED' ||
        error?.message === 'Request aborted' ||
        error?.message === 'Network Error' ||
        (!error?.response && !error?.config);

      if (isRequestAborted) {
        if (storedUser) {
          setUser(normalizeUser(storedUser));
        }
        setLoading(false);
        return;
      }

      console.warn('User profile check failed; clearing stale token and keeping only the saved user snapshot.', error?.response?.data || error?.message);

      if (error?.response?.status === 401 || error?.response?.status === 403) {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        clearSessionStorage();
        setToken(null);
        setUser(null);
        return;
      }

      if (storedUser) {
        setUser(normalizeUser(storedUser));
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      const { token, user } = response.data.data;
      const normalizedUser = normalizeUser(user);
      localStorage.setItem('token', token || '');
      localStorage.setItem('currentUser', JSON.stringify(normalizedUser));
      touchSession();
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setToken(token || null);
      setUser(normalizedUser);
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