import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyResetCode from './pages/auth/VerifyResetCode';
import SetNewPassword from './pages/auth/SetNewPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/SuperAdmin/Dashboard';
import Schools from './pages/SuperAdmin/Schools';
import AuditLogs from './pages/SuperAdmin/AuditLogs';
import SchoolDashboard from './pages/SchoolAdmin/Dashboard';
import AcademicManagement from './pages/SchoolAdmin/AcademicManagement';
import Campuses from './pages/SchoolAdmin/Campuses';
import Profile from './pages/SchoolAdmin/Profile';
import BillingWorkflowPage from './pages/SuperAdmin/BillingWorkflowPage';
import Coupons from './pages/SuperAdmin/Coupons';
import SchoolRegistration from './pages/SchoolRegistration';
import SubscriptionConfig from './pages/SuperAdmin/SubscriptionConfig';
import AddSchool from './pages/SuperAdmin/AddSchool';
import Teachers from './pages/SchoolAdmin/Teachers';
import Staff from './pages/SchoolAdmin/Staff';
import Students from './pages/SchoolAdmin/Students';
import Parents from './pages/SchoolAdmin/Parents';
import StudentRegistration from './pages/SchoolAdmin/StudentRegistration';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/Parent/Dashboard';
import TeacherDashboard from './pages/Teacher/Dashboard';
import TeacherAttendance from './pages/Teacher/Attendance';
import TeacherGrades from './pages/Teacher/Grades';
import StudentSearch from './pages/SchoolAdmin/StudentSearch';
import BulkImport from './pages/SchoolAdmin/BulkImport';
import Promotion from './pages/SchoolAdmin/Promotion';
import Transfer from './pages/SchoolAdmin/Transfer';
import Withdrawal from './pages/SchoolAdmin/Withdrawal';
import Graduation from './pages/SchoolAdmin/Graduation';
import IDCard from './pages/SchoolAdmin/IDCard';
import Notifications from './pages/Parent/Notifications';
import AccountantDashboard from './pages/Accountant/Dashboard';
import FeeManagement from './pages/Accountant/FeeManagement';
import FinancialReports from './pages/Accountant/FinancialReports';
import Accountants from './pages/SchoolAdmin/Accountants';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user?.role === 'super_admin') return '/admin/dashboard';
    if (user?.role === 'school_admin') return '/dashboard';
    if (user?.role === 'teacher') return '/teacher/dashboard';
    if (user?.role === 'student') return '/student/dashboard';
    if (user?.role === 'parent') return '/parent/dashboard';
    if (user?.role === 'accountant') return '/accountant/dashboard';
    return '/dashboard';
  };

  const RoleRoute = ({ allowedRoles, children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
      return <Navigate to={getDashboardPath()} replace />;
    }

    return children;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kora-primary"></div>
      </div>
    );
  }

  const dashboardPath = getDashboardPath();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to={dashboardPath} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={dashboardPath} replace /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to={dashboardPath} replace /> : <ForgotPassword />} />
      <Route path="/verify-reset-code" element={user ? <Navigate to={dashboardPath} replace /> : <VerifyResetCode />} />
      <Route path="/set-new-password" element={user ? <Navigate to={dashboardPath} replace /> : <SetNewPassword />} />
      <Route path="/reset-password" element={user ? <Navigate to={dashboardPath} replace /> : <ResetPassword />} />
      <Route path="/register-school" element={user ? <Navigate to={dashboardPath} replace /> : <SchoolRegistration />} />

      {/* Protected Routes - with Layout */}
      <Route path="/" element={user ? <Layout user={user} /> : <Navigate to="/login" replace />}>
        {/* ✅ INDEX redirect based on role */}
        <Route index element={<Navigate to={dashboardPath} replace />} />

        {/* Super Admin Routes */}
        <Route path="admin/dashboard" element={<Dashboard />} />
        <Route path="admin/schools" element={<Schools />} />
        <Route path="admin/audit-logs" element={<AuditLogs />} />
        <Route path="admin/billing-workflow/:schoolId" element={<BillingWorkflowPage />} />
        <Route path="admin/coupons" element={<Coupons />} />
        <Route path="admin/schools/:schoolId/subscription" element={<SubscriptionConfig />} />
        <Route path="admin/schools/new" element={<AddSchool />} />

        {/* School Admin Routes */}
        <Route path="dashboard" element={<RoleRoute allowedRoles={['school_admin']}><SchoolDashboard /></RoleRoute>} />
        <Route path="school/profile" element={<RoleRoute allowedRoles={['school_admin']}><Profile /></RoleRoute>} />
        <Route path="school/academic" element={<RoleRoute allowedRoles={['school_admin']}><AcademicManagement /></RoleRoute>} />
        <Route path="school/campuses" element={<RoleRoute allowedRoles={['school_admin']}><Campuses /></RoleRoute>} />
        <Route path="school/students" element={<RoleRoute allowedRoles={['school_admin']}><Students /></RoleRoute>} />
        <Route path="school/student-registration" element={<RoleRoute allowedRoles={['school_admin']}><StudentRegistration /></RoleRoute>} />
        <Route path="school/teachers" element={<RoleRoute allowedRoles={['school_admin']}><Teachers /></RoleRoute>} />
        <Route path="school/staff" element={<RoleRoute allowedRoles={['school_admin']}><Staff roleFilter="staff" /></RoleRoute>} />
        <Route path="school/accountants" element={<RoleRoute allowedRoles={['school_admin']}><Accountants /></RoleRoute>} />
        <Route path="school/parents" element={<RoleRoute allowedRoles={['school_admin']}><Parents /></RoleRoute>} />
        <Route path="school/bulk-import" element={<RoleRoute allowedRoles={['school_admin']}><BulkImport /></RoleRoute>} />
        <Route path="school/promotion" element={<RoleRoute allowedRoles={['school_admin']}><Promotion /></RoleRoute>} />
        <Route path="school/transfer" element={<RoleRoute allowedRoles={['school_admin']}><Transfer /></RoleRoute>} />
        <Route path="school/withdrawal" element={<RoleRoute allowedRoles={['school_admin']}><Withdrawal /></RoleRoute>} />
        <Route path="school/graduation" element={<RoleRoute allowedRoles={['school_admin']}><Graduation /></RoleRoute>} />
        <Route path="school/id-card" element={<RoleRoute allowedRoles={['school_admin']}><IDCard /></RoleRoute>} />

        {/* Teacher Routes */}
        <Route path="teacher/dashboard" element={<RoleRoute allowedRoles={['teacher']}><TeacherDashboard /></RoleRoute>} />
        <Route path="teacher/classes" element={<RoleRoute allowedRoles={['teacher']}><TeacherDashboard /></RoleRoute>} />
        <Route path="teacher/attendance" element={<RoleRoute allowedRoles={['teacher']}><TeacherAttendance /></RoleRoute>} />
        <Route path="teacher/grades" element={<RoleRoute allowedRoles={['teacher']}><TeacherGrades /></RoleRoute>} />

        {/* Student Routes */}
        <Route path="student/dashboard" element={<RoleRoute allowedRoles={['student']}><StudentDashboard /></RoleRoute>} />

        {/* Parent Routes */}
        <Route path="parent/dashboard" element={<RoleRoute allowedRoles={['parent']}><ParentDashboard /></RoleRoute>} />
        <Route path="parent/children" element={<RoleRoute allowedRoles={['parent']}><ParentDashboard /></RoleRoute>} />
        <Route path="parent/notifications" element={<RoleRoute allowedRoles={['parent']}><Notifications /></RoleRoute>} />

        {/* Accountant Routes */}
        <Route path="accountant/dashboard" element={<RoleRoute allowedRoles={['accountant']}><AccountantDashboard /></RoleRoute>} />
        <Route path="accountant/fees" element={<RoleRoute allowedRoles={['accountant']}><FeeManagement /></RoleRoute>} />
        <Route path="accountant/reports" element={<RoleRoute allowedRoles={['accountant']}><FinancialReports /></RoleRoute>} />

        {/* Search Route (accessible to school_admin) */}
        <Route path="school/search" element={<RoleRoute allowedRoles={['school_admin']}><StudentSearch /></RoleRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={dashboardPath} replace />} />
      </Route>

      {/* Global fallback for unauthenticated access */}
      <Route path="*" element={<Navigate to={user ? dashboardPath : "/login"} replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;