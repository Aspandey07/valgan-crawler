import { z } from 'zod';

export const searchTendersQuerySchema = z.object({
  q: z.string().optional(),
  department: z.string().optional(),
  portal: z.string().optional(),
  closingDateFrom: z.string().datetime().optional(),
  closingDateTo: z.string().datetime().optional(),
  page: z.coerce.number().min(1).max(10000).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['closingDate', 'createdAt', 'tenderValue', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const getTenderParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createTenderSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  department: z.string().optional(),
  closingDate: z.string().optional(), // Can be ISO string
});
