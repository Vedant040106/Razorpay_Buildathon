import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req, res, next) {
  const existingId = req.header('X-Request-Id');
  const requestId = existingId || `req_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
  
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
