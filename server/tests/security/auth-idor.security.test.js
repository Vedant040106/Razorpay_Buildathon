import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { env } from '../../src/config/env.js';
import { User } from '../../src/modules/auth/user.model.js';
import { Merchant } from '../../src/modules/auth/merchant.model.js';
import { Payment } from '../../src/modules/payments/payment.model.js';
import { RecoveryCase } from '../../src/modules/recovery/recoveryCase.model.js';
import { RecoveryAction } from '../../src/modules/actions/recoveryAction.model.js';
import { Approval } from '../../src/modules/approvals/approval.model.js';
import { AuditEvent } from '../../src/modules/audit/auditEvent.model.js';
import { RecoverySimulationService } from '../../src/modules/recoveryLab/recoverySimulationService.js';

describe('Security Suite: Authentication, Authorization, IDOR, & Zero-Mutation', () => {
  let app;
  let merchantA, merchantB;
  let userA, userB, viewerA;
  let tokenA, tokenB, tokenViewerA;
  let paymentA, caseA, approvalA;

  beforeAll(async () => {
    await connectDatabase();
    app = createApp();

    // 1. Create two isolated merchants
    merchantA = await Merchant.create({
      merchantId: 'merch_corp_alpha',
      name: 'Corp Alpha Retail',
      email: 'ops@alpha.local',
      currency: 'INR',
      policyConfig: { autoActionMaxAmountPaise: 500000, maxRecoveryAttempts: 3, cooldownPeriodMinutes: 15 }
    });

    merchantB = await Merchant.create({
      merchantId: 'merch_corp_beta',
      name: 'Corp Beta Logistics',
      email: 'ops@beta.local',
      currency: 'INR',
      policyConfig: { autoActionMaxAmountPaise: 200000, maxRecoveryAttempts: 2, cooldownPeriodMinutes: 30 }
    });

    // 2. Create users with distinct roles
    userA = await User.create({
      email: 'admin@alpha.local',
      name: 'Alpha Admin',
      role: 'ADMIN',
      merchantId: merchantA._id,
      passwordHash: 'dummyhash'
    });

    userB = await User.create({
      email: 'admin@beta.local',
      name: 'Beta Admin',
      role: 'ADMIN',
      merchantId: merchantB._id,
      passwordHash: 'dummyhash'
    });

    viewerA = await User.create({
      email: 'viewer@alpha.local',
      name: 'Alpha Viewer',
      role: 'VIEWER',
      merchantId: merchantA._id,
      passwordHash: 'dummyhash'
    });

    // 3. Issue valid HS256 tokens
    tokenA = jwt.sign(
      { id: userA._id.toString(), email: userA.email, role: userA.role, merchantId: merchantA._id.toString() },
      env.JWT_SECRET,
      { expiresIn: '1h', algorithm: 'HS256' }
    );

    tokenViewerA = jwt.sign(
      { id: viewerA._id.toString(), email: viewerA.email, role: viewerA.role, merchantId: merchantA._id.toString() },
      env.JWT_SECRET,
      { expiresIn: '1h', algorithm: 'HS256' }
    );

    tokenB = jwt.sign(
      { id: userB._id.toString(), email: userB.email, role: userB.role, merchantId: merchantB._id.toString() },
      env.JWT_SECRET,
      { expiresIn: '1h', algorithm: 'HS256' }
    );

    // 4. Create Merchant A's financial assets
    paymentA = await Payment.create({
      paymentId: 'pay_sec_alpha_999',
      orderId: 'order_sec_alpha_999',
      merchantId: merchantA._id,
      amount: 450000,
      currency: 'INR',
      status: 'FAILED',
      failureCategory: 'TEMPORARY_NETWORK',
      customer: { name: 'Alpha Customer', email: 'cust@alpha.local' }
    });

    caseA = await RecoveryCase.create({
      caseId: 'REC-SEC-ALPHA-999',
      paymentId: paymentA._id,
      merchantId: merchantA._id,
      status: 'PENDING_ANALYSIS',
      recoverabilityTier: 'HIGH',
      recoverabilityScore: 0.88,
      attemptCount: 0,
      maxAttemptsAllowed: 3
    });

    const actionA = await RecoveryAction.create({
      caseId: caseA._id,
      paymentId: paymentA._id,
      actionType: 'RETRY_PAYMENT',
      attemptNumber: 1,
      idempotencyKey: 'sec_idem_alpha_key_001',
      policyDecision: 'REQUIRE_APPROVAL',
      policyReasonCode: 'HIGH_VALUE_THRESHOLD',
      status: 'PENDING_APPROVAL'
    });

    approvalA = await Approval.create({
      approvalId: 'APP-SEC-ALPHA-999',
      caseId: caseA._id,
      actionId: actionA._id,
      merchantId: merchantA._id,
      status: 'PENDING',
      requestedAction: 'RETRY_PAYMENT',
      aiRationale: 'Simulated high probability retry',
      policyReason: 'Amount requires operator approval',
      amountInPaise: 450000
    });
  }, 30000);

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('1. Authentication Gateways & JWT Invariants', () => {
    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      const endpoints = [
        ['get', '/api/payments'],
        ['get', '/api/recovery'],
        ['get', '/api/approvals'],
        ['get', '/api/audit']
      ];

      for (const [method, url] of endpoints) {
        const res = await request(app)[method](url);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      }
    });

    it('should reject malformed or tampered JWT with 401 INVALID_TOKEN', async () => {
      const res = await request(app)
        .get('/api/payments')
        .set('Authorization', 'Bearer invalid.tampered.token');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should reject expired JWT tokens with 401 TOKEN_EXPIRED', async () => {
      const expiredToken = jwt.sign(
        { id: userA._id.toString(), email: userA.email, role: userA.role, merchantId: merchantA._id.toString() },
        env.JWT_SECRET,
        { expiresIn: '-10s', algorithm: 'HS256' }
      );

      const res = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('2. Role-Based Access Control (RBAC)', () => {
    it('should forbid VIEWER role from executing recovery actions (403)', async () => {
      const res = await request(app)
        .post(`/api/recovery/${caseA.caseId}/analyze`)
        .set('Authorization', `Bearer ${tokenViewerA}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('not authorized');
    });

    it('should forbid VIEWER role from approving approval tickets (403)', async () => {
      const res = await request(app)
        .post(`/api/approvals/${approvalA._id}/approve`)
        .set('Authorization', `Bearer ${tokenViewerA}`)
        .send({ notes: 'Unauthorized attempt' });

      expect(res.status).toBe(403);
    });

    it('should forbid VIEWER role from resetting demo state (403)', async () => {
      const res = await request(app)
        .post('/api/demo/reset')
        .set('Authorization', `Bearer ${tokenViewerA}`);

      expect(res.status).toBe(403);
    });
  });

  describe('3. Merchant Isolation & IDOR (BOLA) Protection', () => {
    it('User B cannot view Payment belonging to Merchant A (404 Not Found)', async () => {
      const res = await request(app)
        .get(`/api/payments/${paymentA.paymentId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toContain('not found');
    });

    it('User B cannot view Recovery Case belonging to Merchant A (404 Not Found)', async () => {
      const res = await request(app)
        .get(`/api/recovery/${caseA.caseId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
    });

    it('User B cannot trigger analysis on Recovery Case belonging to Merchant A (404)', async () => {
      const res = await request(app)
        .post(`/api/recovery/${caseA.caseId}/analyze`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({});

      expect(res.status).toBe(404);
    });

    it('User B cannot approve Approval Ticket belonging to Merchant A (404)', async () => {
      const res = await request(app)
        .post(`/api/approvals/${approvalA._id}/approve`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ notes: 'Hostile takeover attempt' });

      expect(res.status).toBe(404);
    });

    it('User B cannot view audit timeline for Merchant A entity (404)', async () => {
      const res = await request(app)
        .get(`/api/audit/timeline/${paymentA.paymentId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
    });
  });

  describe('4. Recovery Lab Zero-Mutation Guarantee (State Snapshot Invariance)', () => {
    it('proves database state is strictly identical before and after simulation', async () => {
      // 1. Snapshot counts before simulation
      const [
        paymentCountBefore,
        caseCountBefore,
        actionCountBefore,
        approvalCountBefore,
        auditCountBefore
      ] = await Promise.all([
        Payment.countDocuments(),
        RecoveryCase.countDocuments(),
        RecoveryAction.countDocuments(),
        Approval.countDocuments(),
        AuditEvent.countDocuments()
      ]);

      // 2. Execute simulation through service
      const simResult = await RecoverySimulationService.simulatePolicy({
        merchantId: merchantA._id,
        retryDelayMinutes: 30,
        maxAttempts: 4,
        approvalThresholdPaise: 750000,
        strategy: 'AGGRESSIVE'
      });

      expect(simResult.isSimulation).toBe(true);
      expect(simResult.safetyStatement).toContain('No payments were modified');

      // 3. Snapshot counts after simulation
      const [
        paymentCountAfter,
        caseCountAfter,
        actionCountAfter,
        approvalCountAfter,
        auditCountAfter
      ] = await Promise.all([
        Payment.countDocuments(),
        RecoveryCase.countDocuments(),
        RecoveryAction.countDocuments(),
        Approval.countDocuments(),
        AuditEvent.countDocuments()
      ]);

      // 4. Verify ZERO mutation invariant
      expect(paymentCountAfter).toBe(paymentCountBefore);
      expect(caseCountAfter).toBe(caseCountBefore);
      expect(actionCountAfter).toBe(actionCountBefore);
      expect(approvalCountAfter).toBe(approvalCountBefore);
      expect(auditCountAfter).toBe(auditCountBefore);
    });
  });
});
