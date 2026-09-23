import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  PlusCircle,
  Search,
  Eye,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Inbox
} from 'lucide-react';
import { getEmployeeLeaveRequests, cancelLeaveRequest, getLeaveTypes } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

export default function MyLeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [cancellingRequest, setCancellingRequest] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Fetch leave types on mount
  useEffect(() => {
    async function loadTypes() {
      try {
        const res = await getLeaveTypes();
        setLeaveTypes(res.data || []);
      } catch (err) {
        console.error('Failed to load leave types:', err.message);
      }
    }
    loadTypes();
  }, []);

  // Load requests when filters or page changes
  const loadRequests = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getEmployeeLeaveRequests({
        status: statusFilter || undefined,
        leave_type_id: typeFilter || undefined,
        page,
        limit: 10,
      });

      setRequests(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(1);
  }, [statusFilter, typeFilter]);

  // Handle Cancel action
  const handleCancelSubmit = async () => {
    if (!cancellingRequest) return;
    try {
      setCancelLoading(true);
      setError(null);
      const res = await cancelLeaveRequest(cancellingRequest.id);
      setActionSuccess(res.message || `Leave request #${cancellingRequest.id} cancelled successfully.`);
      setCancellingRequest(null);
      loadRequests(pagination.page);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to cancel leave request.');
    } finally {
      setCancelLoading(false);
    }
  };

  // Filter client-side search query (for reasons / dates)
  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.leave_type_name.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      r.start_date.includes(q) ||
      r.end_date.includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header & New Application CTA */}
      <PageHeader
        title="My Leave Requests"
        subtitle="Track status, view supervisor reviews, and manage your leave requests"
        icon={CalendarDays}
        iconColor="text-emerald-400"
        actions={
          <Link
            to="/employee/apply-leave"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/25 transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply for Leave</span>
          </Link>
        }
      />

      {/* Notifications / Alerts */}
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

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
          <Search className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by reason or dates..."
            aria-label="Search requests"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Category Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by leave type"
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Leave Types</option>
            {leaveTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading leave requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No leave requests found"
            description="You haven't submitted any leave requests matching the current filter criteria."
            actionText="Apply for Leave"
            actionLink="/employee/apply-leave"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Request ID</th>
                  <th className="py-3.5 px-4">Leave Category</th>
                  <th className="py-3.5 px-4">Duration & Dates</th>
                  <th className="py-3.5 px-4">Supervisor</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-300">#{req.id}</td>
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
                    <td className="py-3.5 px-4 text-slate-300">{req.manager_name || 'Assigned Lead'}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/employee/leave-requests/${req.id}`}
                          aria-label={`View details for request #${req.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                        {req.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => setCancellingRequest(req)}
                            aria-label={`Cancel request #${req.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/20 transition focus:outline-none focus:ring-1 focus:ring-rose-500"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && requests.length > 0 && (
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>
              Showing <span className="font-semibold text-white">{requests.length}</span> of{' '}
              <span className="font-semibold text-white">{pagination.total}</span> requests
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadRequests(pagination.page - 1)}
                disabled={pagination.page <= 1}
                aria-label="Previous page"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition focus:outline-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-white font-semibold">
                {pagination.page} / {pagination.totalPages || 1}
              </span>
              <button
                type="button"
                onClick={() => loadRequests(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                aria-label="Next page"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition focus:outline-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancellingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Cancel Leave Request</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel request <strong className="text-white">#{cancellingRequest.id}</strong> (
              {cancellingRequest.leave_type_name} for {cancellingRequest.start_date} to {cancellingRequest.end_date})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingRequest(null)}
                disabled={cancelLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Keep Request
              </button>
              <button
                type="button"
                onClick={handleCancelSubmit}
                disabled={cancelLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-500/25 transition disabled:opacity-50"
              >
                {cancelLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>{cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
