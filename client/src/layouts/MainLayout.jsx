import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, getPortalPath } from '../context/AuthContext';
import {
  CalendarDays,
  ShieldCheck,
  LogIn,
  LogOut,
  LayoutDashboard,
  User,
  Users,
  PlusCircle,
  FileText,
  PieChart,
  Clock,
  Bell,
  Check,
  CheckCheck,
} from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Poll or load notifications when authenticated
  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getNotifications();
      setNotifications(res.data || []);
    } catch (err) {
      // Non-critical background failure
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [isAuthenticated, location.pathname]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {}
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const portalPath = user ? getPortalPath(user.role_id) : '/';

  const roleColors = {
    1: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    2: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    3: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Nav Links */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-white tracking-tight">LeaveSync</span>
                <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {user?.role_name || 'HR Platform'}
                </span>
              </div>
            </Link>

            {/* Admin-Specific Navigation Items */}
            {isAuthenticated && user?.role_id === 1 && (
              <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800 text-xs font-medium">
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-xl transition ${
                    location.pathname === '/admin'
                      ? 'bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/users"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                    location.pathname === '/admin/users'
                      ? 'bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Users</span>
                </Link>
              </nav>
            )}

            {/* Manager-Specific Navigation Items */}
            {isAuthenticated && user?.role_id === 2 && (
              <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800 text-xs font-medium">
                <Link
                  to="/manager"
                  className={`px-2.5 py-1.5 rounded-xl transition ${
                    location.pathname === '/manager'
                      ? 'bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/manager/leave-requests"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition ${
                    location.pathname === '/manager/leave-requests'
                      ? 'bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending</span>
                </Link>
                <Link
                  to="/manager/calendar"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition ${
                    location.pathname === '/manager/calendar'
                      ? 'bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Calendar</span>
                </Link>
                <Link
                  to="/manager/leave-history"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition ${
                    location.pathname === '/manager/leave-history'
                      ? 'bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span>History</span>
                </Link>
                <Link
                  to="/manager/team-balances"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition ${
                    location.pathname === '/manager/team-balances'
                      ? 'bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5" />
                  <span>Balances</span>
                </Link>
              </nav>
            )}

            {/* Employee-Specific Navigation Items */}
            {isAuthenticated && user?.role_id === 3 && (
              <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800 text-xs font-medium">
                <Link
                  to="/employee"
                  className={`px-2.5 py-1.5 rounded-xl transition ${
                    location.pathname === '/employee'
                      ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/employee/apply-leave"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition ${
                    location.pathname === '/employee/apply-leave'
                      ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Apply</span>
                </Link>
                <Link
                  to="/employee/leave-requests"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition ${
                    location.pathname === '/employee/leave-requests'
                      ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Requests</span>
                </Link>
                <Link
                  to="/employee/calendar"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition ${
                    location.pathname === '/employee/calendar'
                      ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Calendar</span>
                </Link>
                <Link
                  to="/employee/balances"
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition ${
                    location.pathname === '/employee/balances'
                      ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5" />
                  <span>Quotas</span>
                </Link>
              </nav>
            )}
          </div>

          {/* User Status / Notifications / Login Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notification Dropdown Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Box */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-4 space-y-3 z-50">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-xs font-bold text-white">Notifications</span>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Mark read</span>
                            </button>
                          )}
                          <Link
                            to="/notifications"
                            onClick={() => setShowNotifications(false)}
                            className="text-[11px] text-slate-400 hover:text-white font-medium underline"
                          >
                            Open Center
                          </Link>
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-4">
                            No notifications yet.
                          </p>
                        ) : (
                          notifications.slice(0, 8).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                setShowNotifications(false);
                                if (!n.is_read) handleMarkRead(n.id);
                                if (n.leave_request_id) {
                                  if (user.role_id === 2) {
                                    navigate(`/manager/leave-requests/${n.leave_request_id}`);
                                  } else {
                                    navigate(`/employee/leave-requests/${n.leave_request_id}`);
                                  }
                                }
                              }}
                              className={`p-3 rounded-2xl text-xs space-y-1 transition cursor-pointer border ${
                                n.is_read
                                  ? 'bg-slate-950/50 border-slate-850 text-slate-400'
                                  : 'bg-indigo-500/10 border-indigo-500/20 text-slate-200'
                              }`}
                            >
                              <p className="leading-snug">{n.message}</p>
                              <span className="text-[10px] text-slate-500 block">
                                {new Date(n.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800 text-center">
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifications(false)}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          View All Notifications →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-indigo-400" />
                  )}
                  <span className="font-medium text-slate-200 hidden md:inline-block max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      roleColors[user.role_id] || 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {user.role_name || `Role: ${user.role_id}`}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-medium transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-850 bg-slate-900/50 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Employee Leave Management System. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> RBAC & Google OAuth 2.0
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

