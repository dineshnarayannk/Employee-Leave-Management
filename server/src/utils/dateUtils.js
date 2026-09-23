/**
 * Date calculation and parsing utilities for Leave Management
 * Ensures consistent inclusive day calculation without timezone date shifts.
 */

/**
 * Validates whether a string matches YYYY-MM-DD format and represents a real calendar date
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidDateStr(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Parses YYYY-MM-DD string into a UTC Date at 00:00:00
 * @param {string|Date} val
 * @returns {Date}
 */
export function parseISODate(val) {
  if (val instanceof Date) {
    return new Date(Date.UTC(val.getUTCFullYear(), val.getUTCMonth(), val.getUTCDate()));
  }
  if (typeof val === 'string' && val.includes('T')) {
    val = val.split('T')[0];
  }
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [year, month, day] = val.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
  throw new Error(`Invalid date value for parsing: ${val}`);
}

/**
 * Formats a Date object or string into standard 'YYYY-MM-DD'
 * @param {Date|string} val
 * @returns {string}
 */
export function formatISODate(val) {
  if (!val) return '';
  if (typeof val === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    if (val.includes('T')) return val.split('T')[0];
  }
  const d = new Date(val);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the number of calendar days between startDate and endDate, INCLUSIVE.
 * Example:
 *   start: '2026-10-05', end: '2026-10-07' -> 3 days
 *   start: '2026-10-05', end: '2026-10-05' -> 1 day
 * 
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {number}
 */
export function calculateInclusiveDays(startDate, endDate) {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);

  if (end < start) {
    throw new Error('End date cannot be earlier than start date.');
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffTime = end.getTime() - start.getTime();
  const days = Math.round(diffTime / msPerDay) + 1;

  return days;
}

/**
 * Extracts the 4-digit calendar year from a date string or Date object
 * @param {string|Date} dateVal
 * @returns {number}
 */
export function getYearFromDate(dateVal) {
  const d = parseISODate(dateVal);
  return d.getUTCFullYear();
}
