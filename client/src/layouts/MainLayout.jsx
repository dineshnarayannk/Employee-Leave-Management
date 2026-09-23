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
  CheckCheck,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  FileSpreadsheet,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
} from 'lucide-react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Theme state: dark / light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

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

  const roleColors = {
    1: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    2: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    3: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  const adminNavItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Reports', path: '/admin/reports', icon: FileSpreadsheet },
    { label: 'Policies', path: '/admin/leave-policies', icon: BookOpen },
  ];

  const managerNavItems = [
    { label: 'Dashboard', path: '/manager', icon: LayoutDashboard },
    { label: 'Pending', path: '/manager/leave-requests', icon: Clock },
    { label: 'Calendar', path: '/manager/calendar', icon: CalendarDays },
    { label: 'History', path: '/manager/leave-history', icon: FileText },
    { label: 'Analytics', path: '/manager/analytics', icon: BarChart3 },
    { label: 'Reports', path: '/manager/reports', icon: FileSpreadsheet },
    { label: 'Policies', path: '/manager/policies', icon: BookOpen },
    { label: 'Balances', path: '/manager/team-balances', icon: PieChart },
  ];

  const employeeNavItems = [
    { label: 'Dashboard', path: '/employee', icon: LayoutDashboard },
    { label: 'Apply Leave', path: '/employee/apply-leave', icon: PlusCircle },
    { label: 'My Requests', path: '/employee/leave-requests', icon: FileText },
    { label: 'My Calendar', path: '/employee/calendar', icon: CalendarDays },
    { label: 'My Quotas', path: '/employee/balances', icon: PieChart },
  ];

  let currentNavItems = [];
  if (user?.role_id === 1) {
    currentNavItems = adminNavItems;
  } else if (user?.role_id === 2) {
    currentNavItems = managerNavItems;
  } else if (user?.role_id === 3) {
    currentNavItems = employeeNavItems;
  }

  const isLinkActive = (path) => {
    if (path === '/admin' || path === '/manager' || path === '/employee') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const getActiveClass = (path) => {
    const active = isLinkActive(path);
    if (!active) {
      return 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60';
    }
    if (user?.role_id === 1) {
      return 'bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/30';
    }
    if (user?.role_id === 2) {
      return 'bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/30';
    }
    return 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30';
  };

  // If user is not authenticated (e.g. Login screen), render clean full-width layout
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
        <footer className="border-t border-slate-850 bg-slate-900/50 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© 2026 Employee360°. All rights reserved.</p>
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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Mobile Top Header (Visible on Mobile & Tablet < lg) */}
      <header className="lg:hidden sticky top-0 z-50 backdrop-blur-md bg-slate-900/90 border-b border-slate-800/80 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={mobileMenuOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to={getPortalPath(user.role_id)} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
              <CalendarDays className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-white tracking-tight">Employee360°</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle (Mobile) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Notification Button */}
          <Link
            to="/notifications"
            className="relative p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* User Avatar */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-indigo-400" />
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Visible when mobile menu is open) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex">
          <div className="w-72 bg-slate-900 border-r border-slate-800 h-full flex flex-col p-4 space-y-4 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer Top */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-sm text-white tracking-tight">Employee360°</span>
                  <span className="block text-[10px] font-semibold text-indigo-400">
                    {user.role_name || 'Portal'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 overflow-y-auto space-y-1" aria-label="Mobile Drawer Navigation">
              {currentNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition ${getActiveClass(
                      item.path
                    )}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 opacity-60" />
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Drawer Bottom */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <Link
                to="/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-400" />
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition font-medium"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </div>
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* Desktop Left Sidebar (Hidden on mobile < lg) */}
      <aside
        className={`hidden lg:flex flex-col h-screen sticky top-0 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/90 z-40 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Top: Brand Logo + Hide / Expand Icon Button */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between">
          <Link
            to={getPortalPath(user.role_id)}
            className={`flex items-center gap-2.5 overflow-hidden transition-all duration-200 ${
              isSidebarCollapsed ? 'justify-center w-full' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate">
                <span className="font-bold text-base text-white tracking-tight block">
                  Employee360°
                </span>
                <span className="text-[10px] font-semibold text-indigo-400 -mt-0.5 block">
                  {user.role_name || 'Portal'}
                </span>
              </div>
            )}
          </Link>

          {/* Hide / Collapse Sidebar Button at Top */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              isSidebarCollapsed ? 'hidden' : ''
            }`}
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* When collapsed, show expand icon button right below header */}
        {isSidebarCollapsed && (
          <div className="py-2 flex justify-center border-b border-slate-800/50">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <PanelLeftOpen className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        )}

        {/* Middle: Navigation Links */}
        <nav
          className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
          aria-label="Left Sidebar Navigation"
        >
          {currentNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition ${
                  isSidebarCollapsed ? 'justify-center' : ''
                } ${getActiveClass(item.path)}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                {!isSidebarCollapsed && <span className="font-medium truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section: Notification, Theme Switcher, User Profile, Sign Out */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          {/* Notification Trigger Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-950/60 hover:bg-slate-850 border border-slate-800/80 text-xs text-slate-300 transition focus:outline-none ${
                isSidebarCollapsed ? 'justify-center' : 'justify-between'
              }`}
              title="Notifications"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Notifications</span>}
              </div>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-[10px] font-bold text-white flex-shrink-0">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Box */}
            {showNotifications && (
              <div
                className="absolute bottom-12 left-0 w-80 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-100"
                role="dialog"
                aria-label="Notification Center"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Notifications</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 focus:outline-none"
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

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">No notifications yet.</p>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
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
                        className={`p-2.5 rounded-xl text-xs space-y-1 transition cursor-pointer border ${
                          n.is_read
                            ? 'bg-slate-950/50 border-slate-850 text-slate-400 hover:text-slate-300'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-slate-200 hover:bg-indigo-500/15'
                        }`}
                      >
                        <p className="leading-snug text-[11px]">{n.message}</p>
                        <span className="text-[9px] text-slate-500 block">
                          {new Date(n.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Switcher Bar - directly on top of the employee/user card */}
          <div
            className={`flex items-center ${
              isSidebarCollapsed ? 'justify-center' : 'justify-between'
            } px-1 pt-1 text-xs`}
          >
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Theme
              </span>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className={`p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80 transition flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                isSidebarCollapsed ? 'w-full justify-center' : ''
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  {!isSidebarCollapsed && <span className="text-[11px]">Light Mode</span>}
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  {!isSidebarCollapsed && <span className="text-[11px]">Dark Mode</span>}
                </>
              )}
            </button>
          </div>

          {/* User Profile Card */}
          <div
            className={`p-2 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2.5 ${
              isSidebarCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-indigo-400">
                  <User className="w-4 h-4" />
                </div>
              )}

              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border inline-block ${
                      roleColors[user.role_id] || 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {user.role_name || `Role: ${user.role_id}`}
                  </span>
                </div>
              )}
            </div>

            {!isSidebarCollapsed && (
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign Out"
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition focus:outline-none"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sign Out Button in Collapsed Mode */}
          {isSidebarCollapsed && (
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign Out"
              title="Sign Out"
              className="w-full flex justify-center p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition focus:outline-none"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-slate-950">
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-850 bg-slate-900/50 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© 2026 Employee360°. All rights reserved.</p>
            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" /> RBAC & Google OAuth 2.0
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
