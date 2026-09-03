import { z } from 'zod';

export const approveActionSchema = z.object({
  notes: z.string().trim().max(500, { message: 'Notes must not exceed 500 characters' }).optional().default('')
});

export const rejectActionSchema = z.object({
  notes: z.string({ required_error: 'Please provide a reason for rejecting this recovery action' })
    .trim()
    .min(5, { message: 'Rejection reason must be at least 5 characters' })
    .max(500, { message: 'Rejection reason must not exceed 500 characters' })
});

export const approvalQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED']).optional().default('PENDING'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20)
});
