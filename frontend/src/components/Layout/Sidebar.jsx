import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  FaHome,
  FaSchool,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaUsers,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaCog,
  FaSignOutAlt,
  FaRobot,
  FaChartBar,
   FaUserTie, 
  FaBuilding,
  FaClipboardList,
} from 'react-icons/fa';

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  // =============================================
  // SUPER ADMIN MENU ITEMS
  // =============================================
  const superAdminMenu = [
    { path: '/admin/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/admin/schools', icon: FaSchool, label: 'Schools' },
    { path: '/admin/audit-logs', icon: FaClipboardList, label: 'Audit Logs' },
    { path: '/admin/coupons', icon: FaMoneyBillWave, label: 'Coupons' },
  ];

  // =============================================
  // SCHOOL ADMIN MENU ITEMS
  // =============================================
  const schoolAdminMenu = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/school/profile', icon: FaBuilding, label: 'School Profile' },
    { path: '/school/academic', icon: FaCalendarAlt, label: 'Academic' },
    { path: '/school/campuses', icon: FaSchool, label: 'Campuses' },
    { path: '/school/students', icon: FaUserGraduate, label: 'Students' },
    { path: '/school/student-registration', icon: FaUserGraduate, label: 'Register Student' }, 
    { path: '/school/teachers', icon: FaChalkboardTeacher, label: 'Teachers' },
    { path: '/school/parents', icon: FaUsers, label: 'Parents' },
    { path: '/school/billing', icon: FaMoneyBillWave, label: 'Billing' },
     { path: '/school/staff', icon: FaUserTie, label: 'Staff' },
  ];

  // =============================================
  // TEACHER MENU ITEMS
  // =============================================
  const teacherMenu = [
    { path: '/teacher/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/teacher/attendance', icon: FaCalendarAlt, label: 'Attendance' },
    { path: '/teacher/grades', icon: FaChartBar, label: 'Grades' },
  ];

  // =============================================
  // PARENT MENU ITEMS
  // =============================================
  const parentMenu = [
    { path: '/parent/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/parent/children', icon: FaUsers, label: 'My Children' },
    { path: '/parent/payments', icon: FaMoneyBillWave, label: 'Payments' },
  ];

  // =============================================
  // SELECT MENU BASED ON ROLE
  // =============================================
  const getMenuItems = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'super_admin':
        return superAdminMenu;
      case 'school_admin':
        return schoolAdminMenu;
      case 'teacher':
        return teacherMenu;
      case 'parent':
        return parentMenu;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className={`${isOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col h-screen fixed left-0 top-0 z-40`}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <h1 className={`${isOpen ? 'text-xl' : 'text-sm'} font-bold text-kora-primary truncate`}>
          {isOpen ? 'Kora School' : 'KORA'}
        </h1>
        {isOpen && user && (
          <p className="text-xs text-gray-500 mt-1 capitalize">{user.role?.replace('_', ' ')}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-kora-primary/10 text-kora-primary' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="text-lg flex-shrink-0" />
              {isOpen && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <FaSignOutAlt className="text-lg flex-shrink-0" />
          {isOpen && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;