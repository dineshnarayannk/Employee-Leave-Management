import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../pages/auth/LoginPage';
import Notifications from '../pages/common/Notifications';
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import AdminAnalytics from '../pages/admin/Analytics';
import AdminLeaveReports from '../pages/admin/LeaveReports';
import AdminLeavePolicies from '../pages/admin/LeavePolicies';
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import PendingRequests from '../pages/manager/PendingRequests';
import TeamBalances from '../pages/manager/TeamBalances';
import TeamLeaveCalendar from '../pages/manager/TeamLeaveCalendar';
import LeaveHistory from '../pages/manager/LeaveHistory';
import ManagerLeaveAnalytics from '../pages/manager/LeaveAnalytics';
import ManagerLeaveReports from '../pages/manager/LeaveReports';
import ManagerLeavePolicies from '../pages/manager/LeavePolicies';
import ManagerRequestDetails from '../pages/manager/ManagerRequestDetails';
import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import ApplyLeave from '../pages/employee/ApplyLeave';
import MyLeaveRequests from '../pages/employee/MyLeaveRequests';
import LeaveBalances from '../pages/employee/LeaveBalances';
import MyLeaveCalendar from '../pages/employee/MyLeaveCalendar';
import LeaveRequestDetails from '../pages/employee/LeaveRequestDetails';
import ProtectedRoute from '../components/common/ProtectedRoute';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth, getPortalPath, ROLES } from '../context/AuthContext';

/**
 * Root Index Redirect:
 * When users visit http://localhost:5173/ directly:
 * - If already authenticated: redirect automatically to their assigned portal (Admin, Manager, or Employee)
 * - If not authenticated: redirect directly to /login
 */
function IndexRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getPortalPath(user.role_id)} replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Root Index: opens directly to Login (or assigned Portal if already logged in) */}
        <Route path="/" element={<IndexRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Common Authenticated Route */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE]}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Portal Routes (role_id = 1) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLeaveReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/leave-policies"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminLeavePolicies />
            </ProtectedRoute>
          }
        />

        {/* Protected Manager Portal Routes (role_id = 2) */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/leave-requests"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
              <PendingRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/leave-requests/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
              <ManagerRequestDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/calendar"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
              <TeamLeaveCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/leave-history"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
              <LeaveHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/analytics"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
              <ManagerLeaveAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/reports"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
              <ManagerLeaveReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/policies"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
              <ManagerLeavePolicies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/team-balances"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
              <TeamBalances />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/notifications"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Protected Employee Portal Routes (role_id = 3) */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/apply-leave"
          element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}>
              <ApplyLeave />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/leave-requests"
          element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}>
              <MyLeaveRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/leave-requests/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}>
              <LeaveRequestDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/calendar"
          element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}>
              <MyLeaveCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/balances"
          element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}>
              <LeaveBalances />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/notifications"
          element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
