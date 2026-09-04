import rateLimit from 'express-rate-limit';

export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.'
    }
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // stricter limit for login/auth
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again after 15 minutes.'
    }
  }
});

export const aiSimulationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // Limit heavy AI and simulation calculations
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'SIMULATION_RATE_LIMIT_EXCEEDED',
      message: 'Too many simulation or analysis requests. Please try again after 15 minutes.'
    }
  }
});

export const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // Generous capacity to never drop legitimate Razorpay webhook deliveries
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'WEBHOOK_RATE_LIMIT_EXCEEDED',
      message: 'Webhook burst threshold exceeded.'
    }
  }
});
