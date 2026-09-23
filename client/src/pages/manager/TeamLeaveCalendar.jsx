import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { getManagerLeaveRequests, getTeamBalances, getLeaveTypes } from '../../services/api';
import ReviewModal from './ReviewModal';

export default function TeamLeaveCalendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);

  const [requests, setRequests] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [reviewRequest, setReviewRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);

  useEffect(() => {
    async function loadMeta() {
      try {
        const [teamRes, typesRes] = await Promise.all([
          getTeamBalances(currentYear),
          getLeaveTypes(),
        ]);
        setTeamMembers(teamRes.data || []);
        setLeaveTypes(typesRes.data || []);
      } catch (err) {}
    }
    loadMeta();
  }, [currentYear]);

  const loadTeamLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getManagerLeaveRequests({
        year: currentYear,
        month: currentMonth,
        status: statusFilter || undefined,
        employee_id: employeeFilter || undefined,
        leave_type_id: typeFilter || undefined,
        limit: 200,
      });
      setRequests(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load team calendar leaves.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamLeaves();
  }, [currentYear, currentMonth, statusFilter, employeeFilter, typeFilter]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  const handleReviewSuccess = (msg) => {
    setActionSuccess(msg);
    loadTeamLeaves();
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Calendar grid math
  const firstDayOfMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();
  const daysInPrevMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 0)).getUTCDate();

  const calendarDays = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    calendarDays.push({
      dateStr: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
      dayNum,
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      dateStr: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      dayNum: i,
      isCurrentMonth: true,
    });
  }

  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    calendarDays.push({
      dateStr: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
      dayNum: i,
      isCurrentMonth: false,
    });
  }

  const getLeavesForDate = (dateStr) => {
    return requests.filter((req) => req.start_date <= dateStr && req.end_date >= dateStr);
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30';
      case 'PENDING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30';
      case 'REJECTED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30';
      case 'CANCELLED':
        return 'bg-slate-700/50 text-slate-400 border-slate-700 hover:bg-slate-700/70';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-blue-400" />
            <span>Team Leave Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Overview of scheduled time-off and active coverage across all direct reports.
          </p>
        </div>

        <Link
          to="/manager/leave-requests"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 text-xs font-semibold transition self-start sm:self-auto"
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals Queue</span>
        </Link>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xl backdrop-blur">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-bold text-white min-w-[140px] text-center font-mono">
              {monthNames[currentMonth - 1]} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-semibold transition"
          >
            Today
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Employee Filter */}
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Team Members</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">Approved Only</option>
            <option value="PENDING">Pending Only</option>
            <option value="REJECTED">Rejected Only</option>
            <option value="CANCELLED">Cancelled Only</option>
          </select>

          {/* Category Filter */}
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

      {/* Calendar Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur">
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950 text-center text-xs font-bold uppercase tracking-wider text-slate-400 py-3">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-xs text-slate-400">Rendering team schedule...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/60 bg-slate-950/40">
            {calendarDays.map((cell, idx) => {
              const dayLeaves = getLeavesForDate(cell.dateStr);
              const isToday = cell.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] sm:min-h-[120px] p-2 flex flex-col justify-between transition ${
                    cell.isCurrentMonth
                      ? 'bg-slate-900/40 hover:bg-slate-900/80'
                      : 'bg-slate-950/70 text-slate-600 opacity-60'
                  } ${isToday ? 'ring-1 ring-blue-500/50 bg-blue-950/10' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-blue-500 text-slate-950 font-extrabold shadow-md shadow-blue-500/30'
                          : cell.isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    {dayLeaves.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                        {dayLeaves.length} leave{dayLeaves.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[80px]">
                    {dayLeaves.map((leave) => (
                      <button
                        key={leave.id}
                        onClick={() => setSelectedEvent(leave)}
                        className={`w-full text-left px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold border truncate transition block ${getStatusStyles(
                          leave.status
                        )}`}
                        title={`${leave.employee_name} - ${leave.leave_type_name} (${leave.status})`}
                      >
                        <span className="truncate block">
                          <strong>{leave.employee_name?.split(' ')[0]}:</strong> {leave.leave_type_name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
        <span className="font-semibold text-slate-300 text-xs">Calendar Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/40" />
          <span>Approved</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500/40" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-rose-500/20 border border-rose-500/40" />
          <span>Rejected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-slate-700/50 border border-slate-700" />
          <span>Cancelled</span>
        </div>
      </div>

      {/* Details & Review Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  Leave Request #{selectedEvent.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 block">Employee</span>
                  <span className="font-semibold text-white">{selectedEvent.employee_name}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 block">Category</span>
                  <span className="font-semibold text-white">{selectedEvent.leave_type_name}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                <span className="text-slate-500 block mb-1">Duration & Dates</span>
                <span className="font-mono text-blue-400 font-bold">
                  {selectedEvent.start_date} to {selectedEvent.end_date} ({selectedEvent.days} days)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                <span className="text-slate-500 block mb-1">Reason:</span>
                <p className="text-slate-200">{selectedEvent.reason}</p>
              </div>

              {selectedEvent.manager_response && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 block mb-1">Your Decision Note:</span>
                  <p className="text-slate-200 italic">"{selectedEvent.manager_response}"</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              {selectedEvent.status === 'PENDING' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const req = selectedEvent;
                      setSelectedEvent(null);
                      setReviewRequest(req);
                      setReviewAction('APPROVE');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    Approve Request
                  </button>
                  <button
                    onClick={() => {
                      const req = selectedEvent;
                      setSelectedEvent(null);
                      setReviewRequest(req);
                      setReviewAction('REJECT');
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                  >
                    Reject Request
                  </button>
                </div>
              ) : (
                <Link
                  to={`/manager/leave-requests/${selectedEvent.id}`}
                  className="text-xs font-semibold text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </Link>
              )}
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
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
