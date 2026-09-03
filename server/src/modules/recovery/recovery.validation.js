import { z } from 'zod';

export const listCasesQuerySchema = z.object({
  status: z.enum([
    'PENDING_ANALYSIS',
    'ANALYZED',
    'APPROVAL_REQUIRED',
    'IN_FLIGHT',
    'RECOVERED',
    'EXHAUSTED',
    'CLOSED_UNRECOVERABLE'
  ]).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  tier: z.enum(['HIGH', 'MEDIUM', 'LOW', 'NONE']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20)
});

export const caseIdParamSchema = z.object({
  id: z.string().trim().min(3, { message: 'Case ID must be at least 3 characters' }).max(50)
});
