import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
});

export const registerSchema = z.object({
  email: z.string().email({ message: 'A valid email address is required' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  role: z.enum(['ADMIN', 'OPS_MANAGER', 'VIEWER']).default('OPS_MANAGER'),
  merchantId: z.string().optional()
});
