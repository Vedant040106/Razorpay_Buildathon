import { generateActionIdempotencyKey, hashPayload } from '../../src/utils/idempotency.js';

describe('Idempotency Key Utility (Unit Tests)', () => {
  test('generates consistent, deterministic SHA-256 hash for identical parameters', () => {
    const key1 = generateActionIdempotencyKey('pay_test123', 'RETRY_PAYMENT', 1);
    const key2 = generateActionIdempotencyKey('pay_test123', 'RETRY_PAYMENT', 1);

    expect(key1).toBe(key2);
    expect(key1).toHaveLength(64); // SHA-256 hex length
  });

  test('generates distinct keys when attempt number increments', () => {
    const key1 = generateActionIdempotencyKey('pay_test123', 'RETRY_PAYMENT', 1);
    const key2 = generateActionIdempotencyKey('pay_test123', 'RETRY_PAYMENT', 2);

    expect(key1).not.toBe(key2);
  });

  test('generates distinct keys for different action types on same payment', () => {
    const key1 = generateActionIdempotencyKey('pay_test123', 'RETRY_PAYMENT', 1);
    const key2 = generateActionIdempotencyKey('pay_test123', 'SEND_PAYMENT_REMINDER', 1);

    expect(key1).not.toBe(key2);
  });

  test('hashPayload produces consistent checksum for arbitrary object', () => {
    const payload = { event: 'payment.failed', id: 'pay_999', amount: 450000 };
    const hash1 = hashPayload(payload);
    const hash2 = hashPayload(payload);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });
});
