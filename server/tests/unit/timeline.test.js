import { RecoveryService } from '../../src/modules/recovery/recovery.service.js';

describe('Recovery Decision Timeline Synthesis (Unit Tests)', () => {
  const basePayment = {
    paymentId: 'pay_time_001',
    orderId: 'order_time_001',
    amount: 450000,
    method: 'card',
    failureCategory: 'TEMPORARY_NETWORK',
    failureCode: 'GATEWAY_ERROR',
    failureReason: 'Gateway timed out',
    createdAt: new Date('2026-09-04T10:00:00Z')
  };

  const baseCase = {
    caseId: 'REC-TIME-001',
    paymentId: basePayment,
    status: 'RECOVERED',
    recoverabilityTier: 'HIGH',
    recoverabilityScore: 0.91,
    attemptCount: 1,
    finalOutcome: 'RECOVERED',
    createdAt: new Date('2026-09-04T10:01:00Z'),
    updatedAt: new Date('2026-09-04T10:16:00Z')
  };

  const baseDecision = {
    aiProvider: 'gemini_1.5_flash',
    parsedRecommendation: {
      recommendedStrategy: 'RETRY_PAYMENT',
      confidence: 0.92,
      reason: 'Transient network failure with high issuer uptime history.',
      contextualSignals: ['High tier customer', 'Network latency transient'],
      requiresHumanApproval: false
    },
    createdAt: new Date('2026-09-04T10:01:30Z')
  };

  const baseAction = {
    actionType: 'RETRY_PAYMENT',
    attemptNumber: 1,
    idempotencyKey: 'idemp_key_001_abc',
    policyDecision: 'ALLOW',
    policyReasonCode: 'WITHIN_RECOVERY_POLICY',
    status: 'COMPLETED',
    executionDetails: {
      gatewayOperation: 'razorpay.payment.retry',
      isSimulated: false,
      externalReferenceId: 'pay_retry_999'
    },
    executedAt: new Date('2026-09-04T10:15:00Z')
  };

  const baseAuditEvents = [
    {
      eventId: 'evt_001',
      eventType: 'PAYMENT_FAILED',
      timestamp: new Date('2026-09-04T10:00:00Z')
    },
    {
      eventId: 'evt_002',
      eventType: 'AI_ANALYSIS_COMPLETED',
      timestamp: new Date('2026-09-04T10:01:30Z')
    },
    {
      eventId: 'evt_003',
      eventType: 'POLICY_EVALUATED',
      timestamp: new Date('2026-09-04T10:01:35Z')
    },
    {
      eventId: 'evt_004',
      eventType: 'ACTION_EXECUTED',
      timestamp: new Date('2026-09-04T10:15:00Z')
    },
    {
      eventId: 'evt_005',
      eventType: 'RECOVERY_SUCCEEDED',
      timestamp: new Date('2026-09-04T10:15:30Z')
    }
  ];

  test('1. Synthesizes all 8 chronological decision stages in proper order', () => {
    const caseData = {
      ...baseCase,
      latestDecisionId: baseDecision,
      latestActionId: baseAction
    };

    const timeline = RecoveryService.buildStructuredDecisionTimeline(caseData, baseAuditEvents);

    expect(timeline.length).toBe(8);
    expect(timeline.map(s => s.stage)).toEqual([
      'PAYMENT_FAILED',
      'FAILURE_CLASSIFIED',
      'AI_RECOMMENDATION',
      'POLICY_EVALUATION',
      'IDEMPOTENCY_CHECK',
      'RECOVERY_ACTION',
      'EXECUTION_OUTCOME',
      'AUDIT_RECORDED'
    ]);
  });

  test('2. Clearly distinguishes AI Advisory from Deterministic Authoritative systems', () => {
    const caseData = {
      ...baseCase,
      latestDecisionId: baseDecision,
      latestActionId: baseAction
    };

    const timeline = RecoveryService.buildStructuredDecisionTimeline(caseData, baseAuditEvents);

    const aiStage = timeline.find(s => s.stage === 'AI_RECOMMENDATION');
    expect(aiStage.isAi).toBe(true);
    expect(aiStage.details.badge).toContain('ADVISORY ONLY');
    expect(aiStage.actor.type).toBe('AI_AGENT');

    const policyStage = timeline.find(s => s.stage === 'POLICY_EVALUATION');
    expect(policyStage.isAi).toBe(false);
    expect(policyStage.details.badge).toContain('AUTHORITATIVE');
    expect(policyStage.actor.type).toBe('SYSTEM');

    const idempStage = timeline.find(s => s.stage === 'IDEMPOTENCY_CHECK');
    expect(idempStage.isAi).toBe(false);
    expect(idempStage.details.lockStatus).toBe('SECURED_UNIQUE_INDEX');
  });

  test('3. Graceful handling when optional events/decisions are missing (fresh case)', () => {
    const bareCase = {
      caseId: 'REC-TIME-BARE',
      paymentId: basePayment,
      status: 'PENDING_ANALYSIS',
      attemptCount: 0,
      createdAt: new Date()
    };

    const timeline = RecoveryService.buildStructuredDecisionTimeline(bareCase, []);

    expect(timeline.length).toBe(8);
    const aiStage = timeline.find(s => s.stage === 'AI_RECOMMENDATION');
    expect(aiStage.status).toBe('PENDING');

    const actionStage = timeline.find(s => s.stage === 'RECOVERY_ACTION');
    expect(actionStage.status).toBe('SCHEDULED');
  });
});
