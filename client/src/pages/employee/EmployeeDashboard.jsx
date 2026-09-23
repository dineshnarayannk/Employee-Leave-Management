import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  ArrowRight,
  PieChart,
  Loader2,
  Calendar,
  AlertCircle,
  Sparkles,
  Bell,
  Sun,
  Eye,
} from 'lucide-react';
import {
  getEmployeeStats,
  getEmployeeBalances,
  getEmployeeLeaveRequests,
} from '../../services/api';

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [balances, setBalances] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const [statsRes, balancesRes, requestsRes] = await Promise.all([
          getEmployeeStats(),
          getEmployeeBalances(new Date().getFullYear()),
          getEmployeeLeaveRequests({ page: 1, limit: 5 }),
        ]);

        setStats(statsRes.data || {});
        setBalances(balancesRes.data || []);
        setRecentRequests(requestsRes.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load employee dashboard.');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/20 shadow-xl backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] || 'Employee'}!
              </h1>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Staff Portal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {user?.department ? `${user.department} Department • ` : ''}Personal leave balance & time-off management
            </p>
          </div>
        </div>

        {/* Quick Action CTAs */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link
            to="/employee/calendar"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>My Calendar</span>
          </Link>
          <Link
            to="/employee/apply-leave"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/25 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply Leave</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-slate-900/50 rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-xs text-slate-400">Loading your leave profile...</p>
        </div>
      ) : (
        <>
          {/* Key KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-emerald-950/30 border border-emerald-500/30 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
                <span>Available Leave Days</span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-emerald-300">
                {stats?.totalRemainingDays || 0}{' '}
                <span className="text-xs font-sans text-emerald-400/80">days</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Pending Approvals</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-amber-400">
                {stats?.pendingRequestsCount || 0}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Approved Requests</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-white">
                {stats?.approvedRequestsCount || 0}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Rejected Requests</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-white">
                {stats?.rejectedRequestsCount || 0}
              </div>
            </div>
          </div>

          {/* Upcoming Approved Leaves Card */}
          {stats?.upcomingLeaves && stats.upcomingLeaves.length > 0 && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Sun className="w-4 h-4" />
                  <span>Upcoming Approved Time Off</span>
                </div>
                <Link
                  to="/employee/calendar"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  <span>View in Calendar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {stats.upcomingLeaves.map((up) => (
                  <div
                    key={up.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/20 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{up.leave_type_name}</span>
                      <span className="font-mono font-bold text-emerald-400">{up.days} d</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      {up.start_date} to {up.end_date}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leave Quota Overview Widgets */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <span>Annual Leave Quotas ({new Date().getFullYear()})</span>
              </h2>
              <Link
                to="/employee/balances"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
              >
                <span>View Full Breakdown</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {balances.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{b.leave_type_name}</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {b.remaining_days} left
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Used: {b.used_days} d</span>
                    <span>Total: {b.allocated_days} d</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${
                          b.allocated_days > 0
                            ? Math.min(100, Math.round((b.used_days / b.allocated_days) * 100))
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Applications Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-400" />
                <span>Recent Leave Applications</span>
              </h2>
              <Link
                to="/employee/leave-requests"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
              >
                <span>View All History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur">
              {recentRequests.length === 0 ? (
                <div className="p-10 text-center space-y-2 text-xs text-slate-400">
                  <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No recent leave applications submitted yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Request</th>
                        <th className="py-3 px-4">Leave Type</th>
                        <th className="py-3 px-4">Dates & Duration</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {recentRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-300">
                            #{req.id}
                          </td>
                          <td className="py-3 px-4 font-semibold text-white">
                            {req.leave_type_name}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-200">
                              {req.start_date} to {req.end_date}
                            </span>
                            <span className="ml-2 font-mono text-[11px] text-emerald-400 font-semibold">
                              ({req.days} d)
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                            {req.reason}
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(req.status)}</td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/employee/leave-requests/${req.id}`}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition inline-flex"
                              title="View Application Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
