import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send,
  Loader2,
  Info,
} from 'lucide-react';
import { getLeaveTypes, getEmployeeBalances, applyForLeave } from '../../services/api';

export default function ApplyLeave() {
  const navigate = useNavigate();

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  // Fetch active leave types and current employee balances
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [typesRes, balancesRes] = await Promise.all([
          getLeaveTypes(),
          getEmployeeBalances(new Date().getFullYear()),
        ]);
        setLeaveTypes(typesRes.data || []);
        setBalances(balancesRes.data || []);
        if (typesRes.data?.length > 0) {
          setFormData((prev) => ({ ...prev, leave_type_id: typesRes.data[0].id }));
        }
      } catch (err) {
        setError(err.message || 'Failed to load leave types or balances.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate inclusive duration
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
    const diffTime = e.getTime() - s.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculatedDays = calculateDays(formData.start_date, formData.end_date);

  // Find selected balance
  const selectedBalance = balances.find(
    (b) => Number(b.leave_type_id) === Number(formData.leave_type_id)
  );

  const remainingDays = selectedBalance ? selectedBalance.remaining_days : 0;
  const isBalanceSufficient = calculatedDays > 0 && calculatedDays <= remainingDays;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!formData.leave_type_id) {
      setError('Please select a leave type.');
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      setError('Please provide valid start and end dates.');
      return;
    }
    if (formData.end_date < formData.start_date) {
      setError('End date cannot be earlier than start date.');
      return;
    }
    if (calculatedDays > remainingDays) {
      setError(
        `Insufficient balance. You have ${remainingDays} day(s) remaining for this leave type, but requested ${calculatedDays} day(s).`
      );
      return;
    }
    if (!formData.reason.trim() || formData.reason.trim().length < 3) {
      setError('Reason must be at least 3 characters.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await applyForLeave({
        leave_type_id: Number(formData.leave_type_id),
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason.trim(),
      });

      setSuccessMsg(res.message || 'Leave request submitted successfully.');
      setTimeout(() => {
        navigate('/employee/leave-requests');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Header & Back Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/employee')}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-emerald-400" />
            <span>Apply for Leave</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Submit a formal time-off application for manager approval.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-12 bg-slate-900/50 rounded-3xl border border-slate-800">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin mr-3" />
          <span className="text-sm text-slate-300">Loading leave categories & quotas...</span>
        </div>
      )}

      {/* Main Form Content */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Card */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur">
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Submission Error</p>
                  <p className="mt-0.5 text-rose-300/90">{error}</p>
                </div>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Success!</p>
                  <p className="mt-0.5 text-emerald-300/90">{successMsg}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Leave Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Leave Category <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.leave_type_id}
                  onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  required
                >
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.description || 'Standard allocation'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Start Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    End Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    min={formData.start_date || undefined}
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    required
                  />
                </div>
              </div>

              {/* Calculated Duration Badge */}
              {formData.start_date && formData.end_date && (
                <div
                  className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border ${
                    formData.end_date < formData.start_date
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      : isBalanceSufficient
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Calculated Duration:</span>
                  </div>
                  <span className="font-bold font-mono text-sm">
                    {formData.end_date < formData.start_date
                      ? 'Invalid Date Range'
                      : `${calculatedDays} Day${calculatedDays === 1 ? '' : 's'} (Inclusive)`}
                  </span>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Reason for Absence <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Provide brief context for your supervisor..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition resize-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/employee')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (calculatedDays > 0 && !isBalanceSufficient)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-emerald-500/25 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Leave Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Balance Preview Card */}
          <div className="space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                <Info className="w-4 h-4" />
                <span>Selected Quota Status</span>
              </div>

              {selectedBalance ? (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                    <span className="text-slate-400">Category:</span>
                    <span className="font-semibold text-white">{selectedBalance.leave_type_name}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                    <span className="text-slate-400">Total Allocated:</span>
                    <span className="font-semibold text-slate-200">{selectedBalance.allocated_days} days</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                    <span className="text-slate-400">Used so far:</span>
                    <span className="font-semibold text-slate-400">{selectedBalance.used_days} days</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-emerald-400 font-bold">
                    <span>Remaining Balance:</span>
                    <span className="text-base font-mono">{selectedBalance.remaining_days} days</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Select a leave category to view balance details.</p>
              )}
            </div>

            {/* Business Rules Callout */}
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 space-y-2 text-[11px] text-slate-400">
              <p className="font-semibold text-slate-300 text-xs">Application Policy</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Start and end dates are inclusive calendar days.</li>
                <li>Your supervisor will be notified immediately upon submission.</li>
                <li>Leave balance is deducted only after supervisor approval.</li>
                <li>You can cancel pending requests at any time before review.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
