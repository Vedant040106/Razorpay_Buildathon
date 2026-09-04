import { RecoverySimulationService, SIMULATION_SAFETY_STATEMENT } from '../../src/modules/recoveryLab/recoverySimulationService.js';
import { simulationRequestSchema } from '../../src/modules/recoveryLab/recoveryLab.validation.js';
import { Payment } from '../../src/modules/payments/payment.model.js';
import { RecoveryAction } from '../../src/modules/actions/recoveryAction.model.js';
import { RecoveryCase } from '../../src/modules/recovery/recoveryCase.model.js';
import { Merchant } from '../../src/modules/auth/merchant.model.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';

describe('Recovery Lab Simulation Engine (Unit Tests)', () => {
  let testMerchant;

  beforeAll(async () => {
    await connectDatabase();

    testMerchant = await Merchant.create({
      merchantId: 'merch_lab_test',
      name: 'Lab Test Merchant',
      email: 'lab@test.local',
      currency: 'INR',
      policyConfig: {
        autoActionMaxAmountPaise: 500000, // ₹5,000
        maxRecoveryAttempts: 3,
        cooldownPeriodMinutes: 15,
        minConfidenceAutoAction: 0.75
      }
    });

    // Seed test failed payments
    const pay1 = await Payment.create({
      paymentId: 'pay_lab_001',
      orderId: 'order_lab_001',
      merchantId: testMerchant._id,
      amount: 450000, // ₹4,500
      status: 'FAILED',
      failureCategory: 'TEMPORARY_NETWORK',
      customer: { name: 'Customer 1', email: 'c1@test.local' }
    });

    const pay2 = await Payment.create({
      paymentId: 'pay_lab_002',
      orderId: 'order_lab_002',
      merchantId: testMerchant._id,
      amount: 1200000, // ₹12,000 (> ₹5,000 threshold)
      status: 'FAILED',
      failureCategory: 'AUTHENTICATION_FAILED',
      customer: { name: 'Customer 2', email: 'c2@test.local' }
    });

    const pay3 = await Payment.create({
      paymentId: 'pay_lab_003',
      orderId: 'order_lab_003',
      merchantId: testMerchant._id,
      amount: 100000, // ₹1,000
      status: 'FAILED',
      failureCategory: 'FRAUD_SUSPECTED',
      customer: { name: 'Customer 3', email: 'c3@test.local' }
    });

    await RecoveryCase.create({
      caseId: 'REC-LAB-001',
      paymentId: pay1._id,
      merchantId: testMerchant._id,
      status: 'PENDING_ANALYSIS',
      attemptCount: 0,
      recoverabilityScore: 0.88,
      recoverabilityTier: 'HIGH'
    });

    await RecoveryCase.create({
      caseId: 'REC-LAB-002',
      paymentId: pay2._id,
      merchantId: testMerchant._id,
      status: 'APPROVAL_REQUIRED',
      attemptCount: 1,
      recoverabilityScore: 0.65,
      recoverabilityTier: 'MEDIUM'
    });

    await RecoveryCase.create({
      caseId: 'REC-LAB-003',
      paymentId: pay3._id,
      merchantId: testMerchant._id,
      status: 'CLOSED_UNRECOVERABLE',
      attemptCount: 0,
      recoverabilityScore: 0.0,
      recoverabilityTier: 'NONE'
    });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('1. Valid simulation produces deterministic projections and safety statement', async () => {
    const result = await RecoverySimulationService.simulatePolicy({
      merchantId: testMerchant._id,
      retryDelayMinutes: 15,
      maxAttempts: 4,
      approvalThresholdPaise: 750000, // ₹7,500
      strategy: 'ALL_ELIGIBLE'
    });

    expect(result.isSimulation).toBe(true);
    expect(result.safetyStatement).toBe(SIMULATION_SAFETY_STATEMENT);
    expect(result.evaluatedDatasetSize).toBeGreaterThan(0);
    expect(result.proposed.projectedRecoveryRate).toBeGreaterThan(0);
    expect(result.explainability.length).toBeGreaterThan(0);
    expect(result.deltas).toBeDefined();
  });

  test('2. Determinism: Identical inputs produce identical mathematical outputs', async () => {
    const run1 = await RecoverySimulationService.simulatePolicy({
      merchantId: testMerchant._id,
      retryDelayMinutes: 30,
      maxAttempts: 3,
      approvalThresholdPaise: 1000000,
      strategy: 'RETRY_PAYMENT'
    });

    const run2 = await RecoverySimulationService.simulatePolicy({
      merchantId: testMerchant._id,
      retryDelayMinutes: 30,
      maxAttempts: 3,
      approvalThresholdPaise: 1000000,
      strategy: 'RETRY_PAYMENT'
    });

    expect(run1.proposed.projectedRecoveryCount).toBe(run2.proposed.projectedRecoveryCount);
    expect(run1.proposed.projectedRecoveredAmountPaise).toBe(run2.proposed.projectedRecoveredAmountPaise);
    expect(run1.proposed.projectedRecoveryRate).toBe(run2.proposed.projectedRecoveryRate);
    expect(run1.deltas).toEqual(run2.deltas);
  });

  test('3. Strict Zero-Mutation: Simulation does not alter payments, cases, or actions', async () => {
    const initialPayments = await Payment.find({}).lean();
    const initialActionCount = await RecoveryAction.countDocuments();
    const initialCaseCount = await RecoveryCase.countDocuments();

    await RecoverySimulationService.simulatePolicy({
      merchantId: testMerchant._id,
      retryDelayMinutes: 15,
      maxAttempts: 5,
      approvalThresholdPaise: 2000000,
      strategy: 'SEND_PAYMENT_REMINDER'
    });

    const afterPayments = await Payment.find({}).lean();
    const afterActionCount = await RecoveryAction.countDocuments();
    const afterCaseCount = await RecoveryCase.countDocuments();

    expect(afterPayments.length).toBe(initialPayments.length);
    expect(afterActionCount).toBe(initialActionCount);
    expect(afterCaseCount).toBe(initialCaseCount);

    // Verify payment statuses and amounts remain completely unchanged
    for (let i = 0; i < initialPayments.length; i++) {
      expect(afterPayments[i].status).toBe(initialPayments[i].status);
      expect(afterPayments[i].amount).toBe(initialPayments[i].amount);
    }
  });

  test('4. Validation: Rejects invalid retry delays (< 5 min or > 180 min)', () => {
    expect(() => simulationRequestSchema.parse({
      retryDelayMinutes: 2, // invalid
      maxAttempts: 3,
      approvalThresholdPaise: 500000
    })).toThrow();

    expect(() => simulationRequestSchema.parse({
      retryDelayMinutes: 240, // invalid > 180
      maxAttempts: 3,
      approvalThresholdPaise: 500000
    })).toThrow();
  });

  test('5. Validation: Rejects invalid attempt count (< 1 or > 10)', () => {
    expect(() => simulationRequestSchema.parse({
      retryDelayMinutes: 15,
      maxAttempts: 0, // invalid < 1
      approvalThresholdPaise: 500000
    })).toThrow();

    expect(() => simulationRequestSchema.parse({
      retryDelayMinutes: 15,
      maxAttempts: 15, // invalid > 10
      approvalThresholdPaise: 500000
    })).toThrow();
  });

  test('6. Validation: Rejects negative or non-integer approval thresholds', () => {
    expect(() => simulationRequestSchema.parse({
      retryDelayMinutes: 15,
      maxAttempts: 3,
      approvalThresholdPaise: -500 // invalid
    })).toThrow();

    expect(() => simulationRequestSchema.parse({
      retryDelayMinutes: 15,
      maxAttempts: 3,
      approvalThresholdPaise: 5000.50 // float not allowed for paise
    })).toThrow();
  });

  test('7. Validation: Rejects unsupported recovery strategies', () => {
    expect(() => simulationRequestSchema.parse({
      retryDelayMinutes: 15,
      maxAttempts: 3,
      approvalThresholdPaise: 500000,
      strategy: 'UNSUPPORTED_MAGIC_STRATEGY'
    })).toThrow();
  });

  test('8. Policy Proposal lifecycle: Create -> Approve activates merchant config', async () => {
    const proposal = await RecoverySimulationService.createProposal({
      merchantId: testMerchant._id,
      proposedPolicy: {
        retryDelayMinutes: 30,
        maxAttempts: 4,
        approvalThresholdPaise: 800000
      },
      simulationSummary: {
        projectedRecoveryRate: 48.5,
        projectedRecoveredAmountPaise: 650000,
        projectedRecoveryCount: 2,
        expectedHumanReviews: 1,
        policyBlockedActions: 1,
        recoveryRateDelta: 5.2,
        recoveredAmountDeltaPaise: 120000,
        humanReviewsDelta: -1,
        explainability: ['Approval threshold increase reduces manual delay']
      },
      user: { id: 'usr_ops_123', role: 'ADMIN' }
    });

    expect(proposal.proposalId).toBeDefined();
    expect(proposal.status).toBe('PENDING_REVIEW');

    // Approve proposal
    const { merchant } = await RecoverySimulationService.approveProposal(
      proposal._id,
      { id: 'usr_ops_123', role: 'ADMIN' },
      'Authorized after review'
    );

    expect(merchant.policyConfig.autoActionMaxAmountPaise).toBe(800000);
    expect(merchant.policyConfig.maxRecoveryAttempts).toBe(4);
    expect(merchant.policyConfig.cooldownPeriodMinutes).toBe(30);
  });
});
