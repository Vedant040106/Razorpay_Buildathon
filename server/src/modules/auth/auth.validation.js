import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' })
    .trim()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Enter a valid email address' })
    .max(255, { message: 'Email must not exceed 255 characters' }),
  password: z.string({ required_error: 'Password is required' })
    .min(1, { message: 'Password is required' })
    .max(128, { message: 'Password must not exceed 128 characters' })
});

export const registerSchema = z.object({
  email: z.string({ required_error: 'Email is required' })
    .trim()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Enter a valid email address' })
    .max(255, { message: 'Email must not exceed 255 characters' }),
  password: z.string({ required_error: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must not exceed 128 characters' }),
  name: z.string({ required_error: 'Name is required' })
    .trim()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must not exceed 100 characters' }),
  role: z.enum(['ADMIN', 'OPS_MANAGER', 'VIEWER']).default('OPS_MANAGER'),
  merchantId: z.string().optional()
});
