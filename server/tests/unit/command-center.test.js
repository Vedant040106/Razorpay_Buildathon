import { RecoveryService } from '../../src/modules/recovery/recovery.service.js';
import { Payment } from '../../src/modules/payments/payment.model.js';
import { RecoveryCase } from '../../src/modules/recovery/recoveryCase.model.js';
import { Merchant } from '../../src/modules/auth/merchant.model.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';

describe('Recovery Command Center Intelligence & KPIs (Unit Tests)', () => {
  let merchant;

  beforeAll(async () => {
    await connectDatabase();

    merchant = await Merchant.create({
      merchantId: 'merch_cc_test',
      name: 'Command Center Test Merchant',
      email: 'cc@test.local',
      currency: 'INR'
    });

    // 1. Recovered payment (TEMPORARY_NETWORK, Card)
    const pay1 = await Payment.create({
      paymentId: 'pay_cc_001',
      orderId: 'order_cc_001',
      merchantId: merchant._id,
      amount: 450000, // ₹4,500
      status: 'FAILED',
      recoveryStatus: 'RECOVERED',
      method: 'card',
      failureCategory: 'TEMPORARY_NETWORK',
      customer: { name: 'Alice', email: 'alice@test.local' }
    });

    // 2. High value pending approval (AUTHENTICATION_FAILED, Card)
    const pay2 = await Payment.create({
      paymentId: 'pay_cc_002',
      orderId: 'order_cc_002',
      merchantId: merchant._id,
      amount: 1200000, // ₹12,000
      status: 'FAILED',
      recoveryStatus: 'IN_RECOVERY',
      method: 'card',
      failureCategory: 'AUTHENTICATION_FAILED',
      customer: { name: 'Bob', email: 'bob@test.local' }
    });

    // 3. Fraud blocked (FRAUD_SUSPECTED, UPI)
    const pay3 = await Payment.create({
      paymentId: 'pay_cc_003',
      orderId: 'order_cc_003',
      merchantId: merchant._id,
      amount: 250000, // ₹2,500
      status: 'FAILED',
      recoveryStatus: 'UNRECOVERABLE',
      method: 'upi',
      failureCategory: 'FRAUD_SUSPECTED',
      customer: { name: 'Charlie', email: 'charlie@test.local' }
    });

    await RecoveryCase.create({
      caseId: 'REC-CC-001',
      paymentId: pay1._id,
      merchantId: merchant._id,
      status: 'RECOVERED',
      attemptCount: 1,
      recoverabilityTier: 'HIGH',
      finalOutcome: 'RECOVERED'
    });

    await RecoveryCase.create({
      caseId: 'REC-CC-002',
      paymentId: pay2._id,
      merchantId: merchant._id,
      status: 'APPROVAL_REQUIRED',
      attemptCount: 0,
      recoverabilityTier: 'MEDIUM'
    });

    await RecoveryCase.create({
      caseId: 'REC-CC-003',
      paymentId: pay3._id,
      merchantId: merchant._id,
      status: 'CLOSED_UNRECOVERABLE',
      attemptCount: 0,
      recoverabilityTier: 'NONE',
      finalOutcome: 'UNRECOVERED'
    });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  test('1. KPI Calculations match deterministic database aggregates', async () => {
    const data = await RecoveryService.getCommandCenterMetrics(merchant._id);

    expect(data.kpis).toBeDefined();
    expect(data.kpis.failedPaymentsCount).toBe(3);
    expect(data.kpis.failedPaymentsVolumePaise).toBe(450000 + 1200000 + 250000); // ₹19,000
    expect(data.kpis.recoveredPaymentsCount).toBe(1);
    expect(data.kpis.recoveredPaymentsVolumePaise).toBe(450000); // ₹4,500
    expect(data.kpis.recoveryRate).toBe(33.3); // 1 / 3 = 33.3%
    expect(data.kpis.recoverablePaymentsCount).toBe(2); // High + Medium
  });

  test('2. Failure Intelligence categorizes suitability and risk profiles deterministically', async () => {
    const data = await RecoveryService.getCommandCenterMetrics(merchant._id);
    const { byCategory, byMethod, byRecoverability } = data.failureIntelligence;

    expect(byCategory.length).toBe(3);

    const fraudCat = byCategory.find(c => c.category === 'FRAUD_SUSPECTED');
    expect(fraudCat).toBeDefined();
    expect(fraudCat.recoverability).toBe('NONE');
    expect(fraudCat.retrySuitability).toBe('UNSUITABLE');
    expect(fraudCat.riskLevel).toBe('CRITICAL');

    const networkCat = byCategory.find(c => c.category === 'TEMPORARY_NETWORK');
    expect(networkCat).toBeDefined();
    expect(networkCat.retrySuitability).toBe('HIGH');
    expect(networkCat.riskLevel).toBe('LOW');

    const methodCard = byMethod.find(m => m.method === 'card');
    expect(methodCard.failedCount).toBe(2);

    const highTier = byRecoverability.find(t => t.tier === 'HIGH');
    expect(highTier.count).toBe(1);
  });

  test('3. Recovery Orchestration counts live stages for architectural visualization', async () => {
    const data = await RecoveryService.getCommandCenterMetrics(merchant._id);
    const { orchestrationPipeline } = data;

    expect(orchestrationPipeline.failedIngested).toBe(3);
    expect(orchestrationPipeline.classified).toBe(3);
    expect(orchestrationPipeline.recovered).toBe(1);
  });

  test('4. Empty State: returns clean zero-valued KPIs without division by zero errors', async () => {
    const emptyMerchant = await Merchant.create({
      merchantId: 'merch_empty_001',
      name: 'Empty Merchant',
      email: 'empty@test.local',
      currency: 'INR'
    });

    const data = await RecoveryService.getCommandCenterMetrics(emptyMerchant._id);

    expect(data.kpis.failedPaymentsCount).toBe(0);
    expect(data.kpis.failedPaymentsVolumePaise).toBe(0);
    expect(data.kpis.recoveryRate).toBe(0.0);
    expect(data.failureIntelligence.byCategory.length).toBe(0);
  });
});
