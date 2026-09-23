import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth, getPortalPath } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  AlertCircle, 
  LogIn, 
  Mail, 
  Lock, 
  Info, 
  ArrowRight 
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function LoginPage() {
  const { user, isAuthenticated, login, isLoading, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleBtnRef = useRef(null);
  const [localError, setLocalError] = useState(null);
  const [demoNotice, setDemoNotice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo form state
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPassword, setDemoPassword] = useState('');

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
    setDemoNotice(null);
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

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    setDemoNotice('Standard password sign-in is disabled. Please click "Continue with Google" below to authenticate.');
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
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
            <LogIn className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sign In to Employee360°</h1>
          <p className="text-xs text-slate-400">
            Employee Leave Management & Time-Off Portal
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

        {/* Demo Notice Alert Box */}
        {demoNotice && (
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
            <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <p className="leading-relaxed text-[11px]">{demoNotice}</p>
          </div>
        )}

        {/* Submitting Loading State */}
        {isSubmitting ? (
          <div className="py-6 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-indigo-400 font-medium animate-pulse">
              Verifying Google credentials with database...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Demo Email & Password Form */}
            <form onSubmit={handleDemoSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300 block">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" aria-hidden="true" />
                  <input
                    type="email"
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    placeholder="name@company.com"
                    aria-label="Email Address"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300 block">
                    Password
                  </label>
                  <span className="text-[10px] text-slate-500 hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" aria-hidden="true" />
                  <input
                    type="password"
                    value={demoPassword}
                    onChange={(e) => setDemoPassword(e.target.value)}
                    placeholder="••••••••"
                    aria-label="Password"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center pt-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <span className="relative px-3 bg-slate-900 text-[11px] font-medium text-slate-400">
                or continue with
              </span>
            </div>

            {/* Google Sign-in Area */}
            <div className="pt-1">
              {googleClientId ? (
                <div className="flex flex-col items-center justify-center">
                  <div ref={googleBtnRef} className="min-h-[44px] flex items-center justify-center"></div>
                  <p className="text-[10px] text-slate-500 mt-2 text-center">
                    Protected by Google Identity Services & RBAC
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
          </div>
        )}
      </div>
    </div>
  );
}
