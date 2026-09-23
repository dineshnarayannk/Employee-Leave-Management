import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAdminReports, getAdminLeaveTypes } from '../../services/api';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  Calendar,
  Building2,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';

export default function LeaveReports() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ totalRecords: 0, pageApprovedDays: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [year, setYear] = useState(currentYear);
  const [status, setStatus] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [department, setDepartment] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Load Leave Types for filter
  useEffect(() => {
    getAdminLeaveTypes()
      .then((res) => setLeaveTypes(res.data || []))
      .catch(() => {});
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAdminReports({
        year: year || undefined,
        status: status || undefined,
        leave_type_id: leaveTypeId || undefined,
        department: department || undefined,
        search: search || undefined,
        page,
        limit: 20,
      });

      setRecords(res.data || []);
      setSummary(res.summary || { totalRecords: 0, pageApprovedDays: 0 });
      setPagination(res.pagination || { page: 1, limit: 20, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message || 'Failed to generate organization leave reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [year, status, leaveTypeId, department, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  const handleResetFilters = () => {
    setYear(currentYear);
    setStatus('');
    setLeaveTypeId('');
    setDepartment('');
    setSearch('');
    setPage(1);
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (records.length === 0) return;

    const headers = [
      'Request ID',
      'Employee Name',
      'Employee Email',
      'Department',
      'Manager Name',
      'Leave Type',
      'Start Date',
      'End Date',
      'Days',
      'Status',
      'Reason',
      'Manager Notes',
      'Submitted Date',
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [
      headers.join(','),
      ...records.map((r) =>
        [
          r.id,
          escapeCSV(r.employee_name),
          escapeCSV(r.employee_email),
          escapeCSV(r.employee_department),
          escapeCSV(r.manager_name),
          escapeCSV(r.leave_type_name),
          r.start_date,
          r.end_date,
          r.days,
          r.status,
          escapeCSV(r.reason),
          escapeCSV(r.manager_response || ''),
          r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '',
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `company-leave-report-${year || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const statusBadges = {
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    CANCELLED: 'bg-slate-700/50 text-slate-400 border-slate-700',
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden print:border-none print:p-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Organization Reports</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            System Leave Reports
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Audit-ready company-wide leave records, filterable reports, and CSV exports.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-purple-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 print:hidden">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Year Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value ? Number(e.target.value) : '');
                setPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">All Years</option>
              <option value={currentYear - 1}>{currentYear - 1}</option>
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear + 1}>{currentYear + 1}</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Leave Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={leaveTypeId}
              onChange={(e) => {
                setLeaveTypeId(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">All Categories</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>
                  {lt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Engineering"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Search Field */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or reason..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium py-2 px-4 rounded-xl transition shadow-md shadow-purple-600/20"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Total Filtered Records</span>
          <div className="text-2xl font-bold text-white mt-1">{summary.totalRecords}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Approved Days (This View)</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{summary.pageApprovedDays}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-400 font-medium">Reporting Authority</span>
          <div className="text-sm font-semibold text-purple-300 mt-1">Admin (System-Wide)</div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchReports} className="text-xs font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {/* Report Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-800/60 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4"># ID</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Manager</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4 text-center">Days</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
                    <span>Compiling system-wide report...</span>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-600" />
                    <p className="text-base font-medium text-slate-300">No records found matching filters</p>
                    <p className="text-xs text-slate-500 mt-1">Try broadening your search or year criteria.</p>
                  </td>
                </tr>
              ) : (
                records.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                      #{row.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{row.employee_name}</div>
                      <div className="text-xs text-slate-400">{row.employee_department || row.employee_email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {row.manager_name || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">
                        {row.leave_type_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <div>{row.start_date}</div>
                      <div className="text-slate-500">to {row.end_date}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-200">
                      {row.days}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          statusBadges[row.status] || 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-xs text-slate-300 truncate" title={row.reason}>
                        {row.reason}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 print:hidden">
            <span>
              Showing Page <span className="font-semibold text-white">{pagination.page}</span> of{' '}
              <span className="font-semibold text-white">{pagination.totalPages}</span> ({pagination.total} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
