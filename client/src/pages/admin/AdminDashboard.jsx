import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Users, 
  UserCheck, 
  Building2, 
  LogOut, 
  CheckCircle2, 
  ArrowRight, 
  Calendar,
  Layers,
  UserPlus
} from 'lucide-react';
import { getAdminStats } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeEmployees: 0,
    activeManagers: 0,
    totalDepartments: 0,
    pendingLeaves: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await getAdminStats();
        if (res.data) setStats(res.data);
      } catch (err) {
        console.error('Failed to load admin metrics:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-purple-500/20 shadow-xl backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Admin Portal</h1>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                role_id: 1
              </span>
            </div>
            <p className="text-sm text-slate-400">Governance, leave policies, and organizational management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition"
          >
            <Users className="w-4 h-4" />
            <span>Manage Users</span>
          </Link>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Users */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-lg space-y-2 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Total Registered Users</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            {loading ? <LoadingSpinner size="sm" /> : stats.totalUsers}
          </p>
        </div>

        {/* Active Managers */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-lg space-y-2 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Active Managers</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-400">
            {loading ? <LoadingSpinner size="sm" /> : stats.activeManagers}
          </p>
        </div>

        {/* Active Employees */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-lg space-y-2 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Active Employees</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {loading ? <LoadingSpinner size="sm" /> : stats.activeEmployees}
          </p>
        </div>

        {/* Departments */}
        <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-lg space-y-2 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Building2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-400">Active Departments</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">
            {loading ? <LoadingSpinner size="sm" /> : stats.totalDepartments}
          </p>
        </div>
      </div>

      {/* Admin Modules Quick Launch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Management Card */}
        <Link
          to="/admin/users"
          className="group p-6 rounded-3xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 shadow-xl transition-all flex items-start justify-between gap-4"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">User Management</h3>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Add employees, create managers, assign reporting structures, and manage active directory states.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
              Open Directory <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>

        {/* Admin Profile Overview */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrator Security Context</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-850 text-xs space-y-2">
            <p className="text-slate-300">
              <strong>Account:</strong> {user?.name} ({user?.email})
            </p>
            <p className="text-slate-300">
              <strong>Department:</strong> {user?.department || 'Executive / HR'}
            </p>
            <div className="pt-1 flex items-center gap-2 text-emerald-400 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full TiDB Database Access & Audit Logging Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
