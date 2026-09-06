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
  FaSearch,
  FaFileUpload,
  FaArrowRight,
  FaExchangeAlt,
  FaGraduationCap,
  FaIdCard,
  FaBell,
  FaFileAlt,
  FaBookOpen,
  FaClock,
  FaBook,
  FaClipboardCheck,
  FaFileSignature,
  FaUserClock,
  FaUserPlus,
  FaCheckCircle,
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
    { path: '/school/search', icon: FaSearch, label: 'Find Students' },
    { path: '/school/teachers', icon: FaChalkboardTeacher, label: 'Teachers' },
    { path: '/school/parents', icon: FaUsers, label: 'Parents' },
    { path: '/school/billing', icon: FaMoneyBillWave, label: 'Billing' },
    { path: '/school/bulk-import', icon: FaFileUpload, label: 'Bulk Import' },
    { path: '/school/staff', icon: FaUserTie, label: 'Staff' },
    { path: '/school/accountants', icon: FaMoneyBillWave, label: 'Accountants' },
    { path: '/school/promotion', icon: FaArrowRight, label: 'Promotion' },
    { path: '/school/transfer', icon: FaExchangeAlt, label: 'Transfer' },
    { path: '/school/withdrawal', icon: FaUserGraduate, label: 'Withdrawal' },
    { path: '/school/graduation', icon: FaGraduationCap, label: 'Graduation' },
    { path: '/school/id-card', icon: FaIdCard, label: 'ID Card' },
    { path: '/school/lifecycle', icon: FaClipboardList, label: 'Lifecycle' },
    { path: '/school/library', icon: FaBookOpen, label: 'Library' },
    // V4 Academic Management (School Admin)
    { path: '/school/academic-structure', icon: FaSchool, label: 'Academic Structure' },
    { path: '/school/subjects', icon: FaBook, label: 'Subjects' },
    { path: '/school/academic-calendar', icon: FaCalendarAlt, label: 'Academic Calendar' },
    { path: '/school/academic-reports', icon: FaChartBar, label: 'Academic Reports' },
    { path: '/school/approval-workflows', icon: FaCheckCircle, label: 'Approval Workflows' },
    // Admission Management (School Admin)
    { path: '/admissions/dashboard', icon: FaClipboardCheck, label: 'Admissions' },
    { path: '/school/admission/form-builder', icon: FaFileSignature, label: 'Admission Form' },
    { path: '/school/admission/reports', icon: FaChartBar, label: 'Admission Reports' },
  ];

  // =============================================
  // ADMISSION OFFICER MENU ITEMS
  // =============================================
  const admissionOfficerMenu = [
    { path: '/admissions/dashboard', icon: FaClipboardCheck, label: 'Dashboard' },
    { path: '/admissions/exams', icon: FaFileAlt, label: 'Exams' },
    { path: '/admissions/interviews', icon: FaUserClock, label: 'Interviews' },
    { path: '/admissions/letters', icon: FaFileSignature, label: 'Letters' },
  ];

  // =============================================
  // TEACHER MENU ITEMS
  // =============================================
  const teacherMenu = [
    { path: '/teacher/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/teacher/classes', icon: FaChalkboardTeacher, label: 'Classes' },
    { path: '/teacher/attendance', icon: FaCalendarAlt, label: 'Attendance' },
    { path: '/teacher/grades', icon: FaChartBar, label: 'Assessments' },
    { path: '/teacher/exams', icon: FaFileAlt, label: 'Exams' },
    { path: '/teacher/timetable', icon: FaClock, label: 'Timetable' },
    { path: '/teacher/homework', icon: FaBook, label: 'Homework' },
    // V4 Teacher Routes
    { path: '/teacher/lesson-notes', icon: FaFileAlt, label: 'Lesson Notes' },
    { path: '/teacher/scheme-of-work', icon: FaClipboardList, label: 'Scheme of Work' },
    { path: '/teacher/assessments', icon: FaChartBar, label: 'Assessments' },
  ];

  const studentMenu = [
  { path: '/student/dashboard', icon: FaHome, label: 'Overview' },
  { path: '/student/academics', icon: FaBook, label: 'Academics' },
  { path: '/student/fees', icon: FaMoneyBillWave, label: 'Fees & Payments' },
  { path: '/student/attendance', icon: FaCalendarAlt, label: 'Attendance' },
  { path: '/student/timetable', icon: FaClock, label: 'Timetable' },
  { path: '/student/homework', icon: FaBook, label: 'Homework' },
  { path: '/student/lesson-notes', icon: FaFileAlt, label: 'Lesson Notes' },
  { path: '/student/parents', icon: FaUsers, label: 'Parents' },
  { path: '/student/library', icon: FaBookOpen, label: 'Library' },
];

  // =============================================
  // ACCOUNTANT MENU ITEMS
  // =============================================
  const accountantMenu = [
    { path: '/accountant/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/accountant/fees', icon: FaMoneyBillWave, label: 'Fees' },
    { path: '/accountant/reports', icon: FaChartBar, label: 'Reports' },
  ];

  // =============================================
  // PARENT MENU ITEMS
  // =============================================
  const parentMenu = [
    { path: '/parent/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/parent/payments', icon: FaMoneyBillWave, label: 'Payments' },
    { path: '/parent/notifications', icon: FaBell, label: 'Notifications' },
    { path: '/admissions/status', icon: FaClipboardCheck, label: 'Admissions' },
    { path: '/admissions/apply', icon: FaUserPlus, label: 'Apply' },
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
      case 'admission_officer':
        return admissionOfficerMenu;
      case 'teacher':
        return teacherMenu;
      case 'parent':
        return parentMenu;
      case 'accountant':
        return accountantMenu;
        case 'student':
          return studentMenu;
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