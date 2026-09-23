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
  CalendarDays,
  AlertCircle,
  AlertTriangle,
  History,
  TrendingUp,
  FileSpreadsheet,
  BookOpen,
  Eye,
  Check,
  Ban,
  Inbox
} from 'lucide-react';
import { getManagerStats, getManagerLeaveRequests } from '../../services/api';
import ReviewModal from './ReviewModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

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
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Manager'}!`}
        subtitle={`${user?.department ? `${user.department} Department • ` : ''}Team leave approvals, capacity planning & balance tracking`}
        icon={UserCheck}
        iconColor="text-blue-400"
        badge="Supervisor Portal"
        actions={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Link
              to="/manager/calendar"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
            >
              <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
              <span>Team Calendar</span>
            </Link>
            <Link
              to="/manager/leave-requests"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Review Requests</span>
            </Link>
          </div>
        }
      />

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
          <LoadingSpinner size="lg" />
          <p className="text-xs text-slate-400">Loading manager overview...</p>
        </div>
      ) : (
        <>
          {/* Action Required Banner if pending requests exist */}
          {stats?.pendingRequestsCount > 0 && (
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-amber-500/5">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-300">
                    {stats.pendingRequestsCount} Pending Leave Request{stats.pendingRequestsCount > 1 ? 's' : ''} Awaiting Review
                  </h3>
                  <p className="text-xs text-amber-400/80 mt-0.5">
                    Your direct reports are waiting for your approval. Please review them promptly.
                  </p>
                </div>
              </div>
              <Link
                to="/manager/leave-requests"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition self-start sm:self-auto"
              >
                <span>Review Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Direct Reports"
              value={stats?.directReportsCount || 0}
              subtitle="Assigned Team Members"
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Pending Reviews"
              value={stats?.pendingRequestsCount || 0}
              subtitle="Requires Action"
              icon={Clock}
              color={stats?.pendingRequestsCount > 0 ? 'amber' : 'slate'}
            />
            <StatCard
              title="Approved Requests"
              value={stats?.approvedRequestsCount || 0}
              subtitle="Current Calendar Year"
              icon={CheckCircle2}
              color="emerald"
            />
            <StatCard
              title="Approved Leave Days"
              value={stats?.approvedLeaveDays || 0}
              subtitle="Team Days Off"
              icon={CalendarDays}
              color="purple"
            />
          </div>

          {/* Pending Approval Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Pending Approvals Queue</span>
              </h2>
              {pendingRequests.length > 0 && (
                <Link
                  to="/manager/leave-requests"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                >
                  View All ({pendingRequests.length}) →
                </Link>
              )}
            </div>

            {pendingRequests.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="All caught up!"
                description="There are currently no pending leave requests from your direct reports."
              />
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-3.5 px-4">Employee</th>
                        <th className="py-3.5 px-4">Leave Type</th>
                        <th className="py-3.5 px-4">Dates & Duration</th>
                        <th className="py-3.5 px-4">Reason</th>
                        <th className="py-3.5 px-4 text-right">Review Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {pendingRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">{req.employee_name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{req.employee_email}</div>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-200">
                            {req.leave_type_name}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-200 font-medium">
                              {req.start_date} <span className="text-slate-500">to</span> {req.end_date}
                            </div>
                            <span className="text-[11px] text-blue-400 font-semibold font-mono">
                              {req.days} Day{req.days === 1 ? '' : 's'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-300" title={req.reason}>
                            {req.reason}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setReviewRequest(req);
                                  setReviewAction('APPROVE');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => {
                                  setReviewRequest(req);
                                  setReviewAction('REJECT');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Quick Launch Grid */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Manager Navigation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Link
                to="/manager/calendar"
                className="group p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Team Calendar</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      Visual monthly view of scheduled team leaves to avoid coverage gaps.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 group-hover:text-blue-300 mt-5 pt-3 border-t border-slate-800/60">
                  Open Calendar <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link
                to="/manager/analytics"
                className="group p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/40 shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Team Analytics</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      12-month trends, category usage charts, and team member breakdowns.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 mt-5 pt-3 border-t border-slate-800/60">
                  View Analytics <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link
                to="/manager/reports"
                className="group p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Leave Reports</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      Tabular records of team requests with search, status filters & CSV export.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 mt-5 pt-3 border-t border-slate-800/60">
                  View Reports <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link
                to="/manager/policies"
                className="group p-6 rounded-3xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Leave Policies</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      Review company leave rules, default allowances, and active guidelines.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 group-hover:text-purple-300 mt-5 pt-3 border-t border-slate-800/60">
                  View Policies <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Review Modal Dialog */}
      {reviewRequest && (
        <ReviewModal
          request={reviewRequest}
          actionType={reviewAction}
          initialAction={reviewAction}
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
