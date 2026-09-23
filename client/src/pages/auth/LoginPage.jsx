import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth, getPortalPath } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  AlertCircle, 
  LogIn, 
  CheckCircle2, 
  Info, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function LoginPage() {
  const { user, isAuthenticated, login, isLoading, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleBtnRef = useRef(null);
  const [localError, setLocalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // If already authenticated, redirect immediately to their assigned portal
  if (isAuthenticated && user) {
    const from = location.state?.from?.pathname || getPortalPath(user.role_id);
    return <Navigate to={from} replace />;
  }

  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setLocalError('No credential received from Google Identity Services.');
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);
    if (setAuthError) setAuthError(null);

    try {
      const authenticatedUser = await login(response.credential);
      const targetPortal = location.state?.from?.pathname || getPortalPath(authenticatedUser.role_id);
      navigate(targetPortal, { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Check if Google SDK is loaded and Google Client ID is configured
    if (!googleClientId) return;

    const initializeGoogle = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 320,
          });
        } catch (err) {
          console.error('Google button render error:', err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initializeGoogle();
        }
      }, 200);

      return () => clearInterval(interval);
    }
  }, [googleClientId]);

  const activeError = localError || authError;

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur space-y-6 relative overflow-hidden">
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header Icon */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sign In to LeaveSync</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Single Sign-On with verified corporate Google accounts
          </p>
        </div>

        {/* Error Alert Box */}
        {activeError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-0.5">
              <p className="font-semibold text-rose-200">Authentication Notice</p>
              <p className="text-rose-300/90 leading-relaxed">{activeError}</p>
            </div>
          </div>
        )}

        {/* Submitting Loading State */}
        {isSubmitting && (
          <div className="py-6 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-indigo-400 font-medium animate-pulse">Verifying Google credentials with database...</p>
          </div>
        )}

        {/* Google Sign-in Area */}
        {!isSubmitting && (
          <div className="space-y-4">
            {googleClientId ? (
              <div className="flex flex-col items-center justify-center pt-2">
                <div ref={googleBtnRef} className="min-h-[44px] flex items-center justify-center"></div>
                <p className="text-[11px] text-slate-500 mt-2 text-center">
                  Protected with Google Identity Services
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-200">
                  <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Google Client ID Required</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Add <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-200">VITE_GOOGLE_CLIENT_ID</code> to your <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-200">client/.env</code> to activate Google Sign-In.
                </p>
                <div className="pt-1 text-[11px] text-slate-400">
                  <span>Authorized Javascript origins: </span>
                  <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-200">http://localhost:5173</code>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Role Enforcement Explanation */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-850 text-xs text-slate-400 space-y-2.5">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-[11px] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Automatic Role-Based Access (RBAC)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Your portal destination is determined automatically by the database:
          </p>
          <div className="grid grid-cols-3 gap-2 text-[10px] text-center font-medium">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              Admin (1)
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300">
              Manager (2)
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              Employee (3)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
