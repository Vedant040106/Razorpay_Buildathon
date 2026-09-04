import { z } from 'zod';

export const simulationRequestSchema = z.object({
  retryDelayMinutes: z.number({
    required_error: 'Retry delay in minutes is required.',
    invalid_type_error: 'Retry delay must be an integer number of minutes.'
  })
    .int('Retry delay must be an integer.')
    .min(5, 'Minimum retry delay is 5 minutes.')
    .max(180, 'Maximum retry delay is 180 minutes (3 hours).'),

  maxAttempts: z.number({
    required_error: 'Maximum attempt count is required.',
    invalid_type_error: 'Max attempts must be an integer.'
  })
    .int('Max attempts must be an integer.')
    .min(1, 'Minimum attempts allowed is 1.')
    .max(10, 'Maximum attempts allowed is 10.'),

  approvalThresholdPaise: z.number({
    required_error: 'Approval threshold amount in paise is required.',
    invalid_type_error: 'Approval threshold must be an integer amount in paise.'
  })
    .int('Approval threshold must be an integer paise amount.')
    .min(100, 'Minimum approval threshold is 100 paise (₹1.00).')
    .max(50000000, 'Maximum approval threshold is 50,000,000 paise (₹5,00,000.00).'),

  strategy: z.enum([
    'ALL_ELIGIBLE',
    'RETRY_PAYMENT',
    'SEND_PAYMENT_REMINDER',
    'ESCALATE_TO_MERCHANT',
    'REQUEST_HUMAN_APPROVAL'
  ], {
    errorMap: () => ({ message: 'Strategy must be one of ALL_ELIGIBLE, RETRY_PAYMENT, SEND_PAYMENT_REMINDER, ESCALATE_TO_MERCHANT, or REQUEST_HUMAN_APPROVAL.' })
  }).default('ALL_ELIGIBLE'),

  filters: z.object({
    category: z.string().optional(),
    method: z.string().optional()
  }).optional().default({})
});

export const createProposalSchema = z.object({
  proposedPolicy: z.object({
    retryDelayMinutes: z.number().int().min(5).max(180),
    maxAttempts: z.number().int().min(1).max(10),
    approvalThresholdPaise: z.number().int().min(100).max(50000000),
    strategy: z.string().optional(),
    minConfidenceAutoAction: z.number().min(0.0).max(1.0).optional()
  }),
  simulationSummary: z.object({
    projectedRecoveryRate: z.number(),
    projectedRecoveredAmountPaise: z.number(),
    projectedRecoveryCount: z.number(),
    expectedHumanReviews: z.number(),
    policyBlockedActions: z.number(),
    recoveryRateDelta: z.number(),
    recoveredAmountDeltaPaise: z.number(),
    humanReviewsDelta: z.number(),
    explainability: z.array(z.string()).optional()
  })
});

export const reviewProposalSchema = z.object({
  notes: z.string().max(500, 'Review notes cannot exceed 500 characters.').optional()
});
