export function sendSuccess(res, data = null, statusCode = 200, meta = {}) {
  const requestId = res.req?.id || meta.requestId || 'req_unknown';
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      ...meta
    }
  });
}

export function sendError(res, error, statusCode = 500, requestId = null) {
  const reqId = requestId || res.req?.id || 'req_unknown';
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'An unexpected error occurred';
  const details = error.details || null;

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
      requestId: reqId
    }
  });
}
