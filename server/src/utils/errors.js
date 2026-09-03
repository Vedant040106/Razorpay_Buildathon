export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Invalid request parameters', code = 'BAD_REQUEST', details = null) {
    super(message, 400, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED', details = null) {
    super(message, 401, code, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', code = 'FORBIDDEN', details = null) {
    super(message, 403, code, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND', details = null) {
    super(message, 404, code, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict with existing state', code = 'CONFLICT', details = null) {
    super(message, 409, code, details);
  }
}

export class PolicyBlockedError extends AppError {
  constructor(message = 'Action blocked by recovery policy engine', code = 'POLICY_BLOCKED', details = null) {
    super(message, 422, code, details);
  }
}

export class GatewayError extends AppError {
  constructor(message = 'Upstream gateway error', code = 'GATEWAY_ERROR', details = null) {
    super(message, 502, code, details);
  }
}
