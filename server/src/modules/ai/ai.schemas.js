import { z } from 'zod';

export const AIRecommendationSchema = z.object({
  recoverabilityTier: z.enum(['HIGH', 'MEDIUM', 'LOW', 'NONE']),
  confidence: z.number().min(0.0).max(1.0),
  recommendedStrategy: z.enum([
    'RETRY_PAYMENT',
    'SEND_PAYMENT_REMINDER',
    'CREATE_RECOVERY_CASE',
    'ESCALATE_TO_MERCHANT',
    'MARK_UNRECOVERABLE',
    'REQUEST_HUMAN_APPROVAL'
  ]),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  reason: z.string().min(10).max(350),
  contextualSignals: z.array(z.string()).min(1).max(5),
  requiresHumanApproval: z.boolean().default(false)
});
