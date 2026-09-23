import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  AlertCircle,
  Building,
  User,
  FileText,
} from 'lucide-react';
import { getManagerLeaveRequests, getLeaveTypes } from '../../services/api';
import ReviewModal from './ReviewModal';

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
  const [selectedRequest, setSelectedRequest] = useState(null);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pending Action
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-400 border border-slate-700">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled by Staff
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-blue-400" />
            <span>Team Leave Requests</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Review, authorize, and manage leave applications from your direct reports.
          </p>
        </div>
      </div>

      {/* Notifications / Feedback */}
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

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl backdrop-blur">
        <div className="flex flex-1 items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search employee, email, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Tabs / Selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="PENDING">Pending Only</option>
            <option value="APPROVED">Approved Only</option>
            <option value="REJECTED">Rejected Only</option>
            <option value="CANCELLED">Cancelled Only</option>
            <option value="">All Statuses</option>
          </select>

          {/* Leave Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {leaveTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl backdrop-blur">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading team requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No Leave Requests Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {statusFilter === 'PENDING'
                ? 'All pending leave requests from your team have been processed!'
                : 'No leave applications match the selected filters.'}
            </p>
          </div>
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
                      <div className="text-[11px] text-slate-400">{req.employee_email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
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
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{req.reason}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(req.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="View Application Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {req.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => {
                                setReviewRequest(req);
                                setReviewAction('APPROVE');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition"
                              title="Approve Request"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                setReviewRequest(req);
                                setReviewAction('REJECT');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1 transition"
                              title="Reject Request"
                            >
                              <XCircle className="w-3.5 h-3.5" />
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
        {!loading && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadRequests(pagination.page - 1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadRequests(pagination.page + 1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Leave Request #{selectedRequest.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-850">
                <span className="text-slate-400">Status:</span>
                {getStatusBadge(selectedRequest.status)}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 block">Applicant</span>
                  <span className="font-semibold text-white">{selectedRequest.employee_name}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 block">Category</span>
                  <span className="font-semibold text-white">{selectedRequest.leave_type_name}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                <span className="text-slate-500 block mb-1">Duration & Dates</span>
                <div className="font-medium text-slate-200">
                  {selectedRequest.start_date} to {selectedRequest.end_date}
                </div>
                <span className="text-[11px] font-mono text-blue-400 font-bold">
                  {selectedRequest.days} Day{selectedRequest.days === 1 ? '' : 's'} (Inclusive)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                <span className="text-slate-500 block mb-1">Reason</span>
                <p className="text-slate-200 whitespace-pre-wrap">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.manager_response && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 block mb-1">Supervisor Decision Note</span>
                  <p className="text-slate-200 italic">"{selectedRequest.manager_response}"</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between items-center">
              {selectedRequest.status === 'PENDING' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const req = selectedRequest;
                      setSelectedRequest(null);
                      setReviewRequest(req);
                      setReviewAction('APPROVE');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    Approve Request
                  </button>
                  <button
                    onClick={() => {
                      const req = selectedRequest;
                      setSelectedRequest(null);
                      setReviewRequest(req);
                      setReviewAction('REJECT');
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                  >
                    Reject Request
                  </button>
                </div>
              ) : (
                <div />
              )}
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Approve / Reject Modal */}
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
