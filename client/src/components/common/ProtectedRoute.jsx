import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth, getPortalPath } from '../../context/AuthContext';
import { ShieldAlert, ArrowRight } from 'lucide-react';
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

  // Check role authorization
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role_id)) {
    const userPortal = getPortalPath(user.role_id);

    return (
      <div className="flex-1 flex items-center justify-center p-4 max-w-lg mx-auto w-full">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Access Denied (403)</h2>
            <p className="text-sm text-slate-400">
              Your account role (<span className="text-indigo-400 font-semibold">{user.role_name || `role_id: ${user.role_id}`}</span>) does not have permission to access this portal.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-400 text-left space-y-1">
            <p><strong className="text-slate-200">Logged in as:</strong> {user.name} ({user.email})</p>
            <p><strong className="text-slate-200">Department:</strong> {user.department || 'Not assigned'}</p>
          </div>

          <div className="pt-2">
            <Link
              to={userPortal}
              className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all"
            >
              <span>Go to Your Assigned Portal ({user.role_name})</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
