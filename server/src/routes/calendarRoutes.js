import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  handleGetCalendarEvents,
  handleGetHolidays,
  handleExportIcs,
} from '../controllers/calendarController.js';

const router = Router();

// Enforce authentication on all calendar operations
router.use(requireAuth);

// GET /api/calendar/events - Fetch unified calendar events stream
router.get('/events', handleGetCalendarEvents);

// GET /api/calendar/holidays - Fetch public/company holidays
router.get('/holidays', handleGetHolidays);

// GET /api/calendar/export/ics - Download iCalendar feed (.ics)
router.get('/export/ics', handleExportIcs);

export default router;
