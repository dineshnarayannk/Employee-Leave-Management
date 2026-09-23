import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  CalendarDays,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { getEmployeeLeaveRequests, getLeaveTypes } from '../../services/api';

export default function MyLeaveCalendar() {
  const navigate = useNavigate();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed (1 to 12)

  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    async function loadTypes() {
      try {
        const res = await getLeaveTypes();
        setLeaveTypes(res.data || []);
      } catch (err) {}
    }
    loadTypes();
  }, []);

  const loadMonthLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getEmployeeLeaveRequests({
        year: currentYear,
        month: currentMonth,
        status: statusFilter || undefined,
        leave_type_id: typeFilter || undefined,
        limit: 100,
      });
      setRequests(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load calendar leaves.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonthLeaves();
  }, [currentYear, currentMonth, statusFilter, typeFilter]);

  // Calendar calculations
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

  // Generate 42 calendar grid cells (6 rows x 7 days)
  const firstDayOfMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 1)).getUTCDay(); // 0 = Sun
  const daysInMonth = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();
  const daysInPrevMonth = new Date(Date.UTC(currentYear, currentMonth - 1, 0)).getUTCDate();

  const calendarDays = [];

  // Previous month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarDays.push({
      dateStr,
      dayNum,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({
      dateStr,
      dayNum: i,
      isCurrentMonth: true,
    });
  }

  // Next month padding
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({
      dateStr,
      dayNum: i,
      isCurrentMonth: false,
    });
  }

  // Helper to find leaves active on dateStr
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
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-emerald-400" />
            <span>My Leave Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Visualize your scheduled leaves, approval states, and planned time off.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            to="/employee/apply-leave"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/25 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply Leave</span>
          </Link>
        </div>
      </div>

      {/* Month Navigation & Filters Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xl backdrop-blur">
        {/* Month Picker Controls */}
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
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="APPROVED">Approved Only</option>
            <option value="PENDING">Pending Only</option>
            <option value="REJECTED">Rejected Only</option>
            <option value="CANCELLED">Cancelled Only</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
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

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Calendar Grid Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950 text-center text-xs font-bold uppercase tracking-wider text-slate-400 py-3">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Day Cells */}
        {loading ? (
          <div className="p-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-400">Rendering calendar days...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/60 bg-slate-950/40">
            {calendarDays.map((cell, idx) => {
              const dayLeaves = getLeavesForDate(cell.dateStr);
              const isToday = cell.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] sm:min-h-[110px] p-2 flex flex-col justify-between transition ${
                    cell.isCurrentMonth
                      ? 'bg-slate-900/40 hover:bg-slate-900/80'
                      : 'bg-slate-950/70 text-slate-600 opacity-60'
                  } ${isToday ? 'ring-1 ring-emerald-500/50 bg-emerald-950/10' : ''}`}
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/30'
                          : cell.isCurrentMonth
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    {dayLeaves.length > 0 && (
                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                        {dayLeaves.length} item{dayLeaves.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Leave Event Pills */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[70px]">
                    {dayLeaves.map((leave) => (
                      <button
                        key={leave.id}
                        onClick={() => setSelectedEvent(leave)}
                        className={`w-full text-left px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold border truncate transition block ${getStatusStyles(
                          leave.status
                        )}`}
                        title={`${leave.leave_type_name} (${leave.status})`}
                      >
                        <span className="truncate block">
                          {leave.leave_type_name}
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

      {/* Leave Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
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
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex justify-between items-center">
                <span className="text-slate-400">Category:</span>
                <span className="font-semibold text-white">{selectedEvent.leave_type_name}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex justify-between items-center">
                <span className="text-slate-400">Duration:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {selectedEvent.start_date} to {selectedEvent.end_date} ({selectedEvent.days} days)
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                <span className="text-slate-500 block mb-1">Reason:</span>
                <p className="text-slate-200">{selectedEvent.reason}</p>
              </div>
              {selectedEvent.manager_response && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 block mb-1">Supervisor Note:</span>
                  <p className="text-slate-200 italic">"{selectedEvent.manager_response}"</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Link
                to={`/employee/leave-requests/${selectedEvent.id}`}
                className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Page</span>
              </Link>
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
    </div>
  );
}
