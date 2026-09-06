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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Parent Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.displayName || user?.fullName || 'Parent'}</p>
      </div>

      {/* Stats Cards */}
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        
        {/* Children Section */}
        <section className="bg-white rounded-xl shadow-md p-5 flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-800">My Children</h2>
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{children.length} linked</span>
          </div>

          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {childrenLoading ? (
              <div className="text-center py-20 text-gray-500">Loading children...</div>
            ) : childrenError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">Could not load children.</div>
            ) : children.length === 0 ? (
              <div className="text-center py-20">
                <FaChild className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No child linked to this parent account.</p>
              </div>
            ) : (
              children.map((child) => (
                <div key={child.id} className="border border-gray-100 hover:border-blue-200 bg-white hover:bg-slate-50/50 transition-all rounded-xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">{child.first_name} {child.last_name}</h3>
                      <p className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">ID: {child.admission_number}</p>
                    </div>
                    {child.is_primary_contact && (
                      <span className="bg-emerald-100 text-emerald-800 font-medium text-xs px-2.5 py-1 rounded-full">Primary Contact</span>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm border-t border-gray-50 pt-3">
                    <div><span className="text-gray-400 font-medium">Class:</span> <span className="text-gray-700 font-medium">{child.class?.name || 'N/A'}</span></div>
                    <div><span className="text-gray-400 font-medium">Campus:</span> <span className="text-gray-700 font-medium">{child.campus?.name || 'N/A'}</span></div>
                    <div><span className="text-gray-400 font-medium">Gender:</span> <span className="text-gray-700">{child.gender || 'N/A'}</span></div>
                    <div><span className="text-gray-400 font-medium">DOB:</span> <span className="text-gray-700">{child.date_of_birth ? new Date(child.date_of_birth).toLocaleDateString() : 'N/A'}</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-white rounded-xl shadow-md p-5 flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-800">Recent Notifications</h2>
            <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{notifications.length} total</span>
          </div>

          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {notificationsLoading ? (
              <div className="text-center py-20 text-gray-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-20">
                <FaBell className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notifications yet for your children.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className={`border transition-all rounded-xl p-4 shadow-sm ${notification.is_read ? 'border-gray-100 bg-gray-50/60' : 'border-blue-100 bg-gradient-to-r from-blue-50/50 to-white'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-2 rounded-lg ${notification.is_read ? 'bg-gray-200/60 text-gray-500' : 'bg-blue-100 text-blue-600'}`}>
                        <FaInfoCircle className="text-sm" />
                      </div>
                      <div>
                        <p className={`font-semibold ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                          <span className="font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {notification.students ? `${notification.students.first_name} ${notification.students.last_name}` : 'Your child'}
                          </span>
                          <span>•</span>
                          <span>{new Date(notification.created_at).toLocaleString([], {hour: '2-digit', minute:'2-digit', month: 'short', day: 'numeric'})}</span>
                        </div>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <span className="flex-shrink-0 bg-emerald-500 p-1 rounded-full text-white text-[10px]">
                        <FaCheck />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default ParentDashboard;
