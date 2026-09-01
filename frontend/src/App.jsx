import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
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
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kora-primary"></div>
      </div>
    );
  }


  const getDashboardPath = () => {
    if (!user) return '/login';
    return user?.role === 'super_admin' ? '/admin/dashboard' : '/dashboard';
  };

  const dashboardPath = getDashboardPath();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to={dashboardPath} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={dashboardPath} replace /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to={dashboardPath} replace /> : <ForgotPassword />} />
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
        <Route path="dashboard" element={<SchoolDashboard />} />
        <Route path="school/profile" element={<Profile />} />
        <Route path="school/academic" element={<AcademicManagement />} />
        <Route path="school/campuses" element={<Campuses />} />
        <Route path="school/students" element={<Students />} />
        <Route path="school/student-registration" element={<StudentRegistration />} />
        <Route path="school/teachers" element={<Teachers />} />
        <Route path="school/staff" element={<Staff />} />
        <Route path="school/parents" element={<Parents />} />
        
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