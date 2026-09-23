import { z } from 'zod';
import { isValidDateStr } from '../utils/dateUtils.js';

export const applyLeaveSchema = z
  .object({
    leave_type_id: z.coerce
      .number({ required_error: 'Leave type is required' })
      .int('Leave type ID must be an integer')
      .positive('Please select a valid leave type'),
    start_date: z
      .string({ required_error: 'Start date is required' })
      .refine(isValidDateStr, { message: 'Start date must be in YYYY-MM-DD format and a valid calendar date' }),
    end_date: z
      .string({ required_error: 'End date is required' })
      .refine(isValidDateStr, { message: 'End date must be in YYYY-MM-DD format and a valid calendar date' }),
    reason: z
      .string({ required_error: 'Reason for leave is required' })
      .trim()
      .min(3, 'Reason must be at least 3 characters')
      .max(1000, 'Reason cannot exceed 1000 characters'),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: 'End date cannot be earlier than start date',
    path: ['end_date'],
  });

export const approveLeaveSchema = z.object({
  response: z
    .string()
    .trim()
    .max(1000, 'Response cannot exceed 1000 characters')
    .optional()
    .default(''),
});

export const rejectLeaveSchema = z.object({
  response: z
    .string({ required_error: 'A rejection reason is required' })
    .trim()
    .min(3, 'Rejection reason must be at least 3 characters')
    .max(1000, 'Rejection reason cannot exceed 1000 characters'),
});

export const leaveFilterQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])
    .optional(),
  leave_type_id: z.coerce.number().int().positive().optional(),
  employee_id: z.coerce.number().int().positive().optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.union([z.coerce.number().int().min(1).max(12), z.string().trim()]).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(10),
});

export const notificationFilterQuerySchema = z.object({
  unread: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true' || val === '1') return true;
      if (val === 'false' || val === '0') return false;
      return undefined;
    }),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
