import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  User,
  Building,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { getEmployeeLeaveRequestById, cancelLeaveRequest } from '../../services/api';

export default function LeaveRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const loadRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getEmployeeLeaveRequestById(id);
      setRequest(res.data);
    } catch (err) {
      setError(err.message || `Failed to load leave request #${id}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

  const handleCancelSubmit = async () => {
    try {
      setCancelling(true);
      const res = await cancelLeaveRequest(id);
      setActionSuccess(res.message || `Leave request #${id} cancelled successfully.`);
      setShowCancelModal(false);
      loadRequest();
    } catch (err) {
      setError(err.message || 'Failed to cancel leave request.');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pending Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-400 border border-slate-700">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading leave application #{id}...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-8 max-w-3xl mx-auto w-full space-y-6">
        <button
          onClick={() => navigate('/employee/leave-requests')}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Leave Requests</span>
        </button>
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-300 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>Unable to Display Leave Request</span>
          </div>
          <p className="text-xs">{error || 'Leave request not found or access denied.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/employee/leave-requests')}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Leave Requests</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-400" />
              <span>Leave Application #{request.id}</span>
            </h1>
            {getStatusBadge(request.status)}
          </div>
        </div>

        {request.status === 'PENDING' && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition self-start sm:self-auto"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel Application</span>
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Reason */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur space-y-6">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Application Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-1">
                <span className="text-slate-500 block">Leave Category</span>
                <span className="text-sm font-semibold text-white">
                  {request.leave_type_name}
                </span>
                <p className="text-[11px] text-slate-400">{request.leave_type_description}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-1">
                <span className="text-slate-500 block">Calculated Duration</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {request.days} Day{request.days === 1 ? '' : 's'} (Inclusive)
                </span>
                <p className="text-[11px] text-slate-400">
                  {request.start_date} to {request.end_date}
                </p>
              </div>
            </div>

            {/* Reason */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2 text-xs">
              <span className="text-slate-500 font-semibold block">Reason for Absence</span>
              <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{request.reason}</p>
            </div>

            {/* Supervisor Response Note */}
            {request.manager_response && (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2 text-xs">
                <span className="text-indigo-400 font-semibold block">
                  Supervisor Decision Note
                </span>
                <p className="text-slate-200 italic leading-relaxed">
                  "{request.manager_response}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Process Timeline & Supervisor Info */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur space-y-4">
            <h3 className="text-sm font-bold text-white">Status Timeline</h3>

            <div className="space-y-4 text-xs">
              {/* Step 1: Submitted */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">Application Submitted</p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Step 2: Decision */}
              <div className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    request.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : request.status === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-400'
                      : request.status === 'CANCELLED'
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-amber-500/20 text-amber-400 animate-pulse'
                  }`}
                >
                  {request.status === 'APPROVED' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : request.status === 'REJECTED' || request.status === 'CANCELLED' ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">
                    {request.status === 'APPROVED'
                      ? 'Approved by Supervisor'
                      : request.status === 'REJECTED'
                      ? 'Rejected by Supervisor'
                      : request.status === 'CANCELLED'
                      ? 'Cancelled by Staff'
                      : 'Awaiting Supervisor Review'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {request.reviewed_at
                      ? new Date(request.reviewed_at).toLocaleString()
                      : request.status === 'PENDING'
                      ? 'In Review Queue'
                      : new Date(request.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Supervisor Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur space-y-3 text-xs">
            <h3 className="text-sm font-bold text-white">Assigned Supervisor</h3>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850 space-y-1">
              <span className="font-semibold text-white block">{request.manager_name}</span>
              <span className="text-slate-400 text-[11px] block">{request.manager_email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Cancel Leave Application</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel your pending leave application #{request.id} for{' '}
              <strong className="text-white">
                {request.start_date} to {request.end_date}
              </strong>{' '}
              ({request.days} days)?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Keep Request
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelSubmit}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Confirm Cancellation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
