import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { approveLeaveRequest, rejectLeaveRequest } from '../../services/api';

export default function ReviewModal({ request, actionType, onClose, onSuccess }) {
  const [responseMsg, setResponseMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!request || !actionType) return null;

  const isApprove = actionType === 'APPROVE';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isApprove && (!responseMsg.trim() || responseMsg.trim().length < 3)) {
      setError('Please provide a reason for rejecting this leave request (minimum 3 characters).');
      return;
    }

    try {
      setLoading(true);
      if (isApprove) {
        await approveLeaveRequest(request.id, responseMsg.trim());
      } else {
        await rejectLeaveRequest(request.id, responseMsg.trim());
      }
      onSuccess?.(
        isApprove
          ? `Leave request #${request.id} for ${request.employee_name} was APPROVED.`
          : `Leave request #${request.id} for ${request.employee_name} was REJECTED.`
      );
      onClose();
    } catch (err) {
      setError(err.message || `Failed to ${isApprove ? 'approve' : 'reject'} leave request.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div
        className={`bg-slate-900 border rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl ${
          isApprove ? 'border-emerald-500/30' : 'border-rose-500/30'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {isApprove ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-white">
                {isApprove ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              <p className="text-xs text-slate-400">Request #{request.id} • {request.employee_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Application Summary Box */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Employee:</span>
            <span className="font-semibold text-white">{request.employee_name} ({request.employee_email})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Leave Category:</span>
            <span className="font-semibold text-white">{request.leave_type_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Duration:</span>
            <span className="font-bold font-mono text-emerald-400">
              {request.start_date} to {request.end_date} ({request.days} days)
            </span>
          </div>
          <div className="pt-2 border-t border-slate-850">
            <span className="text-slate-500 block mb-1">Employee Reason:</span>
            <p className="text-slate-300 italic">"{request.reason}"</p>
          </div>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {isApprove ? 'Supervisor Remarks / Note (Optional)' : 'Reason for Rejection *'}
            </label>
            <textarea
              rows={3}
              value={responseMsg}
              onChange={(e) => setResponseMsg(e.target.value)}
              placeholder={
                isApprove
                  ? 'Add an optional note to the approval notification (e.g. Approved, please hand over duties)...'
                  : 'Specify why this application is rejected (required)...'
              }
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
              required={!isApprove}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-lg transition ${
                isApprove
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-500/20'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isApprove ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Approval</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
