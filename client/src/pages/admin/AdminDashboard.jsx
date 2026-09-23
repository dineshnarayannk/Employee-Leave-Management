import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Users, 
  UserCheck, 
  Building2, 
  ArrowRight, 
  TrendingUp, 
  FileSpreadsheet, 
  BookOpen, 
  Shield, 
  Activity,
  CalendarCheck
} from 'lucide-react';
import { getAdminStats } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';

export default function AdminDashboard() {
  const { user } = useAuth();
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
      <PageHeader
        title="Admin Portal"
        subtitle="System governance, leave policy configuration & organization management"
        icon={ShieldCheck}
        iconColor="text-purple-400"
        badge="Role: Administrator"
        actions={
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 transition focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <Users className="w-4 h-4" />
            <span>Manage Users</span>
          </Link>
        }
      />

      {/* KPI Metrics Grid */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-slate-900/50 rounded-3xl border border-slate-800">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-slate-400">Loading system metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Registered Users"
            value={stats.totalUsers}
            subtitle="Organization Accounts"
            icon={Users}
            color="purple"
          />
          <StatCard
            title="Active Managers"
            value={stats.activeManagers}
            subtitle="Department Leads"
            icon={UserCheck}
            color="blue"
          />
          <StatCard
            title="Active Employees"
            value={stats.activeEmployees}
            subtitle="Staff Members"
            icon={Users}
            color="emerald"
          />
          <StatCard
            title="Departments"
            value={stats.totalDepartments}
            subtitle="Active Divisions"
            icon={Building2}
            color="amber"
          />
        </div>
      )}

      {/* Admin Modules Quick Launch */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Administration Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* User Management Card */}
          <Link
            to="/admin/users"
            className="group p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 shadow-xl transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">User Directory</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  Create employees & managers, assign structures, and manage account statuses.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 group-hover:text-purple-300 mt-5 pt-3 border-t border-slate-800/60">
              Manage Users <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          {/* Analytics Card */}
          <Link
            to="/admin/analytics"
            className="group p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 shadow-xl transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Leave Analytics</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  Visual graphs, monthly trends, department breakdown, and status metrics.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 mt-5 pt-3 border-t border-slate-800/60">
              View Analytics <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          {/* Reports Card */}
          <Link
            to="/admin/reports"
            className="group p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 shadow-xl transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">System Reports</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  Audit-ready tabular reports with department filters, CSV export, and print view.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 group-hover:text-blue-300 mt-5 pt-3 border-t border-slate-800/60">
              Open Reports <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          {/* Leave Policies Card */}
          <Link
            to="/admin/leave-policies"
            className="group p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 shadow-xl transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Leave Policies</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  Configure leave categories, default annual allowances, and active rules.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 mt-5 pt-3 border-t border-slate-800/60">
              Manage Policies <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
