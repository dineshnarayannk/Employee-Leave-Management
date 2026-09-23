import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAdminAnalytics } from '../../services/api';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  Users,
  Building2,
  PieChart as PieIcon,
  RefreshCw,
  AlertCircle,
  FileText,
  ShieldCheck,
  Award,
} from 'lucide-react';

const STATUS_COLORS = {
  APPROVED: '#10B981',
  PENDING: '#F59E0B',
  REJECTED: '#EF4444',
  CANCELLED: '#64748B',
};

export default function Analytics() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminAnalytics(year);
      setData(res.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load organization analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [year]);

  const summary = data?.summary || {
    totalUsers: 0,
    activeEmployees: 0,
    activeManagers: 0,
    totalDepartments: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    cancelledRequests: 0,
    approvedLeaveDays: 0,
  };

  const monthlyTrend = data?.monthlyTrend || [];
  const statusDistribution = (data?.statusDistribution || []).filter((s) => s.count > 0);
  const leaveTypeUsage = data?.leaveTypeUsage || [];
  const departmentBreakdown = data?.departmentBreakdown || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Organization Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Leave Analytics & Insights
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            System-wide leave volume, approval distributions, department trends, and category usage.
          </p>
        </div>

        {/* Year Selector & Refresh */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer"
            >
              <option value={currentYear - 1} className="bg-slate-900 text-white">
                {currentYear - 1}
              </option>
              <option value={currentYear} className="bg-slate-900 text-white">
                {currentYear}
              </option>
              <option value={currentYear + 1} className="bg-slate-900 text-white">
                {currentYear + 1}
              </option>
            </select>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
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
            onClick={fetchAnalytics}
            className="text-xs font-semibold underline hover:text-rose-300 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Analytics Content */}
      {data && (
        <>
          {/* Organization KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Total Applications</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white mt-2">
                {summary.totalRequests}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span className="text-emerald-400 font-medium">{summary.approvedRequests} Approved</span>
                <span>•</span>
                <span className="text-amber-400 font-medium">{summary.pendingRequests} Pending</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Approved Leave Days</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-2">
                {summary.approvedLeaveDays}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Calculated across all approved leaves in {year}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Active Workforce</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white mt-2">
                {summary.activeEmployees + summary.activeManagers}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {summary.activeEmployees} Employees • {summary.activeManagers} Managers
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Active Departments</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-400 mt-2">
                {summary.totalDepartments}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Across {summary.totalUsers} registered accounts
              </div>
            </div>
          </div>

          {/* Charts Row 1: Monthly Trends & Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Chart */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">System Monthly Leave Volume</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Approved leave days and total applications across company</p>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="approvedDays" name="Approved Days" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalRequests" name="Total Requests" fill="#A855F7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Distribution Pie */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-white">Application Status Distribution</h3>
                <p className="text-xs text-slate-400 mt-0.5">Overall leave decisions in {year}</p>
              </div>

              {statusDistribution.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-10">
                  <PieIcon className="w-12 h-12 stroke-1 mb-2 text-slate-600" />
                  <p className="text-sm">No leave requests in {year}</p>
                </div>
              ) : (
                <div className="h-64 w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {statusDistribution.map((entry) => (
                          <Cell key={`cell-${entry.status}`} fill={STATUS_COLORS[entry.status] || '#94A3B8'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Charts Row 2: Category Utilization & Department Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Usage */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="mb-4">
                <h3 className="text-base font-semibold text-white">Leave Category Utilization</h3>
                <p className="text-xs text-slate-400 mt-0.5">Most requested leave categories across the organization</p>
              </div>

              {leaveTypeUsage.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">No leave categories found</div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={leaveTypeUsage}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={12} tickLine={false} width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="totalRequests" name="Total Requests" fill="#6366F1" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="approvedCount" name="Approved" fill="#10B981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Department Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Department Summary</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Leave activity aggregated by department</p>
                </div>
                <Building2 className="w-5 h-5 text-slate-500" />
              </div>

              {departmentBreakdown.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-10">
                  <Building2 className="w-10 h-10 stroke-1 mb-2 text-slate-600" />
                  <p className="text-sm">No department data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Department</th>
                        <th className="pb-3 font-semibold text-center">Staff Count</th>
                        <th className="pb-3 font-semibold text-center">Total Requests</th>
                        <th className="pb-3 font-semibold text-center">Approved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {departmentBreakdown.map((dept) => (
                        <tr key={dept.department} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 font-medium text-slate-200">
                            {dept.department}
                          </td>
                          <td className="py-3 text-center text-slate-400">
                            {dept.totalEmployees}
                          </td>
                          <td className="py-3 text-center font-semibold text-slate-300">
                            {dept.totalRequests}
                          </td>
                          <td className="py-3 text-center font-semibold text-emerald-400">
                            {dept.approvedRequests}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
