import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import Notifications from '../pages/common/Notifications';
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import PendingRequests from '../pages/manager/PendingRequests';
import TeamBalances from '../pages/manager/TeamBalances';
import TeamLeaveCalendar from '../pages/manager/TeamLeaveCalendar';
import LeaveHistory from '../pages/manager/LeaveHistory';
import ManagerRequestDetails from '../pages/manager/ManagerRequestDetails';
import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import ApplyLeave from '../pages/employee/ApplyLeave';
import MyLeaveRequests from '../pages/employee/MyLeaveRequests';
import LeaveBalances from '../pages/employee/LeaveBalances';
import MyLeaveCalendar from '../pages/employee/MyLeaveCalendar';
import LeaveRequestDetails from '../pages/employee/LeaveRequestDetails';
import ProtectedRoute from '../components/common/ProtectedRoute';
import { ROLES } from '../context/AuthContext';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
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
