import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';
import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  const requestId = req.id || 'req_unknown';

  logger.error(`Unhandled Error on ${req.method} ${req.originalUrl}: ${err.message}`, {
    requestId,
    name: err.name,
    code: err.code,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  });

  // Handle AppError hierarchy
  if (err instanceof AppError) {
    return sendError(res, err, err.statusCode, requestId);
  }

  // Handle Zod Validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return sendError(res, {
      code: 'VALIDATION_ERROR',
      message: 'Request payload validation failed',
      details: formattedErrors
    }, 400, requestId);
  }

  // Handle Mongo duplicate key error (11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    return sendError(res, {
      code: 'DUPLICATE_KEY_ERROR',
      message: `Duplicate value for field(s): ${fields.join(', ')}`,
      details: err.keyValue
    }, 409, requestId);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, {
      code: 'INVALID_TOKEN',
      message: 'Authentication token is malformed or invalid'
    }, 401, requestId);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, {
      code: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired. Please log in again.'
    }, 401, requestId);
  }

  // Generic 500 fallback - NEVER expose internal file paths or stack traces
  return sendError(res, {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An internal server error occurred'
  }, 500, requestId);
}
