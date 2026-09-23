import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Search,
  Loader2,
  AlertCircle,
  Building,
  Layers,
  PieChart,
} from 'lucide-react';
import { getTeamBalances } from '../../services/api';

export default function TeamBalances() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [teamMembers, setTeamMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBalances = async (year) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTeamBalances(year);
      setTeamMembers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch team leave balances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalances(selectedYear);
  }, [selectedYear]);

  const filteredMembers = teamMembers.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.department && m.department.toLowerCase().includes(q));
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <PieChart className="w-6 h-6 text-blue-400" />
            <span>Team Leave Balances</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Overview of remaining time-off quotas and balance utilization for your direct reports.
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs self-start sm:self-auto">
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
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-500 ml-2" />
        <input
          type="text"
          placeholder="Filter team member by name, email, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none"
        />
      </div>

      {/* Team Member Cards */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-slate-900/50 rounded-3xl border border-slate-800">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-xs text-slate-400">Loading team quotas for {selectedYear}...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-slate-900/50 rounded-3xl border border-slate-800">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No Direct Reports Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No active team members are currently assigned to you or match your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur space-y-5"
            >
              {/* Member Profile */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{member.name}</h3>
                  <p className="text-xs text-slate-400">{member.email}</p>
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {member.department || 'Staff'}
                </span>
              </div>

              {/* Balances List */}
              <div className="space-y-3">
                {member.balances.map((b) => {
                  const usedPercent =
                    b.allocated_days > 0
                      ? Math.min(100, Math.round((b.used_days / b.allocated_days) * 100))
                      : 0;

                  return (
                    <div
                      key={b.id}
                      className="p-3 rounded-2xl bg-slate-950/70 border border-slate-850 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{b.leave_type_name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 text-[11px]">
                            Used: <strong className="text-slate-300 font-mono">{b.used_days}</strong>/{b.allocated_days} d
                          </span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {b.remaining_days} left
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${usedPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
