import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  CalendarDays,
  Clock,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  PieChart,
  AlertCircle,
  Calendar,
  Eye,
  Inbox
} from 'lucide-react';
import {
  getEmployeeStats,
  getEmployeeBalances,
  getEmployeeLeaveRequests,
} from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

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

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Portal Header */}
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Employee'}!`}
        subtitle={`${user?.department ? `${user.department} Department • ` : ''}Personal leave balance & time-off management`}
        icon={Users}
        iconColor="text-emerald-400"
        badge="Staff Portal"
        actions={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Link
              to="/employee/calendar"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>My Calendar</span>
            </Link>
            <Link
              to="/employee/apply-leave"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/25 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Apply Leave</span>
            </Link>
          </div>
        }
      />

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-slate-900/50 rounded-3xl border border-slate-800">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-slate-400">Loading your leave profile...</p>
        </div>
      ) : (
        <>
          {/* Key KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Remaining Leave Days"
              value={stats?.totalRemainingDays || 0}
              subtitle="Available Quota"
              icon={PieChart}
              color="emerald"
            />
            <StatCard
              title="Pending Requests"
              value={stats?.pendingRequestsCount || 0}
              subtitle="Under Manager Review"
              icon={Clock}
              color={stats?.pendingRequestsCount > 0 ? 'amber' : 'slate'}
            />
            <StatCard
              title="Approved Requests"
              value={stats?.approvedRequestsCount || 0}
              subtitle="Approved This Year"
              icon={CheckCircle2}
              color="blue"
            />
            <StatCard
              title="Approved Days Used"
              value={stats?.usedLeaveDays || 0}
              subtitle="Days Taken"
              icon={CalendarDays}
              color="purple"
            />
          </div>

          {/* Leave Quota Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Annual Leave Balances ({new Date().getFullYear()})
              </h2>
              <Link
                to="/employee/balances"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                View Quotas Details →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {balances.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{b.leave_type_name}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {b.year}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-2xl font-bold text-emerald-400">{b.remaining_days}</span>
                      <span className="text-xs text-slate-400"> / {b.allocated_days} days left</span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Used: {b.used_days}d</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          b.allocated_days > 0 ? (b.used_days / b.allocated_days) * 100 : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Leave Requests Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Recent Leave Activity</span>
              </h2>
              <Link
                to="/employee/leave-requests"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
              >
                All Applications →
              </Link>
            </div>

            {recentRequests.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No leave requests yet"
                description="You haven't submitted any leave requests for this calendar year."
                actionText="Apply for Leave"
                actionLink="/employee/apply-leave"
              />
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Period & Duration</th>
                        <th className="py-3.5 px-4">Reason</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {recentRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3.5 px-4 font-semibold text-white">
                            {req.leave_type_name}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-200 font-medium">
                              {req.start_date} <span className="text-slate-500">to</span> {req.end_date}
                            </div>
                            <span className="text-[11px] text-emerald-400 font-semibold font-mono">
                              {req.days} Day{req.days === 1 ? '' : 's'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-300" title={req.reason}>
                            {req.reason}
                          </td>
                          <td className="py-3.5 px-4">
                            <StatusBadge status={req.status} />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to={`/employee/leave-requests/${req.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
