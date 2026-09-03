import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import {
  FaBell,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaUserGraduate,
  FaGraduationCap,
  FaExchangeAlt,
  FaEdit,
  FaInfoCircle,
  FaClock,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';

const Notifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);

  // Fetch parent notifications
  const { data, isLoading } = useQuery({
    queryKey: ['parentNotifications', user?.parentId],
    queryFn: async () => {
      if (!user?.parentId) return { data: [] };
      const response = await api.get(`/student-notifications/parents/${user.parentId}/notifications`);
      return response.data;
    },
    enabled: !!user?.parentId,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      const response = await api.put(`/student-notifications/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['parentNotifications', user?.parentId]);
    },
  });

  const notifications = data?.data || [];

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'admission':
        return { icon: FaUserGraduate, color: 'bg-blue-100 text-blue-600' };
      case 'promotion':
        return { icon: FaGraduationCap, color: 'bg-green-100 text-green-600' };
      case 'class_change':
        return { icon: FaExchangeAlt, color: 'bg-purple-100 text-purple-600' };
      case 'profile_update':
        return { icon: FaEdit, color: 'bg-yellow-100 text-yellow-600' };
      case 'record_update':
        return { icon: FaInfoCircle, color: 'bg-orange-100 text-orange-600' };
      default:
        return { icon: FaBell, color: 'bg-gray-100 text-gray-600' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-3xl text-kora-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Notifications</h1>
          <p className="text-gray-500 mt-1">Updates about your child's academic journey</p>
        </div>
        <div className="flex gap-2 mt-3 md:mt-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-kora-primary"
          >
            <option value="all">All</option>
            <option value="admission">Admission</option>
            <option value="promotion">Promotion</option>
            <option value="class_change">Class Change</option>
            <option value="profile_update">Profile Update</option>
            <option value="record_update">Record Update</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FaBell className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Notifications</h3>
          <p className="text-gray-500">You'll see notifications here when there are updates about your child</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(showAll ? filteredNotifications : filteredNotifications.slice(0, 10)).map((notif) => {
            const { icon: Icon, color } = getNotificationIcon(notif.type);
            return (
              <div
                key={notif.id}
                className={`bg-white rounded-xl shadow-md p-4 flex items-start gap-3 ${
                  !notif.is_read ? 'border-l-4 border-kora-primary' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="text-lg" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800">{notif.title}</h4>
                    <span className="text-xs text-gray-400">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                  {notif.students && (
                    <p className="text-xs text-gray-400 mt-1">
                      Child: {notif.students.first_name} {notif.students.last_name}
                    </p>
                  )}
                </div>
                {!notif.is_read && (
                  <button
                    onClick={() => markAsReadMutation.mutate(notif.id)}
                    className="p-1 text-green-500 hover:bg-green-50 rounded-lg flex-shrink-0"
                    title="Mark as read"
                  >
                    <FaCheck />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filteredNotifications.length > 10 && (
        <div className="text-center mt-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-kora-primary hover:underline flex items-center gap-1 mx-auto"
          >
            {showAll ? 'Show Less' : `Show All (${filteredNotifications.length})`}
            {showAll ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;