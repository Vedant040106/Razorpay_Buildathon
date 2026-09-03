import { z } from 'zod';

export const createPaymentSchema = z.object({
  paymentId: z.string().min(4),
  orderId: z.string().min(4),
  amount: z.number().int({ message: 'Amount must be an integer paise value' }).positive({ message: 'Amount must be positive' }),
  currency: z.string().default('INR'),
  customer: z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    email: z.string().email(),
    contact: z.string().optional()
  }),
  method: z.enum(['card', 'upi', 'netbanking', 'wallet', 'emi']).default('card'),
  cardDetails: z.object({
    network: z.string().optional(),
    last4: z.string().optional(),
    type: z.string().optional(),
    issuer: z.string().optional()
  }).optional(),
  upiDetails: z.object({
    vpa: z.string().optional()
  }).optional(),
  metadata: z.record(z.string()).optional()
});

export const recordFailureSchema = z.object({
  failureCode: z.string(),
  failureReason: z.string(),
  failureCategory: z.enum([
    'TEMPORARY_NETWORK',
    'INSUFFICIENT_FUNDS',
    'AUTHENTICATION_FAILED',
    'BANK_DOWNTIME',
    'EXPIRED_CARD',
    'CUSTOMER_ABANDONED',
    'FRAUD_SUSPECTED',
    'UNKNOWN'
  ]),
  rawGatewayResponse: z.record(z.any()).optional()
});

export const listPaymentsQuerySchema = z.object({
  status: z.enum(['FAILED', 'CAPTURED', 'CREATED', 'REFUNDED']).optional(),
  method: z.enum(['card', 'upi', 'netbanking', 'wallet', 'emi']).optional(),
  failureCategory: z.enum([
    'TEMPORARY_NETWORK',
    'INSUFFICIENT_FUNDS',
    'AUTHENTICATION_FAILED',
    'BANK_DOWNTIME',
    'EXPIRED_CARD',
    'CUSTOMER_ABANDONED',
    'FRAUD_SUSPECTED',
    'UNKNOWN'
  ]).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20)
});

