import { z } from 'zod';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(val) {
  if (!DATE_REGEX.test(val)) return false;
  const d = new Date(val + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === val;
}

export const calendarQuerySchema = z
  .object({
    start_date: z
      .string()
      .optional()
      .refine((val) => !val || isValidDateString(val), {
        message: 'start_date must be a valid date in YYYY-MM-DD format',
      }),
    end_date: z
      .string()
      .optional()
      .refine((val) => !val || isValidDateString(val), {
        message: 'end_date must be a valid date in YYYY-MM-DD format',
      }),
    categories: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return ['holidays', 'leaves', 'company_events'];
        return val
          .split(',')
          .map((c) => c.trim().toLowerCase())
          .filter(Boolean);
      }),
    department: z.string().trim().optional(),
    employee_id: z.coerce.number().int().positive().optional(),
    country_code: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return data.end_date >= data.start_date;
      }
      return true;
    },
    {
      message: 'end_date cannot be earlier than start_date',
      path: ['end_date'],
    }
  );

export const calendarIcsExportSchema = z.object({
  year: z.coerce
    .number()
    .int()
    .min(2020)
    .max(2050)
    .optional()
    .default(() => new Date().getFullYear()),
  include_holidays: z
    .string()
    .optional()
    .transform((val) => val === 'true' || val === '1' || val === undefined),
});
