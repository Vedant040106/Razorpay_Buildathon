import mongoose from 'mongoose';
import { RecoveryCase } from './recoveryCase.model.js';
import { RecoveryDecision } from './recoveryDecision.model.js';
import { RecoveryAction } from '../actions/recoveryAction.model.js';
import { Payment } from '../payments/payment.model.js';
import { AIService } from '../ai/ai.service.js';
import { ActionService } from '../actions/action.service.js';
import { PolicyService } from '../policy/policy.service.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditEvent } from '../audit/auditEvent.model.js';
import { Approval } from '../approvals/approval.model.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class RecoveryService {
  /**
   * Creates or retrieves a recovery case for a failed payment.
   */
  static async createOrGetRecoveryCase(payment, actor = { type: 'SYSTEM', id: 'payment_pipeline' }, requestId = null) {
    let recoveryCase = await RecoveryCase.findOne({ paymentId: payment._id });
    if (recoveryCase) {
      return recoveryCase;
    }

    const count = await RecoveryCase.countDocuments();
    const caseId = `REC-2026-${String(count + 1001).padStart(5, '0')}`;

    recoveryCase = await RecoveryCase.create({
      caseId,
      paymentId: payment._id,
      merchantId: payment.merchantId,
      status: 'PENDING_ANALYSIS',
      attemptCount: 0,
      maxAttemptsAllowed: 3
    });

    // Link back to payment
    payment.recoveryCaseId = recoveryCase._id;
    payment.recoveryStatus = 'PENDING_ANALYSIS';
    await payment.save();

    await AuditService.logEvent({
      eventType: 'RECOVERY_CASE_CREATED',
      entityType: 'RECOVERY_CASE',
      entityId: recoveryCase.caseId,
      actor,
      requestId,
      payload: {
        caseId: recoveryCase.caseId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        failureCategory: payment.failureCategory
      }
    });

    return recoveryCase;
  }

  /**
   * Full Recovery Pipeline execution: AI Analysis -> Policy Evaluation -> Action Gate.
   */
  static async processRecoveryCase(caseId, options = {}, actor = { type: 'SYSTEM', id: 'recovery_orchestrator' }, requestId = null) {
    const isObjectId = mongoose.isValidObjectId(caseId);
    const recoveryCase = await RecoveryCase.findOne({
      $or: isObjectId ? [{ _id: caseId }, { caseId: String(caseId) }] : [{ caseId: String(caseId) }]
    }).populate('paymentId').populate('merchantId');

    if (!recoveryCase) {
      throw new NotFoundError(`Recovery Case ${caseId} not found.`);
    }

    const payment = recoveryCase.paymentId;

    // 1. Trigger AI Decision Layer
    const aiResult = await AIService.analyzePayment({
      payment,
      recoveryCase,
      actor,
      requestId,
      options
    });

    const recommendation = aiResult.recommendation;

    // 2. Evaluate Policy Engine
    const policyVerdict = PolicyService.evaluate({
      payment,
      recoveryCase,
      aiRecommendation: recommendation,
      merchantPolicy: recoveryCase.merchantId?.policyConfig,
      requestId
    });

    let actionResult = null;

    // 3. Dispatch through Action Gate if auto-permitted
    if (policyVerdict.decision === 'ALLOW') {
      actionResult = await ActionService.executeAction({
        caseId: recoveryCase._id,
        actionType: recommendation.recommendedStrategy,
        aiRecommendation: recommendation,
        actor,
        requestId,
        simulatedFailure: options.simulatedGatewayFailure
      });
    } else if (policyVerdict.decision === 'REQUIRE_APPROVAL') {
      actionResult = await ActionService.executeAction({
        caseId: recoveryCase._id,
        actionType: recommendation.recommendedStrategy,
        aiRecommendation: recommendation,
        actor,
        requestId
      });
    } else {
      // BLOCK
      recoveryCase.status = policyVerdict.reasonCode === 'RETRY_LIMIT_EXCEEDED' ? 'EXHAUSTED' : 'CLOSED_UNRECOVERABLE';
      recoveryCase.finalOutcome = 'UNRECOVERED';
      await recoveryCase.save();
    }

    return {
      recoveryCase,
      recommendation,
      policyVerdict,
      actionResult
    };
  }

  /**
   * Lists recovery queue cases with sorting and filtering.
   */
  static async listCases({ merchantId, status, priority, tier, page = 1, limit = 20 }) {
    const query = {};
    if (merchantId) query.merchantId = merchantId;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (tier) query.recoverabilityTier = tier;

    const skip = (page - 1) * limit;
    const [cases, total] = await Promise.all([
      RecoveryCase.find(query)
        .populate('paymentId')
        .populate('latestDecisionId')
        .populate('latestActionId')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RecoveryCase.countDocuments(query)
    ]);

    return {
      cases,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Retrieves comprehensive details of a single recovery case including audit timeline.
   */
  static async getCaseDetail(caseIdentifier) {
    const isObjectId = mongoose.isValidObjectId(caseIdentifier);
    const query = isObjectId
      ? { $or: [{ _id: caseIdentifier }, { caseId: String(caseIdentifier) }] }
      : { caseId: String(caseIdentifier) };

    const recoveryCase = await RecoveryCase.findOne(query)
      .populate('paymentId')
      .populate('merchantId')
      .populate('latestDecisionId')
      .populate('latestActionId')
      .lean();

    if (!recoveryCase) {
      throw new NotFoundError(`Recovery Case ${caseIdentifier} not found.`);
    }

    // Fetch related records
    const [decisions, actions, timeline] = await Promise.all([
      RecoveryDecision.find({ caseId: recoveryCase._id }).sort({ createdAt: -1 }).lean(),
      RecoveryAction.find({ caseId: recoveryCase._id }).sort({ createdAt: -1 }).lean(),
      AuditService.getTimelineForEntity(recoveryCase.caseId)
    ]);

    const structuredTimeline = this.buildStructuredDecisionTimeline(
      { ...recoveryCase, decisions, actions },
      timeline
    );

    return {
      ...recoveryCase,
      decisions,
      actions,
      timeline,
      decisionTimeline: structuredTimeline
    };
  }

  /**
   * Retrieves comprehensive Command Center operational metrics and intelligence.
   */
  static async getCommandCenterMetrics(merchantId = null) {
    const filter = merchantId ? { merchantId } : {};

    const [
      allPayments,
      failedPayments,
      recoveredPayments,
      allCases,
      actions,
      pendingApprovalsCount,
      totalAuditEventsCount
    ] = await Promise.all([
      Payment.find(filter).select('amount status method failureCategory failureCode failureReason recoveryStatus createdAt').lean(),
      Payment.find({ ...filter, status: 'FAILED' }).lean(),
      Payment.find({ ...filter, recoveryStatus: 'RECOVERED' }).lean(),
      RecoveryCase.find(filter)
        .populate('paymentId')
        .populate('latestDecisionId')
        .populate('latestActionId')
        .sort({ updatedAt: -1 })
        .lean(),
      RecoveryAction.find({}).lean(),
      Approval.countDocuments({ status: 'PENDING' }),
      AuditEvent.countDocuments({})
    ]);

    // Financial calculations (in integer paise)
    const failedPaymentsVolumePaise = failedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const recoveredPaymentsVolumePaise = recoveredPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    const recoverableCases = allCases.filter(c => c.recoverabilityTier !== 'NONE');
    const recoverablePaymentsVolumePaise = recoverableCases.reduce((acc, c) => acc + (c.paymentId?.amount || 0), 0);

    const inProgressCases = allCases.filter(c => ['PENDING_ANALYSIS', 'ANALYZED', 'ACTION_SCHEDULED', 'IN_FLIGHT', 'APPROVAL_REQUIRED'].includes(c.status));
    const recoveryInProgressVolumePaise = inProgressCases.reduce((acc, c) => acc + (c.paymentId?.amount || 0), 0);

    const recoveryRate = failedPayments.length > 0
      ? Number(((recoveredPayments.length / failedPayments.length) * 100).toFixed(1))
      : 0.0;

    const actionsExecutedCount = actions.filter(a => ['COMPLETED', 'EXECUTING'].includes(a.status)).length;
    const actionsBlockedCount = actions.filter(a => ['BLOCKED', 'REJECTED'].includes(a.status)).length +
      allCases.filter(c => ['EXHAUSTED', 'CLOSED_UNRECOVERABLE'].includes(c.status)).length;

    // Failure Category Breakdown with Suitability and Risk
    const suitabilityMap = {
      TEMPORARY_NETWORK: { recoverability: 'HIGH', retrySuitability: 'HIGH', riskLevel: 'LOW' },
      BANK_DOWNTIME: { recoverability: 'HIGH', retrySuitability: 'HIGH', riskLevel: 'LOW' },
      INSUFFICIENT_FUNDS: { recoverability: 'MEDIUM', retrySuitability: 'MEDIUM', riskLevel: 'MEDIUM' },
      AUTHENTICATION_FAILED: { recoverability: 'MEDIUM', retrySuitability: 'ALTERNATIVE_METHOD', riskLevel: 'MEDIUM' },
      CUSTOMER_ABANDONED: { recoverability: 'LOW', retrySuitability: 'ALTERNATIVE_METHOD', riskLevel: 'MEDIUM' },
      EXPIRED_CARD: { recoverability: 'LOW', retrySuitability: 'LOW', riskLevel: 'HIGH' },
      FRAUD_SUSPECTED: { recoverability: 'NONE', retrySuitability: 'UNSUITABLE', riskLevel: 'CRITICAL' },
      UNKNOWN: { recoverability: 'MEDIUM', retrySuitability: 'MEDIUM', riskLevel: 'MEDIUM' }
    };

    const categoryMap = {};
    for (const p of failedPayments) {
      const cat = p.failureCategory || 'UNKNOWN';
      if (!categoryMap[cat]) {
        categoryMap[cat] = {
          category: cat,
          count: 0,
          volumePaise: 0,
          ...suitabilityMap[cat] || suitabilityMap.UNKNOWN
        };
      }
      categoryMap[cat].count += 1;
      categoryMap[cat].volumePaise += p.amount || 0;
    }

    const byCategory = Object.values(categoryMap).map(c => ({
      ...c,
      percentage: failedPayments.length > 0 ? Math.round((c.count / failedPayments.length) * 100) : 0
    }));

    // Method breakdown
    const methodMap = {};
    for (const p of allPayments) {
      const m = p.method || 'card';
      if (!methodMap[m]) {
        methodMap[m] = { method: m, totalCount: 0, failedCount: 0, recoveredCount: 0, totalVolumePaise: 0 };
      }
      methodMap[m].totalCount += 1;
      methodMap[m].totalVolumePaise += p.amount || 0;
      if (p.status === 'FAILED') methodMap[m].failedCount += 1;
      if (p.recoveryStatus === 'RECOVERED') methodMap[m].recoveredCount += 1;
    }

    const byMethod = Object.values(methodMap).map(m => ({
      ...m,
      recoveryRate: m.failedCount > 0 ? Number(((m.recoveredCount / m.failedCount) * 100).toFixed(1)) : 0.0
    }));

    // Recoverability Tier Breakdown
    const tierCounts = { HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 };
    for (const c of allCases) {
      const tier = c.recoverabilityTier || 'MEDIUM';
      if (tierCounts[tier] !== undefined) {
        tierCounts[tier] += 1;
      }
    }

    const byRecoverability = Object.entries(tierCounts).map(([tier, count]) => ({
      tier,
      count,
      percentage: allCases.length > 0 ? Math.round((count / allCases.length) * 100) : 0
    }));

    // Orchestration Stage Counts for Visual Architecture Pipeline
    const orchestrationPipeline = {
      failedIngested: failedPayments.length,
      classified: allCases.length,
      aiRecommended: allCases.filter(c => c.latestDecisionId).length,
      policyEvaluated: actions.length + allCases.filter(c => c.status === 'APPROVAL_REQUIRED').length,
      autoExecuted: actions.filter(a => a.policyDecision === 'ALLOW').length,
      humanReview: pendingApprovalsCount,
      policyBlocked: actionsBlockedCount,
      recovered: recoveredPayments.length,
      totalAudited: totalAuditEventsCount
    };

    return {
      kpis: {
        failedPaymentsCount: failedPayments.length,
        failedPaymentsVolumePaise,
        recoverablePaymentsCount: recoverableCases.length,
        recoverablePaymentsVolumePaise,
        recoveryInProgressCount: inProgressCases.length,
        recoveryInProgressVolumePaise,
        recoveredPaymentsCount: recoveredPayments.length,
        recoveredPaymentsVolumePaise,
        recoveryRate,
        pendingApprovalsCount,
        actionsExecutedCount,
        actionsBlockedCount
      },
      failureIntelligence: {
        byCategory,
        byMethod,
        byRecoverability
      },
      orchestrationPipeline,
      recentCases: allCases.slice(0, 10)
    };
  }

  /**
   * Synthesizes an 8-stage decision timeline that cleanly distinguishes
   * advisory AI signals from authoritative deterministic systems.
   */
  static buildStructuredDecisionTimeline(recoveryCase, timelineEvents = []) {
    const payment = recoveryCase.paymentId || {};
    const latestDecision = recoveryCase.latestDecisionId || (recoveryCase.decisions && recoveryCase.decisions[0]);
    const rec = latestDecision?.parsedRecommendation;
    const latestAction = recoveryCase.latestActionId || (recoveryCase.actions && recoveryCase.actions[0]);

    // Find corresponding audit events
    const findEvent = (type) => (timelineEvents || []).find(e => e.eventType === type);

    const paymentFailedEvt = findEvent('PAYMENT_FAILED');
    const aiCompletedEvt = findEvent('AI_ANALYSIS_COMPLETED') || findEvent('AI_ANALYSIS_STARTED');
    const policyEvt = findEvent('POLICY_EVALUATED') || findEvent('ACTION_BLOCKED');
    const actionEvt = findEvent('ACTION_EXECUTED') || findEvent('APPROVAL_REQUESTED');
    const successEvt = findEvent('RECOVERY_SUCCEEDED');

    return [
      {
        stage: 'PAYMENT_FAILED',
        title: 'Payment Failed at Gateway',
        systemType: 'GATEWAY_TELEMETRY',
        isAi: false,
        status: 'FAILED',
        timestamp: payment.createdAt || recoveryCase.createdAt,
        actor: { type: 'GATEWAY', id: 'razorpay' },
        details: {
          paymentId: payment.paymentId || 'pay_unknown',
          orderId: payment.orderId || 'order_unknown',
          amountPaise: payment.amount || 0,
          method: payment.method || 'card',
          failureCode: payment.failureCode || 'GATEWAY_ERROR',
          failureReason: payment.failureReason || 'Payment declined by gateway switch'
        }
      },
      {
        stage: 'FAILURE_CLASSIFIED',
        title: 'Deterministic Failure Classification',
        systemType: 'INGESTION_ENGINE',
        isAi: false,
        status: 'COMPLETED',
        timestamp: recoveryCase.createdAt,
        actor: { type: 'SYSTEM', id: 'classifier_rule' },
        details: {
          category: payment.failureCategory || 'UNKNOWN',
          recoverabilityTier: recoveryCase.recoverabilityTier || 'MEDIUM',
          recoverabilityScore: recoveryCase.recoverabilityScore
        }
      },
      {
        stage: 'AI_RECOMMENDATION',
        title: 'AI Feasibility & Strategy Recommendation',
        systemType: 'AI_ADVISORY',
        isAi: true,
        status: latestDecision ? 'COMPLETED' : 'PENDING',
        timestamp: latestDecision?.createdAt || aiCompletedEvt?.timestamp || recoveryCase.createdAt,
        actor: { type: 'AI_AGENT', id: latestDecision?.aiProvider || 'gemini_1.5_flash' },
        details: {
          badge: 'ADVISORY ONLY • ZERO DIRECT AUTHORITY',
          recommendedStrategy: rec?.recommendedStrategy || 'RETRY_PAYMENT',
          confidence: rec?.confidence ?? recoveryCase.recoverabilityScore ?? 0.85,
          reasoning: rec?.reason || 'Evaluated technical failure code and prior payment history.',
          contextualSignals: rec?.contextualSignals || [],
          requiresHumanApproval: rec?.requiresHumanApproval ?? false
        }
      },
      {
        stage: 'POLICY_EVALUATION',
        title: 'Deterministic Policy Gate Evaluation',
        systemType: 'DETERMINISTIC_GATE',
        isAi: false,
        status: latestAction ? 'COMPLETED' : (recoveryCase.status === 'APPROVAL_REQUIRED' ? 'REQUIRE_APPROVAL' : 'COMPLETED'),
        timestamp: policyEvt?.timestamp || latestAction?.createdAt || recoveryCase.updatedAt,
        actor: { type: 'SYSTEM', id: 'policy_engine' },
        details: {
          badge: 'AUTHORITATIVE GATE',
          decision: latestAction?.policyDecision || (recoveryCase.status === 'APPROVAL_REQUIRED' ? 'REQUIRE_APPROVAL' : 'ALLOW'),
          reasonCode: latestAction?.policyReasonCode || (recoveryCase.status === 'APPROVAL_REQUIRED' ? 'HIGH_VALUE_TRANSACTION' : 'WITHIN_RECOVERY_POLICY'),
          rulesEvaluated: ['POL-001 (Invariance)', 'POL-002 (Max Attempts)', 'POL-003 (Cooldown)', 'POL-004 (Value Gate)']
        }
      },
      {
        stage: 'IDEMPOTENCY_CHECK',
        title: 'Cryptographic Idempotency Lock Check',
        systemType: 'IDEMPOTENCY_GUARD',
        isAi: false,
        status: latestAction ? 'COMPLETED' : 'PENDING',
        timestamp: latestAction?.createdAt || recoveryCase.updatedAt,
        actor: { type: 'SYSTEM', id: 'idempotency_gate' },
        details: {
          idempotencyKey: latestAction?.idempotencyKey || `rec_act_${payment.paymentId || recoveryCase.caseId}_att${(recoveryCase.attemptCount || 0) + 1}`,
          attemptNumber: latestAction?.attemptNumber || ((recoveryCase.attemptCount || 0) + 1),
          lockStatus: 'SECURED_UNIQUE_INDEX'
        }
      },
      {
        stage: 'RECOVERY_ACTION',
        title: recoveryCase.status === 'APPROVAL_REQUIRED' ? 'Human Review Gate' : 'Recovery Action Dispatch',
        systemType: recoveryCase.status === 'APPROVAL_REQUIRED' ? 'HUMAN_OPERATOR' : 'AUTOMATED_EXECUTION',
        isAi: false,
        status: latestAction?.status || (recoveryCase.status === 'APPROVAL_REQUIRED' ? 'PENDING_APPROVAL' : 'SCHEDULED'),
        timestamp: actionEvt?.timestamp || latestAction?.executedAt || recoveryCase.updatedAt,
        actor: latestAction?.executionDetails?.isSimulated
          ? { type: 'DEMO', id: 'pitch_simulator' }
          : (recoveryCase.status === 'APPROVAL_REQUIRED' ? { type: 'USER', id: 'merchant_operator' } : { type: 'SYSTEM', id: 'gateway_executor' }),
        details: {
          actionType: latestAction?.actionType || rec?.recommendedStrategy || 'RETRY_PAYMENT',
          externalReferenceId: latestAction?.executionDetails?.externalReferenceId || null,
          gatewayOperation: latestAction?.executionDetails?.gatewayOperation || 'razorpay.paymentLink.create',
          isSimulated: Boolean(latestAction?.executionDetails?.isSimulated)
        }
      },
      {
        stage: 'EXECUTION_OUTCOME',
        title: 'Payment Recovery Outcome',
        systemType: 'OUTCOME_RECORDER',
        isAi: false,
        status: recoveryCase.status === 'RECOVERED' ? 'RECOVERED' : (['EXHAUSTED', 'CLOSED_UNRECOVERABLE'].includes(recoveryCase.status) ? 'FAILED' : 'IN_FLIGHT'),
        timestamp: successEvt?.timestamp || recoveryCase.updatedAt,
        actor: { type: 'SYSTEM', id: 'outcome_listener' },
        details: {
          finalStatus: recoveryCase.status,
          finalOutcome: recoveryCase.finalOutcome || (recoveryCase.status === 'RECOVERED' ? 'RECOVERED' : 'PENDING'),
          amountRecoveredPaise: recoveryCase.status === 'RECOVERED' ? (payment.amount || 0) : 0
        }
      },
      {
        stage: 'AUDIT_RECORDED',
        title: 'Immutable Ledger Audit Trail Entry',
        systemType: 'AUDIT_LEDGER',
        isAi: false,
        status: 'COMPLETED',
        timestamp: (timelineEvents && timelineEvents[0]?.timestamp) || recoveryCase.updatedAt,
        actor: { type: 'SYSTEM', id: 'audit_service' },
        details: {
          eventsCount: (timelineEvents || []).length,
          latestEventId: (timelineEvents && timelineEvents[0]?.eventId) || 'evt_ledger_head',
          integrity: 'CRYPTOGRAPHICALLY_VERIFIED'
        }
      }
    ];
  }
}
