import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck,
  Search,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  AlertCircle,
  Eye,
  Check,
  Ban,
  Inbox,
  History
} from 'lucide-react';
import { getManagerLeaveRequests, getLeaveTypes } from '../../services/api';
import ReviewModal from './ReviewModal';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('PENDING'); // Default to pending
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [reviewRequest, setReviewRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'APPROVE' or 'REJECT'

  // Load Leave Types
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

  // Load Requests
  const loadRequests = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getManagerLeaveRequests({
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
      setError(err.message || 'Failed to fetch team leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests(1);
  }, [statusFilter, typeFilter]);

  const handleReviewSuccess = (msg) => {
    setActionSuccess(msg);
    loadRequests(pagination.page);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Client search filter
  const filteredRequests = requests.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.employee_name?.toLowerCase().includes(q) ||
      r.employee_email?.toLowerCase().includes(q) ||
      r.leave_type_name?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <PageHeader
        title="Team Leave Requests"
        subtitle="Review, approve, and manage pending time-off applications from direct reports"
        icon={UserCheck}
        iconColor="text-blue-400"
        actions={
          <Link
            to="/manager/leave-history"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
          >
            <History className="w-4 h-4 text-slate-400" />
            <span>Full History</span>
          </Link>
        }
      />

      {/* Action Success / Error Alerts */}
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

      {/* Filter Controls */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
          <Search className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by employee name, email, or reason..."
            aria-label="Search team requests"
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
            aria-label="Filter by request status"
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Action Only</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {/* Category Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by leave category"
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
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

      {/* Team Requests Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading requests queue...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No leave requests found"
            description="No requests match your selected status or search filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Duration & Dates</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{req.employee_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{req.employee_email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {req.leave_type_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200 font-medium">
                        {req.start_date} <span className="text-slate-500">to</span> {req.end_date}
                      </div>
                      <span className="text-[11px] text-blue-400 font-semibold font-mono">
                        {req.days} Day{req.days === 1 ? '' : 's'} (Inclusive)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-300" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/manager/leave-requests/${req.id}`}
                          aria-label={`View full details for request #${req.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                        {req.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setReviewRequest(req);
                                setReviewAction('APPROVE');
                              }}
                              aria-label={`Approve request #${req.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReviewRequest(req);
                                setReviewAction('REJECT');
                              }}
                              aria-label={`Reject request #${req.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition focus:outline-none focus:ring-1 focus:ring-rose-500"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
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
