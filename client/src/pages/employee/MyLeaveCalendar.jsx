import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  Sparkles,
  Gift,
  Building,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Filter,
} from 'lucide-react';
import { getCalendarEvents, downloadCalendarIcs } from '../../services/api';

export default function MyLeaveCalendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed (1 to 12)
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'agenda'

  // Events & Loading states
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({ totalEvents: 0, holidayCount: 0, leaveCount: 0, companyEventCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Category filters
  const [showHolidays, setShowHolidays] = useState(true);
  const [showCompanyEvents, setShowCompanyEvents] = useState(true);
  const [showLeaves, setShowLeaves] = useState(true);

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to format date string YYYY-MM-DD
  const formatYMD = (year, month, day) => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate start and end dates covering full month grid (with previous and next month padding)
      const startDate = formatYMD(currentMonth === 1 ? currentYear - 1 : currentYear, currentMonth === 1 ? 12 : currentMonth - 1, 20);
      const endDate = formatYMD(currentMonth === 12 ? currentYear + 1 : currentYear, currentMonth === 12 ? 1 : currentMonth + 1, 15);

      const activeCategories = [];
      if (showHolidays) activeCategories.push('holidays');
      if (showCompanyEvents) activeCategories.push('company_events');
      if (showLeaves) activeCategories.push('leaves');

      const res = await getCalendarEvents({
        start_date: startDate,
        end_date: endDate,
        categories: activeCategories.length > 0 ? activeCategories : ['none'],
      });

      setEvents(res.data?.events || []);
      if (res.data?.summary) setSummary(res.data.summary);
    } catch (err) {
      setError(err.message || 'Failed to load calendar events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [currentYear, currentMonth, showHolidays, showCompanyEvents, showLeaves]);

  // Date Navigation
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

  const handleExportIcs = async () => {
    try {
      setExporting(true);
      await downloadCalendarIcs(currentYear, showHolidays);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
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
    calendarDays.push({
      dateStr: formatYMD(prevYear, prevMonth, dayNum),
      dayNum,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      dateStr: formatYMD(currentYear, currentMonth, i),
      dayNum: i,
      isCurrentMonth: true,
    });
  }

  // Next month padding
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    calendarDays.push({
      dateStr: formatYMD(nextYear, nextMonth, i),
      dayNum: i,
      isCurrentMonth: false,
    });
  }

  // Filter events active on dateStr
  const getEventsForDate = (dateStr) => {
    return events.filter((ev) => ev.startDate <= dateStr && ev.endDate >= dateStr);
  };

  const todayStr = formatYMD(today.getFullYear(), today.getMonth() + 1, today.getDate());

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-emerald-400" />
            <span>Employee Leave & Holiday Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Integrated Google Calendar holidays, company events, and approved time-off schedules.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Export to ICS Button */}
          <button
            type="button"
            onClick={handleExportIcs}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 text-xs font-semibold shadow-sm transition disabled:opacity-50"
            title="Download .ics file to sync with Google Calendar, Apple Calendar or Outlook"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-indigo-400" />}
            <span>Export (.ics)</span>
          </button>

          {/* Apply Leave Button */}
          <Link
            to="/employee/apply-leave"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/25 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply Leave</span>
          </Link>
        </div>
      </div>

      {/* Month Navigation & Category Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl backdrop-blur">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-bold text-white min-w-[150px] text-center font-mono">
              {monthNames[currentMonth - 1]} {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-semibold transition"
          >
            Today
          </button>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-slate-950 rounded-xl border border-slate-800 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                viewMode === 'month' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Month Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                viewMode === 'agenda' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Agenda List
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500 text-[11px] font-semibold hidden lg:inline">Filter Feeds:</span>
          
          <button
            type="button"
            onClick={() => setShowLeaves(!showLeaves)}
            className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition ${
              showLeaves
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Approved Leaves ({summary.leaveCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHolidays(!showHolidays)}
            className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition ${
              showHolidays
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <Gift className="w-3 h-3 text-amber-400" />
            <span>Holidays ({summary.holidayCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCompanyEvents(!showCompanyEvents)}
            className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition ${
              showCompanyEvents
                ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-sm'
                : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
            }`}
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Company Events ({summary.companyEventCount})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Calendar View: Month Grid or Agenda View */}
      {viewMode === 'month' ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur">
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

          {/* Grid Cells */}
          {loading ? (
            <div className="p-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading Google Calendar feeds & leaves...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/60 bg-slate-950/40">
              {calendarDays.map((cell, idx) => {
                const dayEvents = getEventsForDate(cell.dateStr);
                const isToday = cell.dateStr === todayStr;

                return (
                  <div
                    key={idx}
                    className={`min-h-[95px] sm:min-h-[115px] p-2 flex flex-col justify-between transition ${
                      cell.isCurrentMonth
                        ? 'bg-slate-900/40 hover:bg-slate-900/80'
                        : 'bg-slate-950/70 text-slate-600 opacity-50'
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
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                          {dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Event Pills */}
                    <div className="space-y-1 flex-1 overflow-y-auto max-h-[75px]">
                      {dayEvents.map((ev) => {
                        const isHoliday = ev.category === 'HOLIDAY';
                        const isCompanyEvent = ev.category === 'COMPANY_EVENT';
                        const isOwnLeave = ev.employee?.isSelf;

                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => setSelectedEvent(ev)}
                            className={`w-full text-left px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold border truncate transition flex items-center gap-1.5 shadow-2xs ${
                              isHoliday
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                                : isCompanyEvent
                                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25'
                                : isOwnLeave
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/25'
                            }`}
                            title={`${ev.title} (${ev.startDate} to ${ev.endDate})`}
                          >
                            {isHoliday ? (
                              <Gift className="w-3 h-3 text-amber-400 shrink-0" />
                            ) : isCompanyEvent ? (
                              <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            )}
                            <span className="truncate">{ev.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Agenda List View */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-400" />
            <span>Monthly Agenda Schedule ({monthNames[currentMonth - 1]} {currentYear})</span>
          </h3>

          {events.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-10">No events found for this filter selection.</p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-850/50 px-3 rounded-xl transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        ev.category === 'HOLIDAY'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : ev.category === 'COMPANY_EVENT'
                          ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {ev.category === 'HOLIDAY' ? (
                        <Gift className="w-4 h-4" />
                      ) : ev.category === 'COMPANY_EVENT' ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <CalendarDays className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{ev.title}</p>
                      <p className="text-[11px] text-slate-400">{ev.category.replace('_', ' ')}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-semibold text-slate-300 block">
                      {ev.startDate} {ev.startDate !== ev.endDate ? `to ${ev.endDate}` : ''}
                    </span>
                    <span className="text-[10px] text-slate-500">{ev.source.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendar Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-sm">
        <span className="font-semibold text-slate-300">Feed Legend:</span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/40" />
          <span>My Approved Leaves</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-cyan-500/20 border border-cyan-500/40" />
          <span>Team Member Leaves</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500/40" />
          <span>Public Holidays</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-indigo-500/20 border border-indigo-500/40" />
          <span>Company Milestone Events</span>
        </div>
      </div>

      {/* Selected Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    selectedEvent.category === 'HOLIDAY'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : selectedEvent.category === 'COMPANY_EVENT'
                      ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {selectedEvent.category === 'HOLIDAY' ? (
                    <Gift className="w-4 h-4" />
                  ) : selectedEvent.category === 'COMPANY_EVENT' ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <CalendarDays className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white truncate max-w-[260px]">
                    {selectedEvent.title}
                  </h3>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                    {selectedEvent.category.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Details Content */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex justify-between items-center">
                <span className="text-slate-400">Date Window:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {selectedEvent.startDate} {selectedEvent.startDate !== selectedEvent.endDate ? `to ${selectedEvent.endDate}` : ''}
                </span>
              </div>

              {selectedEvent.days && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex justify-between items-center">
                  <span className="text-slate-400">Total Duration:</span>
                  <span className="font-semibold text-white">{selectedEvent.days} Day{selectedEvent.days === 1 ? '' : 's'} (Inclusive)</span>
                </div>
              )}

              {selectedEvent.employee && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                  <span className="text-slate-500 block text-[11px]">Staff Member:</span>
                  <p className="font-semibold text-white">{selectedEvent.employee.name} ({selectedEvent.employee.email})</p>
                  {selectedEvent.employee.department && (
                    <span className="text-indigo-400 text-[10px] font-semibold">{selectedEvent.employee.department} Department</span>
                  )}
                </div>
              )}

              {selectedEvent.description && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 block mb-1">Details / Overview:</span>
                  <p className="text-slate-200">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.reason && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 block mb-1">Reason for Absence:</span>
                  <p className="text-slate-200 italic">"{selectedEvent.reason}"</p>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              {selectedEvent.id.startsWith('leave-') && (
                <Link
                  to={`/employee/leave-requests/${selectedEvent.id.replace('leave-', '')}`}
                  className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Leave Details</span>
                </Link>
              )}
              <div className="flex-1" />
              <button
                type="button"
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
