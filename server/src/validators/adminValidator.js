import { z } from 'zod';

export const createUserSchema = z.object({
  name: z
    .string({ required_error: 'Full Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(150, 'Name cannot exceed 150 characters'),
  email: z
    .string({ required_error: 'Email address is required' })
    .trim()
    .email('Please enter a valid email address')
    .max(255, 'Email cannot exceed 255 characters')
    .transform((val) => val.toLowerCase()),
  department: z
    .string({ required_error: 'Department is required' })
    .trim()
    .min(2, 'Department must be at least 2 characters')
    .max(100, 'Department cannot exceed 100 characters'),
  role_id: z
    .coerce
    .number({ required_error: 'Role is required' })
    .refine((val) => [2, 3].includes(val), {
      message: 'Admin can only create Manager (role_id: 2) or Employee (role_id: 3)',
    }),
  manager_id: z
    .coerce
    .number()
    .nullable()
    .optional()
    .transform((val) => (val === 0 || val === undefined || isNaN(val) ? null : val)),
  is_active: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(150, 'Name cannot exceed 150 characters')
    .optional(),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(255, 'Email cannot exceed 255 characters')
    .transform((val) => val.toLowerCase())
    .optional(),
  department: z
    .string()
    .trim()
    .min(2, 'Department must be at least 2 characters')
    .max(100, 'Department cannot exceed 100 characters')
    .optional(),
  role_id: z
    .coerce
    .number()
    .refine((val) => [1, 2, 3].includes(val), {
      message: 'Role ID must be 1 (Admin), 2 (Manager), or 3 (Employee)',
    })
    .optional(),
  manager_id: z
    .coerce
    .number()
    .nullable()
    .optional()
    .transform((val) => (val === 0 || val === undefined || isNaN(val) ? null : val)),
  is_active: z.boolean().optional(),
});

export const updateStatusSchema = z.object({
  is_active: z.boolean({ required_error: 'is_active boolean flag is required' }),
});

export const userFilterQuerySchema = z.object({
  search: z.string().trim().optional(),
  role_id: z.coerce.number().optional(),
  is_active: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true' || val === '1') return true;
      if (val === 'false' || val === '0') return false;
      return undefined;
    }),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const createLeaveTypeSchema = z.object({
  name: z
    .string({ required_error: 'Leave type name is required' })
    .trim()
    .min(2, 'Leave type name must be at least 2 characters')
    .max(100, 'Leave type name cannot exceed 100 characters'),
  description: z.string().trim().max(255, 'Description cannot exceed 255 characters').optional().default(''),
  default_days: z.coerce
    .number({ required_error: 'Default allocated days is required' })
    .int('Default days must be an integer')
    .min(0, 'Default days cannot be negative')
    .max(365, 'Default days cannot exceed 365'),
  is_active: z.boolean().optional().default(true),
});

export const updateLeaveTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Leave type name must be at least 2 characters')
    .max(100, 'Leave type name cannot exceed 100 characters')
    .optional(),
  description: z.string().trim().max(255, 'Description cannot exceed 255 characters').optional(),
  default_days: z.coerce
    .number()
    .int('Default days must be an integer')
    .min(0, 'Default days cannot be negative')
    .max(365, 'Default days cannot exceed 365')
    .optional(),
  is_active: z.boolean().optional(),
});

export const analyticsQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional().default(new Date().getFullYear()),
});

export const reportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  leave_type_id: z.coerce.number().int().positive().optional(),
  department: z.string().trim().optional(),
  employee_id: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});

