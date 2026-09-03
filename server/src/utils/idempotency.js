import crypto from 'crypto';

/**
 * Generates a deterministic idempotency key for recovery actions.
 * Compound: paymentId + actionType + attemptNumber
 */
export function generateActionIdempotencyKey(paymentId, actionType, attemptNumber) {
  const rawKey = `${paymentId}:${actionType}:${attemptNumber}`;
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Hashes an arbitrary payload for verification or deduplication.
 */
export function hashPayload(payload) {
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}
