import { PolicyService } from '../../src/modules/policy/policy.service.js';

describe('Deterministic Policy Engine (Unit Tests)', () => {
  const basePayment = {
    paymentId: 'pay_test_001',
    amount: 450000, // ₹4,500
    status: 'FAILED',
    recoveryStatus: 'PENDING_ANALYSIS',
    failureCategory: 'TEMPORARY_NETWORK'
  };

  const baseCase = {
    caseId: 'REC-2026-TEST1',
    attemptCount: 0,
    lastAttemptAt: null
  };

  const baseRecommendation = {
    recommendedStrategy: 'RETRY_PAYMENT',
    confidence: 0.92,
    priority: 'HIGH',
    requiresHumanApproval: false,
    isFallback: false
  };

  test('POL-010: Standard transient failure with high confidence evaluates to ALLOW', () => {
    const verdict = PolicyService.evaluate({
      payment: basePayment,
      recoveryCase: baseCase,
      aiRecommendation: baseRecommendation
    });

    expect(verdict.decision).toBe('ALLOW');
    expect(verdict.reasonCode).toBe('WITHIN_RECOVERY_POLICY');
    expect(verdict.requiresApproval).toBe(false);
    expect(verdict.appliedRules).toContain('POL-010');
  });

  test('POL-001: Payment already captured blocks recovery attempt', () => {
    const capturedPayment = { ...basePayment, status: 'CAPTURED', recoveryStatus: 'RECOVERED' };
    const verdict = PolicyService.evaluate({
      payment: capturedPayment,
      recoveryCase: baseCase,
      aiRecommendation: baseRecommendation
    });

    expect(verdict.decision).toBe('BLOCK');
    expect(verdict.reasonCode).toBe('ALREADY_SUCCESSFUL');
  });

  test('POL-002: Maximum recovery attempts exceeded blocks action', () => {
    const exhaustedCase = { ...baseCase, attemptCount: 3 };
    const verdict = PolicyService.evaluate({
      payment: basePayment,
      recoveryCase: exhaustedCase,
      aiRecommendation: baseRecommendation
    });

    expect(verdict.decision).toBe('BLOCK');
    expect(verdict.reasonCode).toBe('RETRY_LIMIT_EXCEEDED');
  });

  test('POL-003: Active cooldown period blocks action', () => {
    const recentAttemptCase = {
      ...baseCase,
      attemptCount: 1,
      lastAttemptAt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago (< 15 min cooldown)
    };
    const verdict = PolicyService.evaluate({
      payment: basePayment,
      recoveryCase: recentAttemptCase,
      aiRecommendation: baseRecommendation
    });

    expect(verdict.decision).toBe('BLOCK');
    expect(verdict.reasonCode).toBe('COOLDOWN_ACTIVE');
  });

  test('POL-004: Transaction exceeding auto-action threshold requires approval', () => {
    const highValuePayment = { ...basePayment, amount: 1200000 }; // ₹12,000 > ₹5,000 limit
    const verdict = PolicyService.evaluate({
      payment: highValuePayment,
      recoveryCase: baseCase,
      aiRecommendation: baseRecommendation
    });

    expect(verdict.decision).toBe('REQUIRE_APPROVAL');
    expect(verdict.reasonCode).toBe('HIGH_VALUE_TRANSACTION');
    expect(verdict.requiresApproval).toBe(true);
  });

  test('POL-005: Low AI confidence score requires human approval', () => {
    const lowConfidenceRec = { ...baseRecommendation, confidence: 0.65 }; // < 0.75
    const verdict = PolicyService.evaluate({
      payment: basePayment,
      recoveryCase: baseCase,
      aiRecommendation: lowConfidenceRec
    });

    expect(verdict.decision).toBe('REQUIRE_APPROVAL');
    expect(verdict.reasonCode).toBe('LOW_CONFIDENCE_SCORE');
  });

  test('POL-006: Fallback classifier recommendation mandates human review', () => {
    const fallbackRec = { ...baseRecommendation, isFallback: true };
    const verdict = PolicyService.evaluate({
      payment: basePayment,
      recoveryCase: baseCase,
      aiRecommendation: fallbackRec
    });

    expect(verdict.decision).toBe('REQUIRE_APPROVAL');
    expect(verdict.reasonCode).toBe('FALLBACK_POLICY_ENFORCED');
  });

  test('POL-008: Suspected fraud permanently blocks recovery', () => {
    const fraudPayment = { ...basePayment, failureCategory: 'FRAUD_SUSPECTED' };
    const verdict = PolicyService.evaluate({
      payment: fraudPayment,
      recoveryCase: baseCase,
      aiRecommendation: baseRecommendation
    });

    expect(verdict.decision).toBe('BLOCK');
    expect(verdict.reasonCode).toBe('FRAUD_SUSPECTED_BLOCK');
  });
});
