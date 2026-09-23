import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Calendar,
  Clock,
  CheckCircle2,
  PlusCircle,
  Loader2,
  AlertCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { getEmployeeBalances } from '../../services/api';

export default function LeaveBalances() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBalances = async (year) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getEmployeeBalances(year);
      setBalances(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load leave balances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalances(selectedYear);
  }, [selectedYear]);

  // Aggregate totals
  const totalAllocated = balances.reduce((sum, b) => sum + Number(b.allocated_days || 0), 0);
  const totalUsed = balances.reduce((sum, b) => sum + Number(b.used_days || 0), 0);
  const totalRemaining = balances.reduce((sum, b) => sum + Number(b.remaining_days || 0), 0);

  // Category visual palettes
  const categoryStyles = {
    'Casual Leave': {
      border: 'border-emerald-500/20',
      bg: 'from-emerald-950/40 to-slate-900/80',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      progress: 'bg-emerald-500',
    },
    'Sick Leave': {
      border: 'border-blue-500/20',
      bg: 'from-blue-950/40 to-slate-900/80',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      progress: 'bg-blue-500',
    },
    'Earned Leave': {
      border: 'border-purple-500/20',
      bg: 'from-purple-950/40 to-slate-900/80',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      progress: 'bg-purple-500',
    },
    'Optional Holiday': {
      border: 'border-amber-500/20',
      bg: 'from-amber-950/40 to-slate-900/80',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      progress: 'bg-amber-500',
    },
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header with Year Selector & Apply CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <PieChart className="w-6 h-6 text-emerald-400" />
            <span>Leave Quotas & Balances</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Annual entitlement breakdown, usage statistics, and available days.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Year selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900 text-white">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <Link
            to="/employee/apply-leave"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/25 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
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

      {/* Aggregate Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Quota Allocated</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalAllocated} <span className="text-xs font-sans text-slate-400">days</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Days Consumed</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {totalUsed} <span className="text-xs font-sans text-slate-400">days</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-950/30 border border-emerald-500/30 shadow-xl backdrop-blur space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span>Total Days Available</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {totalRemaining} <span className="text-xs font-sans text-emerald-400/80">days remaining</span>
          </div>
        </div>
      </div>

      {/* Leave Category Quota Cards */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-slate-900/50 rounded-3xl border border-slate-800">
          <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
          <p className="text-xs text-slate-400">Loading leave quotas for {selectedYear}...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {balances.map((b) => {
            const style = categoryStyles[b.leave_type_name] || {
              border: 'border-slate-800',
              bg: 'from-slate-900/80 to-slate-950/80',
              badge: 'bg-slate-800 text-slate-300 border-slate-700',
              progress: 'bg-indigo-500',
            };

            const usedPercent =
              b.allocated_days > 0 ? Math.min(100, Math.round((b.used_days / b.allocated_days) * 100)) : 0;

            return (
              <div
                key={b.id}
                className={`p-6 rounded-3xl bg-gradient-to-br ${style.bg} border ${style.border} shadow-xl backdrop-blur space-y-5`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {b.leave_type_name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {b.leave_type_description || 'Standard corporate leave quota'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${style.badge}`}>
                    Year {b.year}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>Quota Consumption</span>
                    <span className="font-mono text-slate-200">{usedPercent}% Used</span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${style.progress}`}
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-850">
                    <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">
                      Allocated
                    </span>
                    <span className="text-base font-bold font-mono text-slate-200">
                      {b.allocated_days}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-850">
                    <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">
                      Used
                    </span>
                    <span className="text-base font-bold font-mono text-slate-400">
                      {b.used_days}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-emerald-400/80 block text-[10px] uppercase tracking-wider font-semibold">
                      Remaining
                    </span>
                    <span className="text-base font-bold font-mono text-emerald-300">
                      {b.remaining_days}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
