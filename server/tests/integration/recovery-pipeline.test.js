import request from 'supertest';
import crypto from 'crypto';
import { createApp } from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { Merchant } from '../../src/modules/auth/merchant.model.js';
import { User } from '../../src/modules/auth/user.model.js';
import { Payment } from '../../src/modules/payments/payment.model.js';
import { RecoveryCase } from '../../src/modules/recovery/recoveryCase.model.js';
import { Approval } from '../../src/modules/approvals/approval.model.js';
import { AuditEvent } from '../../src/modules/audit/auditEvent.model.js';
import { env } from '../../src/config/env.js';

import bcrypt from 'bcryptjs';

describe('RecoverAI End-to-End Recovery Pipeline (Integration Tests)', () => {
  let app;
  let authToken;
  let testMerchant;

  beforeAll(async () => {
    await connectDatabase();
    app = createApp();

    // Create test merchant and admin
    testMerchant = await Merchant.create({
      merchantId: 'merch_test_e2e',
      name: 'Test E2E Merchant',
      email: 'merchant@test.local',
      currency: 'INR',
      policyConfig: {
        autoActionMaxAmountPaise: 500000, // ₹5,000 limit
        maxRecoveryAttempts: 3,
        cooldownPeriodMinutes: 15,
        minConfidenceAutoAction: 0.75
      }
    });

    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await User.create({
      email: 'admin_test@test.local',
      passwordHash,
      name: 'E2E Admin',
      role: 'ADMIN',
      merchantId: testMerchant._id
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin_test@test.local', password: 'password123' });

    authToken = loginRes.body.data.token;
  }, 30000);

  afterAll(async () => {
    await disconnectDatabase();
  }, 30000);

  test('1. Ingest failed payment and automatically generate recovery case', async () => {
    const paymentRes = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        paymentId: 'pay_e2e_001',
        orderId: 'order_e2e_001',
        amount: 450000, // ₹4,500
        currency: 'INR',
        customer: {
          name: 'Pooja Hegde',
          email: 'pooja@example.com',
          contact: '+919988776655'
        },
        method: 'card',
        cardDetails: { network: 'Visa', last4: '1111', issuer: 'HDFC Bank' }
      });

    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body.success).toBe(true);

    // Fail payment
    const failRes = await request(app)
      .post(`/api/payments/pay_e2e_001/fail`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        failureCode: 'GATEWAY_ERROR',
        failureReason: 'Gateway timeout during processing',
        failureCategory: 'TEMPORARY_NETWORK'
      });

    expect(failRes.status).toBe(200);
    expect(failRes.body.data.payment.status).toBe('FAILED');
    expect(failRes.body.data.attempt.attemptNumber).toBe(1);
  });

  test('2. Execute AI analysis and Policy Gate for Auto-Allowed recovery', async () => {
    const payment = await Payment.findOne({ paymentId: 'pay_e2e_001' });
    const recCase = await RecoveryCase.create({
      caseId: 'REC-2026-E2E01',
      paymentId: payment._id,
      merchantId: testMerchant._id,
      status: 'PENDING_ANALYSIS'
    });

    const analyzeRes = await request(app)
      .post(`/api/recovery/${recCase.caseId}/analyze`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(analyzeRes.status).toBe(200);
    expect(analyzeRes.body.data.recommendation.recommendedStrategy).toBe('RETRY_PAYMENT');
    expect(analyzeRes.body.data.policyVerdict.decision).toBe('ALLOW');
    expect(analyzeRes.body.data.actionResult.status).toBe('COMPLETED');

    // Verify audit trail was persisted
    const auditRes = await request(app)
      .get(`/api/audit/timeline/${recCase.caseId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.data.timeline.length).toBeGreaterThan(0);
  });

  test('3. High-Value payment (> ₹5,000) forces human approval workflow', async () => {
    const payment = await Payment.create({
      paymentId: 'pay_e2e_highval',
      orderId: 'order_e2e_highval',
      merchantId: testMerchant._id,
      amount: 1500000, // ₹15,000
      currency: 'INR',
      status: 'FAILED',
      customer: { name: 'Vikram Mehta', email: 'vikram@example.com' },
      failureCategory: 'AUTHENTICATION_FAILED'
    });

    const recCase = await RecoveryCase.create({
      caseId: 'REC-2026-E2E02',
      paymentId: payment._id,
      merchantId: testMerchant._id,
      status: 'PENDING_ANALYSIS'
    });

    const analyzeRes = await request(app)
      .post(`/api/recovery/${recCase.caseId}/analyze`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({});

    expect(analyzeRes.status).toBe(200);
    expect(analyzeRes.body.data.policyVerdict.decision).toBe('REQUIRE_APPROVAL');
    expect(analyzeRes.body.data.policyVerdict.reasonCode).toBe('HIGH_VALUE_TRANSACTION');
    expect(analyzeRes.body.data.actionResult.status).toBe('PENDING_APPROVAL');

    // Verify enqueued in Approvals
    const approvalsRes = await request(app)
      .get('/api/approvals')
      .set('Authorization', `Bearer ${authToken}`);

    expect(approvalsRes.status).toBe(200);
    const pendingApproval = approvalsRes.body.data.approvals.find(a => a.caseId?.caseId === recCase.caseId);
    expect(pendingApproval).toBeDefined();

    // Human Approve
    const approveRes = await request(app)
      .post(`/api/approvals/${pendingApproval._id}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ notes: 'Merchant ops approved high value transaction after customer verification.' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.approval.status).toBe('APPROVED');
  });

  test('4. Webhook signature verification and duplicate replay drop', async () => {
    const webhookPayload = JSON.stringify({
      id: 'evt_test_webhook_replay_123',
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'pay_wh_test_999',
            amount: 250000,
            currency: 'INR',
            error_code: 'GATEWAY_ERROR'
          }
        }
      }
    });

    const signature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookPayload)
      .digest('hex');

    // First delivery
    const whRes1 = await request(app)
      .post('/api/webhooks/razorpay')
      .set('X-Razorpay-Signature', signature)
      .set('Content-Type', 'application/json')
      .send(webhookPayload);

    expect(whRes1.status).toBe(200);
    expect(whRes1.body.data.status).toBe('PROCESSED');

    // Second delivery (Replay attack / duplicate delivery)
    const whRes2 = await request(app)
      .post('/api/webhooks/razorpay')
      .set('X-Razorpay-Signature', signature)
      .set('Content-Type', 'application/json')
      .send(webhookPayload);

    expect(whRes2.status).toBe(200);
    expect(whRes2.body.data.status).toBe('DUPLICATE_DROPPED');
  });
});
