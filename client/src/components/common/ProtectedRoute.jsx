import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getPortalPath } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">Verifying session permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirect to login page while saving the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization: if not permitted for this role, auto-redirect to their assigned portal
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role_id)) {
    const userPortal = getPortalPath(user.role_id);
    return <Navigate to={userPortal} replace />;
  }

  return children;
}
