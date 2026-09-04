import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { standardLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './utils/errors.js';
import { sendSuccess } from './utils/response.js';

import authRoutes from './modules/auth/auth.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import recoveryRoutes from './modules/recovery/recovery.routes.js';
import approvalRoutes from './modules/approvals/approval.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import webhookRoutes from './modules/webhooks/webhook.routes.js';
import demoRoutes from './modules/demo/demo.routes.js';
import recoveryLabRoutes from './modules/recoveryLab/recoveryLab.routes.js';

export function createApp() {
  const app = express();

  // 1. Security Headers & CORS
  app.use(helmet({ contentSecurityPolicy: false }));
  const allowedOrigins = [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Razorpay-Signature']
  }));

  // 2. Request parsing with rawBody capture for webhook signature verification
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
    limit: '2mb'
  }));
  app.use(express.urlencoded({ extended: true }));

  // 3. Correlation ID & Logging
  app.use(requestIdMiddleware);
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(':method :url :status :res[content-length] - :response-time ms [req: :req[x-request-id]]'));
  }

  // 4. Rate Limiting
  app.use('/api', standardLimiter);

  // 5. System Health Check Endpoint
  app.get('/api/health', (req, res) => {
    return sendSuccess(res, {
      status: 'healthy',
      system: 'RecoverAI Revenue Recovery Engine',
      environment: env.NODE_ENV,
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // 6. Domain Module Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/recovery', recoveryRoutes);
  app.use('/api/approvals', approvalRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/webhooks', webhookRoutes);
  app.use('/api/demo', demoRoutes);
  app.use('/api/recovery-lab', recoveryLabRoutes);

  // 7. 404 Catch-all
  app.use('*', (req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
