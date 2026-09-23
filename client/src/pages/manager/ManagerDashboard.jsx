import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UserCheck,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  PieChart,
  Loader2,
  Calendar,
  AlertCircle,
  AlertTriangle,
  History,
  CalendarDays,
  Sun,
  Eye,
} from 'lucide-react';
import { getManagerStats, getManagerLeaveRequests } from '../../services/api';
import ReviewModal from './ReviewModal';

export default function ManagerDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Review Modal state
  const [reviewRequest, setReviewRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsRes, requestsRes] = await Promise.all([
        getManagerStats(),
        getManagerLeaveRequests({ status: 'PENDING', page: 1, limit: 5 }),
      ]);

      setStats(statsRes.data || {});
      setPendingRequests(requestsRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load manager dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleReviewSuccess = (msg) => {
    setActionSuccess(msg);
    loadDashboard();
    setTimeout(() => setActionSuccess(null), 4000);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-blue-500/20 shadow-xl backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Welcome back, {user?.name?.split(' ')[0] || 'Manager'}!
              </h1>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Supervisor Portal
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {user?.department ? `${user.department} Department • ` : ''}Team leave approvals, capacity planning & balance tracking
            </p>
          </div>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link
            to="/manager/calendar"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <CalendarDays className="w-4 h-4 text-blue-400" />
            <span>Team Calendar</span>
          </Link>
          <Link
            to="/manager/leave-history"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Leave History</span>
          </Link>
          <Link
            to="/manager/leave-requests"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition"
          >
            <Clock className="w-4 h-4" />
            <span>Pending Reviews</span>
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-slate-900/50 rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-xs text-slate-400">Loading manager overview...</p>
        </div>
      ) : (
        <>
          {/* Action Required Banner if pending requests exist */}
          {stats?.pendingRequestsCount > 0 && (
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-amber-300">
                    {stats.pendingRequestsCount} Pending Leave Request
                    {stats.pendingRequestsCount > 1 ? 's' : ''} Awaiting Review
                  </h3>
                  <p className="text-xs text-amber-400/80">
                    Your direct reports are waiting for your approval. Please review them promptly.
                  </p>
                </div>
              </div>
              <Link
                to="/manager/leave-requests"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition self-start sm:self-auto"
              >
                Review Now
              </Link>
            </div>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-amber-950/20 border border-amber-500/30 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
                <span>Pending Approvals</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-amber-300">
                {stats?.pendingRequestsCount || 0}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Assigned Direct Reports</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-white">
                {stats?.directReportsCount || 0}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Approved (This Month)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-emerald-400">
                {stats?.approvedThisMonthCount || 0}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Rejected (This Month)</span>
                <XCircle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-bold font-mono text-white">
                {stats?.rejectedThisMonthCount || 0}
              </div>
            </div>
          </div>

          {/* Upcoming Team Approved Leaves Widget */}
          {stats?.upcomingLeaves && stats.upcomingLeaves.length > 0 && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Sun className="w-4 h-4" />
                  <span>Upcoming Team Time Off (Next Approved Leaves)</span>
                </div>
                <Link
                  to="/manager/calendar"
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  <span>Open Team Calendar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {stats.upcomingLeaves.map((up) => (
                  <div
                    key={up.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-blue-500/20 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white truncate max-w-[120px]">
                        {up.employee_name}
                      </span>
                      <span className="font-mono font-bold text-blue-400">{up.days} d</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{up.leave_type_name}</p>
                    <p className="text-slate-500 text-[10px]">
                      {up.start_date} to {up.end_date}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Applications Queue */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Pending Leave Applications</span>
              </h2>
              <Link
                to="/manager/leave-requests"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
              >
                <span>View Full Team Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur">
              {pendingRequests.length === 0 ? (
                <div className="p-12 text-center space-y-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="font-semibold text-white">All caught up!</p>
                  <p>No pending leave applications currently require your review.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Dates & Duration</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4 text-right">Review Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {pendingRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <div>{req.employee_name}</div>
                            <div className="text-[11px] font-normal text-slate-400">
                              {req.employee_email}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-200">{req.leave_type_name}</td>
                          <td className="py-3.5 px-4">
                            <span className="text-slate-200">
                              {req.start_date} to {req.end_date}
                            </span>
                            <span className="ml-2 font-mono text-[11px] text-blue-400 font-bold">
                              ({req.days} d)
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                            {req.reason}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/manager/leave-requests/${req.id}`}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => {
                                  setReviewRequest(req);
                                  setReviewAction('APPROVE');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setReviewRequest(req);
                                  setReviewAction('REJECT');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-1 transition"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Quick Team Balances shortcut */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Team Leave Quotas & Balances</h3>
                <p className="text-xs text-slate-400">
                  Inspect annual quotas, used days, and remaining balances for each direct report.
                </p>
              </div>
            </div>
            <Link
              to="/manager/team-balances"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold border border-slate-700 transition"
            >
              View Team Balances
            </Link>
          </div>
        </>
      )}

      {/* Review Modal */}
      {reviewRequest && reviewAction && (
        <ReviewModal
          request={reviewRequest}
          actionType={reviewAction}
          onClose={() => {
            setReviewRequest(null);
            setReviewAction(null);
          }}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
