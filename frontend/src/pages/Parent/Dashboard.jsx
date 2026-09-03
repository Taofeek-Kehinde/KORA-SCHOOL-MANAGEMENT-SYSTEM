import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/api';
import {
  FaUsers,
  FaChild,
  FaBook,
  FaBell,
  FaInfoCircle,
  FaCheck,
} from 'react-icons/fa';

const ParentDashboard = () => {
  const { user } = useAuth();

  const { data: childrenData, isLoading: childrenLoading, error: childrenError, refetch: refetchChildren } = useQuery({
    queryKey: ['parentChildren', user?.parentId || user?.id],
    queryFn: async () => {
      const response = await api.get('/parents/me/children');
      return response.data;
    },
    enabled: !!user && user.role === 'parent',
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });

  const { data: notificationsData, isLoading: notificationsLoading, refetch: refetchNotifications } = useQuery({
    queryKey: ['parentNotifications', user?.parentId],
    queryFn: async () => {
      if (!user?.parentId) return { data: [] };
      const response = await api.get(`/student-notifications/parents/${user.parentId}/notifications`);
      return response.data;
    },
    enabled: !!user && user.role === 'parent' && !!user.parentId,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });

  const children = childrenData?.data || [];
  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  React.useEffect(() => {
    if (user?.role === 'parent') {
      refetchChildren();
      refetchNotifications();
    }
  }, [user?.parentId, user?.id, refetchChildren, refetchNotifications]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Parent Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.displayName || user?.fullName || 'Parent'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Children</p>
              <p className="text-2xl font-bold text-gray-800">{children.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><FaUsers /></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Notifications</p>
              <p className="text-2xl font-bold text-gray-800">{unreadCount}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg text-yellow-600"><FaBell /></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Academic</p>
              <p className="text-2xl font-bold text-gray-800">Ready</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg text-green-600"><FaBook /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">My Children</h2>
            <span className="text-sm text-gray-500">{children.length} linked</span>
          </div>

          {childrenLoading ? (
            <div className="text-center py-10 text-gray-500">Loading children...</div>
          ) : childrenError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Could not load children.</div>
          ) : children.length === 0 ? (
            <div className="text-center py-10">
              <FaChild className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No child linked to this parent account.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {children.map((child) => (
                <div key={child.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">{child.first_name} {child.last_name}</h3>
                      <p className="text-sm text-gray-500">Adm: {child.admission_number}</p>
                    </div>
                    {child.is_primary_contact && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">Primary</span>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div><span className="text-gray-400">Class:</span> {child.class?.name || 'N/A'}</div>
                    <div><span className="text-gray-400">Campus:</span> {child.campus?.name || 'N/A'}</div>
                    <div><span className="text-gray-400">Gender:</span> {child.gender || 'N/A'}</div>
                    <div><span className="text-gray-400">DOB:</span> {child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Notifications</h2>
            <span className="text-sm text-gray-500">{notifications.length} total</span>
          </div>

          {notificationsLoading ? (
            <div className="text-center py-10 text-gray-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10">
              <FaBell className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No notifications yet for your children.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 8).map((notification) => (
                <div key={notification.id} className={`border rounded-lg p-3 ${notification.is_read ? 'border-gray-200 bg-gray-50' : 'border-blue-200 bg-blue-50'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <div className="mt-1 text-blue-600"><FaInfoCircle /></div>
                      <div>
                        <p className="font-medium text-gray-800">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {notification.students ? `${notification.students.first_name} ${notification.students.last_name}` : 'Your child'} • {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!notification.is_read && <FaCheck className="text-green-500 mt-1" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ParentDashboard;
