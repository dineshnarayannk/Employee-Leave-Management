import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getLeaveTypes } from '../../services/api';
import {
  Shield,
  Layers,
  Info,
  Calendar,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

export default function LeavePolicies() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getLeaveTypes();
      setPolicies(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load company leave policies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Policy Guidelines</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Company Leave Policies
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Official annual allocations, policy guidelines, and leave categories applicable to your team.
          </p>
        </div>

        <button
          onClick={fetchPolicies}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition self-start md:self-auto"
          title="Refresh Policies"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Manager Guidelines:</span> Review these standard category allowances when evaluating team leave requests. All leave requests are calculated on an inclusive calendar day basis.
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between text-rose-400 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchPolicies}
            className="text-xs font-semibold underline hover:text-rose-300 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Policies Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : policies.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-medium text-slate-300">No active leave policies found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-semibold text-white tracking-tight">
                    {policy.name}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    Active
                  </span>
                </div>

                <p className="text-xs text-slate-400 min-h-[40px] line-clamp-2">
                  {policy.description || 'Standard corporate leave policy.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Standard Allowance</span>
                    <span className="text-xl font-bold text-blue-400">
                      {policy.default_days} <span className="text-xs font-normal text-slate-400">days/year</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[11px]">Calculation</span>
                    <span className="text-xs font-medium text-slate-300">Inclusive Days</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
