import crypto from 'crypto';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { WebhookService } from '../../src/modules/webhooks/webhook.service.js';
import { AuditService } from '../../src/modules/audit/audit.service.js';
import { AuditEvent } from '../../src/modules/audit/auditEvent.model.js';
import { Merchant } from '../../src/modules/auth/merchant.model.js';
import { env } from '../../src/config/env.js';

describe('Security Suite: Webhook Authenticity & Audit Ledger Integrity', () => {
  let app;
  const testSecret = 'rzp_test_secure_webhook_secret_key_12345';

  beforeAll(async () => {
    await connectDatabase();
    app = createApp();

    await Merchant.create({
      merchantId: 'merch_webhook_test',
      name: 'Webhook Test Merchant',
      email: 'webhook@test.local',
      currency: 'INR'
    });
  }, 30000);

  afterAll(async () => {
    await new Promise((r) => setTimeout(r, 400));
    await disconnectDatabase();
  });

  describe('1. Razorpay Webhook Cryptographic HMAC-SHA256 Verification', () => {
    const rawPayload = JSON.stringify({
      id: 'evt_test_sec_001',
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_webhook_001',
            amount: 50000,
            currency: 'INR',
            status: 'failed',
            error_code: 'BAD_REQUEST_ERROR',
            error_description: 'Test failure reason'
          }
        }
      }
    });

    it('should reject webhook with missing signature (401)', () => {
      expect(() => {
        WebhookService.verifySignature(rawPayload, null, testSecret);
      }).toThrow('Missing X-Razorpay-Signature');
    });

    it('should reject webhook with arbitrary invalid signature without crashing timingSafeEqual', () => {
      expect(() => {
        WebhookService.verifySignature(rawPayload, 'short_signature', testSecret);
      }).toThrow('Invalid cryptographic webhook signature.');

      expect(() => {
        WebhookService.verifySignature(rawPayload, 'a'.repeat(64), testSecret);
      }).toThrow('Invalid cryptographic webhook signature.');
    });

    it('should accept webhook with valid HMAC-SHA256 signature', () => {
      const validSignature = crypto
        .createHmac('sha256', testSecret)
        .update(rawPayload)
        .digest('hex');

      const result = WebhookService.verifySignature(rawPayload, validSignature, testSecret);
      expect(result).toBe(true);
    });
  });

  describe('2. Webhook Replay Protection & Idempotency', () => {
    it('should drop duplicate webhook events and return DUPLICATE_DROPPED', async () => {
      const eventId = `evt_replay_test_${Date.now()}`;
      const payload = {
        id: eventId,
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: `pay_replay_${Date.now()}`,
              amount: 10000,
              currency: 'INR',
              error_code: 'GATEWAY_ERROR'
            }
          }
        }
      };

      // 1. First delivery
      const firstResult = await WebhookService.processEvent(payload, 'req_first_001');
      expect(firstResult.status).toBe('PROCESSED');

      // 2. Replayed second delivery with identical eventId
      const secondResult = await WebhookService.processEvent(payload, 'req_second_002');
      expect(secondResult.status).toBe('DUPLICATE_DROPPED');
      expect(secondResult.eventId).toBe(eventId);
    });
  });

  describe('3. Tamper-Evident Audit Ledger & Cryptographic Verification', () => {
    beforeAll(async () => {
      // Allow background webhook pipeline tasks to settle
      await new Promise((r) => setTimeout(r, 600));
      await AuditService.writeQueue.catch(() => {});
    });

    it('should maintain a valid hash chain across sequential audit events', async () => {
      // Log sequential audit events
      await AuditService.logEvent({
        eventType: 'PAYMENT_RECEIVED',
        entityType: 'PAYMENT',
        entityId: 'pay_audit_test_001',
        payload: { amount: 10000 }
      });

      await AuditService.logEvent({
        eventType: 'PAYMENT_FAILED',
        entityType: 'PAYMENT',
        entityId: 'pay_audit_test_001',
        payload: { failureCode: 'GATEWAY_TIMEOUT' }
      });

      const verification = await AuditService.verifyLedgerIntegrity();
      expect(verification.isValid).toBe(true);
      expect(verification.eventCount).toBeGreaterThan(0);
    });

    it('should detect tampering if an attacker modifies recorded audit data', async () => {
      // Find an existing audit event and tamper with its payload directly in DB
      const targetEvent = await AuditEvent.findOne({ entityId: 'pay_audit_test_001' });
      expect(targetEvent).toBeDefined();

      const originalPayload = targetEvent.payload;

      // Tamper: alter payload directly without recalculating cryptographic hash
      await AuditEvent.updateOne(
        { _id: targetEvent._id },
        { $set: { 'payload.amount': 99999999 } }
      );

      // Verify ledger integrity
      const verification = await AuditService.verifyLedgerIntegrity();
      expect(verification.isValid).toBe(false);
      expect(verification.reason).toContain('Data tampering detected');

      // Revert tamper to leave clean state
      await AuditEvent.updateOne(
        { _id: targetEvent._id },
        { $set: { payload: originalPayload } }
      );
    });
  });
});
