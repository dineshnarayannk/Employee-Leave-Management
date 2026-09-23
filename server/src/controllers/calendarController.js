import {
  calendarQuerySchema,
  calendarIcsExportSchema,
} from '../validators/calendarValidator.js';
import * as calendarService from '../services/calendarService.js';

/**
 * GET /api/calendar/events
 * Fetch unified stream of calendar events (Holidays, Company Events, Approved Leaves)
 */
export async function handleGetCalendarEvents(req, res, next) {
  try {
    const validation = calendarQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid calendar query parameters',
        errors: validation.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const { start_date, end_date, categories, department, employee_id, country_code } = validation.data;

    const data = await calendarService.getUnifiedCalendarEvents(req.user, {
      startDate: start_date,
      endDate: end_date,
      categories,
      department,
      employeeId: employee_id,
      country_code,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/calendar/holidays
 * Fetch public and company holidays for a specified date range
 */
export async function handleGetHolidays(req, res, next) {
  try {
    const validation = calendarQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid holiday query parameters',
        errors: validation.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const defaultRange = calendarService.getDefaultDateRange(req.query.year);
    const startDate = validation.data.start_date || defaultRange.startDate;
    const endDate = validation.data.end_date || defaultRange.endDate;

    const holidays = await calendarService.fetchGoogleHolidays(
      startDate,
      endDate,
      validation.data.country_code
    );

    return res.status(200).json({
      success: true,
      data: {
        holidays,
        total: holidays.length,
        dateRange: { startDate, endDate },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/calendar/export/ics
 * Download standard RFC 5545 iCalendar (.ics) file for external calendar synchronization
 */
export async function handleExportIcs(req, res, next) {
  try {
    const validation = calendarIcsExportSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid calendar export parameters',
        errors: validation.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const icsContent = await calendarService.generateIcsFeed(req.user, {
      year: validation.data.year,
      includeHolidays: validation.data.include_holidays,
    });

    const filename = `employee360-calendar-${validation.data.year}.ics`;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(icsContent);
  } catch (err) {
    next(err);
  }
}
