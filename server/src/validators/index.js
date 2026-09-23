import { z } from 'zod';

/**
 * Placeholder validation schemas for leave requests and user management
 * Will be fully implemented in upcoming phases.
 */
export const basePaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
