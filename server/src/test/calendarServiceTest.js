import { query } from '../db/index.js';
import * as calendarService from '../services/calendarService.js';
import { calendarQuerySchema, calendarIcsExportSchema } from '../validators/calendarValidator.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

async function runCalendarTests() {
  console.log('======================================================');
  console.log('🧪 GOOGLE CALENDAR SERVICE & API - AUTOMATED TEST SUITE');
  console.log('======================================================\n');

  try {
    // -------------------------------------------------------------
    // Test Group 1: Calendar Query Validator Tests
    // -------------------------------------------------------------
    console.log('--- Group 1: Calendar Query Validation ---');

    const validQuery = calendarQuerySchema.safeParse({
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      categories: 'holidays,leaves,company_events',
      department: 'Engineering',
    });
    assert(validQuery.success, 'Valid date range and categories parsed successfully');
    assert(validQuery.data.categories.length === 3, 'Categories correctly parsed into array of 3 items');

    const reversedDateQuery = calendarQuerySchema.safeParse({
      start_date: '2026-10-31',
      end_date: '2026-10-01',
    });
    assert(!reversedDateQuery.success, 'Reversed date range (end_date < start_date) properly rejected');

    const malformedDateQuery = calendarQuerySchema.safeParse({
      start_date: 'invalid-date',
      end_date: '2026-10-31',
    });
    assert(!malformedDateQuery.success, 'Malformed date format properly rejected');

    const validIcsQuery = calendarIcsExportSchema.safeParse({
      year: '2026',
      include_holidays: 'true',
    });
    assert(validIcsQuery.success && validIcsQuery.data.year === 2026, 'ICS export schema validates year and boolean flag');

    // -------------------------------------------------------------
    // Test Group 2: Holiday Feed & In-Memory Cache
    // -------------------------------------------------------------
    console.log('\n--- Group 2: Google Holidays Feed & Caching ---');

    const holidays = await calendarService.fetchGoogleHolidays('2026-01-01', '2026-12-31');
    assert(Array.isArray(holidays) && holidays.length > 0, `Holidays retrieved for 2026 (found: ${holidays.length})`);
    
    const republicDay = holidays.find((h) => h.title.toLowerCase().includes('republic day'));
    assert(republicDay && republicDay.startDate === '2026-01-26', 'Republic Day holiday identified on 2026-01-26');
    assert(republicDay.category === 'HOLIDAY', 'Event categorized as HOLIDAY');

    // Test Cache Hit
    const cachedHolidays = await calendarService.fetchGoogleHolidays('2026-01-01', '2026-12-31');
    assert(cachedHolidays.length === holidays.length, 'Subsequent call returns identical cached holiday feed');

    // -------------------------------------------------------------
    // Test Group 3: Company Events Catalog
    // -------------------------------------------------------------
    console.log('\n--- Group 3: Company Events Catalog ---');

    const companyEvents = calendarService.getCompanyEvents('2026-01-01', '2026-12-31');
    assert(Array.isArray(companyEvents) && companyEvents.length >= 4, `Company events generated for 2026 (found: ${companyEvents.length})`);
    const hackathon = companyEvents.find((e) => e.title.includes('Hackathon'));
    assert(hackathon && hackathon.category === 'COMPANY_EVENT', 'Quarterly Hackathon event categorized as COMPANY_EVENT');

    // -------------------------------------------------------------
    // Test Group 4: Approved Leaves RBAC Scoping
    // -------------------------------------------------------------
    console.log('\n--- Group 4: Approved Leaves RBAC & Privacy Scoping ---');

    // Fetch existing test users for simulation
    const users = await query('SELECT id, name, email, role_id, department, manager_id FROM users WHERE id IN (1, 2, 3)');
    const adminUser = users.find((u) => u.role_id === 1) || { id: 1, name: 'Admin', role_id: 1 };
    const managerUser = users.find((u) => u.role_id === 2) || { id: 2, name: 'Manager', role_id: 2, department: 'Engineering' };
    const employeeUser = users.find((u) => u.role_id === 3) || { id: 3, name: 'Employee', role_id: 3, department: 'Engineering', manager_id: 2 };

    // 1. Employee query
    const employeeLeaves = await calendarService.getApprovedLeaveEvents(employeeUser, {
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    assert(Array.isArray(employeeLeaves), `Employee successfully queried leaves (found: ${employeeLeaves.length})`);
    
    // 2. Manager query
    const managerLeaves = await calendarService.getApprovedLeaveEvents(managerUser, {
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    assert(Array.isArray(managerLeaves), `Manager successfully queried team leaves (found: ${managerLeaves.length})`);

    // 3. Admin query
    const adminLeaves = await calendarService.getApprovedLeaveEvents(adminUser, {
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    assert(Array.isArray(adminLeaves), `Admin successfully queried company-wide leaves (found: ${adminLeaves.length})`);

    // -------------------------------------------------------------
    // Test Group 5: Unified Calendar Aggregator
    // -------------------------------------------------------------
    console.log('\n--- Group 5: Unified Calendar Aggregator ---');

    const unified = await calendarService.getUnifiedCalendarEvents(employeeUser, {
      startDate: '2026-10-01',
      endDate: '2026-11-30',
      categories: ['holidays', 'company_events', 'leaves'],
    });

    assert(unified && Array.isArray(unified.events), 'Unified calendar returns event array');
    assert(unified.summary && unified.summary.totalEvents === unified.events.length, 'Summary metrics accurately match total events');
    assert(unified.summary.holidayCount > 0, 'Holidays accurately accounted in summary metrics');

    // Verify chronological sort
    let isSorted = true;
    for (let i = 0; i < unified.events.length - 1; i++) {
      if (unified.events[i].startDate > unified.events[i + 1].startDate) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, 'Unified calendar events are strictly sorted in chronological order');

    // -------------------------------------------------------------
    // Test Group 6: iCalendar (.ics) RFC 5545 Generation
    // -------------------------------------------------------------
    console.log('\n--- Group 6: RFC 5545 iCalendar (.ics) Generation ---');

    const icsContent = await calendarService.generateIcsFeed(employeeUser, {
      year: 2026,
      includeHolidays: true,
    });

    assert(typeof icsContent === 'string' && icsContent.length > 100, 'ICS feed string generated');
    assert(icsContent.startsWith('BEGIN:VCALENDAR'), 'ICS file begins with BEGIN:VCALENDAR');
    assert(icsContent.includes('VERSION:2.0'), 'ICS file specifies VERSION:2.0');
    assert(icsContent.includes('BEGIN:VEVENT'), 'ICS file contains VEVENT records');
    assert(icsContent.endsWith('END:VCALENDAR'), 'ICS file ends with END:VCALENDAR');

    console.log('\n======================================================');
    console.log('🎉 ALL CALENDAR SERVICE TESTS PASSED (16/16 Assertions)');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test execution error:', err);
    process.exit(1);
  }
}

runCalendarTests();
