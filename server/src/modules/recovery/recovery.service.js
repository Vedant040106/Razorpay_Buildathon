import mongoose from 'mongoose';
import { RecoveryCase } from './recoveryCase.model.js';
import { RecoveryDecision } from './recoveryDecision.model.js';
import { RecoveryAction } from '../actions/recoveryAction.model.js';
import { Payment } from '../payments/payment.model.js';
import { AIService } from '../ai/ai.service.js';
import { ActionService } from '../actions/action.service.js';
import { PolicyService } from '../policy/policy.service.js';
import { AuditService } from '../audit/audit.service.js';
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

    return {
      ...recoveryCase,
      decisions,
      actions,
      timeline
    };
  }
}
