import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import {
  FaBell,
  FaFileAlt,
  FaBook,
  FaCalendarCheck,
  FaCheckCircle,
  FaClipboardList,
  FaSpinner,
  FaInfoCircle,
  FaClock,
  FaMoneyBillWave,
  FaGraduationCap,
} from 'react-icons/fa';

const NotificationBell = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  // Determine which ID to use based on role
  const getNotificationParams = () => {
    if (user?.role === 'student') return { studentId: user.studentId };
    if (user?.role === 'parent') return { parentId: user.parentId };
    if (user?.role === 'teacher') return { teacherId: user.teacherId || user.id };
    if (user?.role === 'school_admin') return { schoolId: user.schoolId };
    return { userId: user?.id };
  };

  const params = getNotificationParams();

  // Fetch notifications based on role
  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      if (user?.role === 'student' && params.studentId) {
        const response = await api.get(`/notifications/students/${params.studentId}/notifications`);
        return response.data;
      }
      if (user?.role === 'parent' && params.parentId) {
        const response = await api.get(`/notifications/parents/${params.parentId}/notifications`);
        return response.data;
      }
      if (user?.role === 'teacher' && params.teacherId) {
        const response = await api.get(`/notifications/teachers/${params.teacherId}/notifications`);
        return response.data;
      }
      const response = await api.get(`/notifications/users/${user?.id}/notifications`);
      return response.data;
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['unreadCount', params],
    queryFn: async () => {
      if (user?.role === 'student' && params.studentId) {
        const response = await api.get(`/notifications/students/${params.studentId}/unread-count`);
        return response.data;
      }
      if (user?.role === 'parent' && params.parentId) {
        const response = await api.get(`/notifications/parents/${params.parentId}/unread-count`);
        return response.data;
      }
      if (user?.role === 'teacher' && params.teacherId) {
        const response = await api.get(`/notifications/teachers/${params.teacherId}/unread-count`);
        return response.data;
      }
      const response = await api.get(`/notifications/users/${user?.id}/unread-count`);
      return response.data;
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  // Mark as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const response = await api.put(`/notifications/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadCount']);
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/notifications/read-all`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      queryClient.invalidateQueries(['unreadCount']);
    },
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = unreadData?.data?.unread_count || 0;

  // Close dropdown when clicking outside (checks both the button and the portaled dropdown)
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedButton = buttonRef.current && buttonRef.current.contains(event.target);
      const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
      if (!clickedButton && !clickedDropdown) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recalculate position on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + window.scrollY + 8,
          right: window.innerWidth - rect.right
        });
      }
    };
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right
      });
    }
    setIsOpen(!isOpen);
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'lesson_note':
        return { icon: FaFileAlt, color: 'bg-blue-100 text-blue-600' };
      case 'homework':
        return { icon: FaBook, color: 'bg-green-100 text-green-600' };
      case 'attendance':
        return { icon: FaCalendarCheck, color: 'bg-yellow-100 text-yellow-600' };
      case 'exam':
        return { icon: FaClipboardList, color: 'bg-purple-100 text-purple-600' };
      case 'grade':
        return { icon: FaGraduationCap, color: 'bg-indigo-100 text-indigo-600' };
      case 'timetable':
        return { icon: FaClock, color: 'bg-orange-100 text-orange-600' };
      case 'payment':
      case 'fee':
        return { icon: FaMoneyBillWave, color: 'bg-green-100 text-green-600' };
      case 'admission':
        return { icon: FaCheckCircle, color: 'bg-emerald-100 text-emerald-600' };
      case 'general':
      default:
        return { icon: FaInfoCircle, color: 'bg-gray-100 text-gray-600' };
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 8);

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <FaBell className={`text-xl ${unreadCount > 0 ? 'text-kora-primary' : 'text-gray-600'}`} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel — rendered via portal to escape any parent overflow/z-index traps */}
      {isOpen && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 999999 }}
          className="w-96 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[600px] flex flex-col"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              <p className="text-xs text-gray-500">{unreadCount} unread</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs text-kora-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <FaSpinner className="animate-spin text-2xl text-kora-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <FaBell className="text-4xl mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {displayedNotifications.map((notification) => {
                  const { icon: Icon, color } = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                        notification.is_read ? 'opacity-60' : ''
                      }`}
                      onClick={() => markAsReadMutation.mutate(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatTime(notification.created_at)}</p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-kora-primary rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 8 && (
            <div className="px-4 py-2 border-t border-gray-200">
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full text-center text-sm text-kora-primary hover:underline"
              >
                {showAll ? 'Show Less' : `View All (${notifications.length})`}
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default NotificationBell;