import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  Gift,
  Building,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  X,
  UserCheck,
} from 'lucide-react';
import { getCalendarEvents, downloadCalendarIcs, getTeamBalances } from '../../services/api';

export default function TeamLeaveCalendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed (1 to 12)
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'agenda'

  // Events & Loading states
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({ totalEvents: 0, holidayCount: 0, leaveCount: 0, companyEventCount: 0 });
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [showHolidays, setShowHolidays] = useState(true);
  const [showCompanyEvents, setShowCompanyEvents] = useState(true);
  const [showLeaves, setShowLeaves] = useState(true);
  const [employeeFilter, setEmployeeFilter] = useState('');

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

  // Load team members for filter dropdown
  useEffect(() => {
    async function loadTeam() {
      try {
        const res = await getTeamBalances(currentYear);
        setTeamMembers(res.data || []);
      } catch (err) {
        console.warn('Could not fetch team members for filter:', err.message);
      }
    }
    loadTeam();
  }, [currentYear]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate start and end dates covering full month grid
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
        employee_id: employeeFilter || undefined,
      });

      setEvents(res.data?.events || []);
      if (res.data?.summary) setSummary(res.data.summary);
    } catch (err) {
      setError(err.message || 'Failed to load team calendar events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [currentYear, currentMonth, showHolidays, showCompanyEvents, showLeaves, employeeFilter]);

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

  // Next month padding to fill out 42 cells (6 rows)
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

  const todayStr = formatYMD(today.getFullYear(), today.getMonth() + 1, today.getDate());

  // Get events matching a specific calendar cell
  const getEventsForDate = (dateStr) => {
    return events.filter((ev) => ev.startDate <= dateStr && ev.endDate >= dateStr);
  };

  // Get badge styles for different event categories
  const getEventBadgeClass = (category) => {
    switch (category) {
      case 'HOLIDAY':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25';
      case 'COMPANY_EVENT':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25';
      case 'APPROVED_LEAVE':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25';
      default:
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    }
  };

  const getEventIcon = (category) => {
    switch (category) {
      case 'HOLIDAY':
        return <Gift className="w-3 h-3 text-amber-400 shrink-0" />;
      case 'COMPANY_EVENT':
        return <Building className="w-3 h-3 text-indigo-400 shrink-0" />;
      case 'APPROVED_LEAVE':
        return <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />;
      default:
        return <CalendarIcon className="w-3 h-3 text-blue-400 shrink-0" />;
    }
  };

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
            Synchronized schedule of team leaves, public holidays, and company events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/manager/leave-requests"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 text-xs font-semibold transition"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Queue</span>
          </Link>

          <button
            onClick={handleExportIcs}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition shadow-sm disabled:opacity-50"
            title="Download iCalendar file (.ics) to import into Google Calendar or Outlook"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>Export ICS</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{summary.totalEvents}</div>
            <div className="text-[11px] text-slate-400">Total Events</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{summary.leaveCount}</div>
            <div className="text-[11px] text-slate-400">Approved Leaves</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{summary.holidayCount}</div>
            <div className="text-[11px] text-slate-400">Public Holidays</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{summary.companyEventCount}</div>
            <div className="text-[11px] text-slate-400">Company Events</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Navigation & Controls Toolbar */}
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
            <span className="px-3 text-xs sm:text-sm font-bold text-white min-w-[150px] text-center font-mono">
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

        {/* View Toggle & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Employee Filter */}
          <div className="flex items-center">
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Direct Reports</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                viewMode === 'month'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                viewMode === 'agenda'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Agenda
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowLeaves(!showLeaves)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                showLeaves
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-950 text-slate-500 border-slate-800 opacity-60'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Leaves</span>
            </button>

            <button
              onClick={() => setShowHolidays(!showHolidays)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                showHolidays
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950 text-slate-500 border-slate-800 opacity-60'
              }`}
            >
              <Gift className="w-3 h-3" />
              <span>Holidays</span>
            </button>

            <button
              onClick={() => setShowCompanyEvents(!showCompanyEvents)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                showCompanyEvents
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-950 text-slate-500 border-slate-800 opacity-60'
              }`}
            >
              <Building className="w-3 h-3" />
              <span>Company</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar View: Month Grid or Agenda List */}
      {viewMode === 'month' ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950 text-center text-xs font-bold uppercase tracking-wider text-slate-400 py-3">
            <span className="text-rose-400/80">Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span className="text-blue-400/80">Sat</span>
          </div>

          {loading ? (
            <div className="p-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Fetching team calendar & holidays...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/60 bg-slate-950/40">
              {calendarDays.map((cell, idx) => {
                const dayEvents = getEventsForDate(cell.dateStr);
                const isToday = cell.dateStr === todayStr;

                return (
                  <div
                    key={idx}
                    className={`min-h-[110px] sm:min-h-[130px] p-2 flex flex-col justify-between transition ${
                      cell.isCurrentMonth
                        ? 'bg-slate-900/40 hover:bg-slate-900/80'
                        : 'bg-slate-950/70 text-slate-600 opacity-60'
                    } ${isToday ? 'ring-1 ring-blue-500/60 bg-blue-950/20' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? 'bg-blue-500 text-slate-950 font-extrabold shadow-md shadow-blue-500/40'
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

                    {/* Day Events Stack */}
                    <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                      {dayEvents.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`w-full text-left px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold border truncate transition flex items-center gap-1.5 shadow-sm ${getEventBadgeClass(
                            ev.category
                          )}`}
                          title={`${ev.title} (${ev.category})`}
                        >
                          {getEventIcon(ev.category)}
                          <span className="truncate">{ev.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Agenda List View */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-400" />
              <span>Agenda for {monthNames[currentMonth - 1]} {currentYear}</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{events.length} upcoming items</span>
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-xs text-slate-400">Loading agenda view...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No calendar events or approved leaves match your current filters.
            </div>
          ) : (
            <div className="space-y-2.5">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850 hover:border-slate-700 transition flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      {getEventIcon(ev.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-white truncate">
                        {ev.title}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{ev.startDate}</span>
                        {ev.endDate !== ev.startDate && (
                          <>
                            <span>→</span>
                            <span className="font-mono">{ev.endDate}</span>
                          </>
                        )}
                        {ev.department && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] border border-slate-800">
                            {ev.department}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getEventBadgeClass(
                      ev.category
                    )}`}
                  >
                    {ev.category.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
        <span className="font-semibold text-slate-300">Legend:</span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/40" />
          <span>Approved Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500/40" />
          <span>Google Public Holiday</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-md bg-indigo-500/20 border border-indigo-500/40" />
          <span>Company Scheduled Event</span>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {getEventIcon(selectedEvent.category)}
                <h3 className="text-base font-bold text-white truncate">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 block mb-0.5">Category</span>
                  <span className="font-semibold text-white uppercase tracking-wide">
                    {selectedEvent.category.replace('_', ' ')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 block mb-0.5">Source</span>
                  <span className="font-semibold text-white capitalize">
                    {selectedEvent.source?.replace(/_/g, ' ') || 'Internal'}
                  </span>
                </div>
              </div>

              {selectedEvent.employee_name && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-slate-500 block mb-0.5">Team Member</span>
                    <span className="font-semibold text-white">
                      {selectedEvent.employee_name}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                    <span className="text-slate-500 block mb-0.5">Department</span>
                    <span className="font-semibold text-white">
                      {selectedEvent.employee_department || selectedEvent.department || 'N/A'}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                <span className="text-slate-500 block mb-1">Schedule & Duration</span>
                <span className="font-mono text-blue-400 font-bold">
                  {selectedEvent.startDate}
                  {selectedEvent.endDate !== selectedEvent.startDate && ` to ${selectedEvent.endDate}`}
                  {selectedEvent.days && ` (${selectedEvent.days} days)`}
                </span>
              </div>

              {selectedEvent.description && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 block mb-1">Description:</span>
                  <p className="text-slate-200">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.reason && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
                  <span className="text-slate-500 block mb-1">Reason:</span>
                  <p className="text-slate-200">{selectedEvent.reason}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end">
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

