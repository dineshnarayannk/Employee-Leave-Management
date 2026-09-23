import { query } from '../db/index.js';
import { config } from '../config/env.js';
import { formatISODate } from '../utils/dateUtils.js';

// In-memory cache for external holiday feeds (TTL: 24 hours)
const holidayCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Curated standard public holidays fallback (guarantees offline/resilient behavior)
const STANDARD_HOLIDAYS_FALLBACK = [
  { name: "New Year's Day", month: 1, day: 1, type: 'public' },
  { name: 'Republic Day', month: 1, day: 26, type: 'national' },
  { name: 'May Day / Labor Day', month: 5, day: 1, type: 'public' },
  { name: 'Independence Day', month: 8, day: 15, type: 'national' },
  { name: 'Gandhi Jayanti', month: 10, day: 2, type: 'national' },
  { name: 'Dussehra / Vijayadashami', month: 10, day: 20, type: 'festival' },
  { name: 'Diwali / Deepavali', month: 11, day: 8, type: 'festival' },
  { name: 'Christmas Day', month: 12, day: 25, type: 'public' },
];

const COMPANY_EVENTS_CATALOG = [
  { title: 'Annual Company Kickoff', month: 1, day: 15, durationDays: 1, color: '#6366f1' },
  { title: 'Quarterly Engineering Hackathon', month: 4, day: 10, durationDays: 2, color: '#8b5cf6' },
  { title: 'Mid-Year Organization Review', month: 7, day: 1, durationDays: 1, color: '#3b82f6' },
  { title: 'Annual Employee Appreciation Day', month: 10, day: 16, durationDays: 1, color: '#ec4899' },
  { title: 'Year-End Innovation Showcase', month: 12, day: 18, durationDays: 1, color: '#10b981' },
];

/**
 * Get start and end dates of a specific year or month
 */
export function getDefaultDateRange(yearParam) {
  const now = new Date();
  const year = yearParam ? Number(yearParam) : now.getFullYear();
  const month = now.getMonth();

  if (yearParam) {
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    };
  }

  // Current month default
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    startDate: formatISODate(start),
    endDate: formatISODate(end),
  };
}

/**
 * Fetch Holidays from Google Calendar API with in-memory caching and fallback
 */
export async function fetchGoogleHolidays(startDate, endDate, country = config.calendar.countryCode) {
  const cacheKey = `${country}_${startDate}_${endDate}`;
  const cached = holidayCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const calendarId = `${country}#holiday@group.v.calendar.google.com`;
  const apiKey = config.calendar.apiKey;

  let holidays = [];

  if (apiKey) {
    try {
      const timeMin = new Date(startDate + 'T00:00:00Z').toISOString();
      const timeMax = new Date(endDate + 'T23:59:59Z').toISOString();

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
        calendarId
      )}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (Array.isArray(json.items)) {
          holidays = json.items.map((item) => {
            const dateStr = item.start?.date || item.start?.dateTime?.slice(0, 10) || startDate;
            return {
              id: `holiday-google-${item.id || dateStr}`,
              title: item.summary || 'Public Holiday',
              description: item.description || 'Public / National Holiday',
              category: 'HOLIDAY',
              startDate: formatISODate(dateStr),
              endDate: formatISODate(item.end?.date || dateStr),
              isAllDay: true,
              color: '#f59e0b', // Amber
              source: 'google_calendar_api',
            };
          });
        }
      }
    } catch (err) {
      console.warn('Google Calendar API fetch error, using fallback catalog:', err.message);
    }
  }

  // If no API key or empty results, synthesize fallback holidays for the requested date range
  if (holidays.length === 0) {
    const startYear = parseInt(startDate.slice(0, 4), 10);
    const endYear = parseInt(endDate.slice(0, 4), 10);

    for (let yr = startYear; yr <= endYear; yr++) {
      STANDARD_HOLIDAYS_FALLBACK.forEach((h) => {
        const dStr = `${yr}-${String(h.month).padStart(2, '0')}-${String(h.day).padStart(2, '0')}`;
        if (dStr >= startDate && dStr <= endDate) {
          holidays.push({
            id: `holiday-fallback-${dStr}`,
            title: h.name,
            description: `${h.type.toUpperCase()} Holiday`,
            category: 'HOLIDAY',
            startDate: dStr,
            endDate: dStr,
            isAllDay: true,
            color: '#f59e0b',
            source: 'standard_holiday_catalog',
          });
        }
      });
    }
  }

  // Cache results
  holidayCache.set(cacheKey, { timestamp: Date.now(), data: holidays });
  return holidays;
}

/**
 * Fetch Company Events for a date range
 */
export function getCompanyEvents(startDate, endDate) {
  const events = [];
  const startYear = parseInt(startDate.slice(0, 4), 10);
  const endYear = parseInt(endDate.slice(0, 4), 10);

  for (let yr = startYear; yr <= endYear; yr++) {
    COMPANY_EVENTS_CATALOG.forEach((ev, idx) => {
      const startD = new Date(yr, ev.month - 1, ev.day);
      const endD = new Date(yr, ev.month - 1, ev.day + (ev.durationDays - 1));
      const sStr = formatISODate(startD);
      const eStr = formatISODate(endD);

      if (eStr >= startDate && sStr <= endDate) {
        events.push({
          id: `company-event-${yr}-${idx}`,
          title: ev.title,
          category: 'COMPANY_EVENT',
          startDate: sStr,
          endDate: eStr,
          isAllDay: true,
          color: ev.color || '#6366f1',
          source: 'company_schedule',
        });
      }
    });
  }

  return events;
}

/**
 * Fetch Approved Leave Events from TiDB with RBAC scoping
 */
export async function getApprovedLeaveEvents(user, { startDate, endDate, department, employeeId }) {
  const params = [startDate, endDate];
  let whereClauses = [
    `lr.status = 'APPROVED'`,
    `lr.start_date <= ?`,
    `lr.end_date >= ?`,
  ];

  // RBAC Scoping
  if (user.role_id === 1) {
    // Admin: Can view all approved leaves, with optional filters
    if (department) {
      whereClauses.push(`u.department = ?`);
      params.push(department);
    }
    if (employeeId) {
      whereClauses.push(`lr.employee_id = ?`);
      params.push(employeeId);
    }
  } else if (user.role_id === 2) {
    // Manager: View direct reports + own leaves
    if (employeeId) {
      whereClauses.push(`(u.manager_id = ? OR lr.employee_id = ?) AND lr.employee_id = ?`);
      params.push(user.id, user.id, employeeId);
    } else {
      whereClauses.push(`(u.manager_id = ? OR lr.employee_id = ?)`);
      params.push(user.id, user.id);
    }
  } else {
    // Employee: View own leaves + department team members (for cross-team visibility)
    if (employeeId && Number(employeeId) === Number(user.id)) {
      whereClauses.push(`lr.employee_id = ?`);
      params.push(user.id);
    } else if (user.department) {
      whereClauses.push(`(lr.employee_id = ? OR u.department = ?)`);
      params.push(user.id, user.department);
    } else {
      whereClauses.push(`lr.employee_id = ?`);
      params.push(user.id);
    }
  }

  const sql = `
    SELECT 
      lr.id,
      lr.employee_id,
      u.name AS employee_name,
      u.email AS employee_email,
      u.department AS employee_department,
      lt.name AS leave_type_name,
      lr.start_date,
      lr.end_date,
      DATEDIFF(lr.end_date, lr.start_date) + 1 AS days,
      lr.reason,
      lr.status
    FROM leave_requests lr
    JOIN users u ON lr.employee_id = u.id
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY lr.start_date ASC
  `;

  const rows = await query(sql, [endDate, startDate, ...params.slice(2)]);

  return rows.map((r) => {
    const isSelf = Number(r.employee_id) === Number(user.id);
    return {
      id: `leave-${r.id}`,
      title: `${r.employee_name} - ${r.leave_type_name}`,
      category: 'APPROVED_LEAVE',
      startDate: formatISODate(r.start_date),
      endDate: formatISODate(r.end_date),
      days: Number(r.days),
      leaveType: r.leave_type_name,
      employee: {
        id: r.employee_id,
        name: r.employee_name,
        email: r.employee_email,
        department: r.employee_department,
        isSelf,
      },
      reason: isSelf || user.role_id <= 2 ? r.reason : undefined, // Privacy protection for general peers
      color: isSelf ? '#10b981' : '#06b6d4', // Emerald for own leaves, Cyan for team members
      isAllDay: true,
      source: 'leave_management_db',
    };
  });
}

/**
 * Main Aggregator: Fetches unified calendar stream
 */
export async function getUnifiedCalendarEvents(user, queryParams = {}) {
  let { startDate, endDate } = queryParams;

  if (!startDate || !endDate) {
    const defaultRange = getDefaultDateRange();
    startDate = startDate || defaultRange.startDate;
    endDate = endDate || defaultRange.endDate;
  }

  const categories = queryParams.categories || ['holidays', 'leaves', 'company_events'];
  const allEvents = [];

  // 1. Holidays
  if (categories.includes('holidays')) {
    const holidays = await fetchGoogleHolidays(startDate, endDate, queryParams.country_code);
    allEvents.push(...holidays);
  }

  // 2. Company Events
  if (categories.includes('company_events')) {
    const companyEvents = getCompanyEvents(startDate, endDate);
    allEvents.push(...companyEvents);
  }

  // 3. Approved Leaves
  if (categories.includes('leaves')) {
    const leaves = await getApprovedLeaveEvents(user, {
      startDate,
      endDate,
      department: queryParams.department,
      employeeId: queryParams.employee_id,
    });
    allEvents.push(...leaves);
  }

  // Sort chronologically
  allEvents.sort((a, b) => a.startDate.localeCompare(b.startDate));

  return {
    events: allEvents,
    summary: {
      totalEvents: allEvents.length,
      holidayCount: allEvents.filter((e) => e.category === 'HOLIDAY').length,
      companyEventCount: allEvents.filter((e) => e.category === 'COMPANY_EVENT').length,
      leaveCount: allEvents.filter((e) => e.category === 'APPROVED_LEAVE').length,
      dateRange: { startDate, endDate },
    },
  };
}

/**
 * Generate standard RFC 5545 iCalendar (.ics) string for external calendar subscriptions
 */
export async function generateIcsFeed(user, { year, includeHolidays = true } = {}) {
  const currentYear = year || new Date().getFullYear();
  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear}-12-31`;

  const { events } = await getUnifiedCalendarEvents(user, {
    startDate,
    endDate,
    categories: includeHolidays ? ['holidays', 'leaves', 'company_events'] : ['leaves', 'company_events'],
  });

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Employee360//Leave Management System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Employee360 - ${user.name}`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const ev of events) {
    const dtStart = ev.startDate.replace(/-/g, '');
    // In iCalendar, DTEND for full-day events is non-inclusive (the day after)
    const endObj = new Date(ev.endDate + 'T00:00:00Z');
    endObj.setDate(endObj.getDate() + 1);
    const dtEnd = endObj.toISOString().slice(0, 10).replace(/-/g, '');

    icsLines.push(
      'BEGIN:VEVENT',
      `UID:${ev.id}@employee360.internal`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`,
      `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${ev.title.replace(/[,;]/g, ' ')}`,
      `DESCRIPTION:${(ev.description || ev.reason || ev.category).replace(/[,;\n]/g, ' ')}`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      'END:VEVENT'
    );
  }

  icsLines.push('END:VCALENDAR');
  return icsLines.join('\r\n');
}
