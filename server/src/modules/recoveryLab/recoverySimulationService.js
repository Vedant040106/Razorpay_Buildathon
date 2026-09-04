import mongoose from 'mongoose';
import { Payment } from '../payments/payment.model.js';
import { RecoveryCase } from '../recovery/recoveryCase.model.js';
import { Merchant } from '../auth/merchant.model.js';
import { PolicyProposal } from './policyProposal.model.js';
import { AuditService } from '../audit/audit.service.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import {
  evaluateCaseActionUnderPolicy,
  computeCaseRecoveryProbability,
  generateSimulationExplanations
} from './simulationRules.js';

export const SIMULATION_SAFETY_STATEMENT =
  'Simulation complete. No payments were modified. No recovery actions were executed. No Razorpay API mutation was performed.';

export class RecoverySimulationService {
  /**
   * Runs deterministic, zero-mutation simulation comparing Current vs Proposed policy.
   */
  static async simulatePolicy({
    merchantId = null,
    retryDelayMinutes,
    maxAttempts,
    approvalThresholdPaise,
    strategy = 'ALL_ELIGIBLE',
    filters = {}
  }) {
    // 1. Fetch Merchant context to obtain active baseline policy
    const merchantQuery = merchantId ? { _id: merchantId } : { merchantId: 'merch_apex_retail' };
    let merchant = await Merchant.findOne(merchantQuery).lean();
    if (!merchant) {
      merchant = await Merchant.findOne().lean();
    }

    const currentPolicy = {
      autoActionMaxAmountPaise: merchant?.policyConfig?.autoActionMaxAmountPaise ?? 500000,
      maxRecoveryAttempts: merchant?.policyConfig?.maxRecoveryAttempts ?? 3,
      maxAttempts: merchant?.policyConfig?.maxRecoveryAttempts ?? 3,
      cooldownPeriodMinutes: merchant?.policyConfig?.cooldownPeriodMinutes ?? 15,
      retryDelayMinutes: merchant?.policyConfig?.cooldownPeriodMinutes ?? 15,
      minConfidenceAutoAction: merchant?.policyConfig?.minConfidenceAutoAction ?? 0.75,
      allowedAutoStrategies: merchant?.policyConfig?.allowedAutoStrategies ?? ['RETRY_PAYMENT', 'SEND_PAYMENT_REMINDER'],
      strategy: 'ALL_ELIGIBLE',
      approvalThresholdPaise: merchant?.policyConfig?.autoActionMaxAmountPaise ?? 500000
    };

    const proposedPolicy = {
      autoActionMaxAmountPaise: approvalThresholdPaise,
      approvalThresholdPaise,
      maxRecoveryAttempts: maxAttempts,
      maxAttempts,
      cooldownPeriodMinutes: retryDelayMinutes,
      retryDelayMinutes,
      strategy: strategy || 'ALL_ELIGIBLE'
    };

    // 2. Fetch dataset (STRICTLY READ-ONLY via .lean())
    const paymentQuery = { status: 'FAILED' };
    if (merchant?._id) {
      paymentQuery.merchantId = merchant._id;
    }
    if (filters.category) {
      paymentQuery.failureCategory = filters.category;
    }
    if (filters.method) {
      paymentQuery.method = filters.method;
    }

    const [failedPayments, recoveryCases] = await Promise.all([
      Payment.find(paymentQuery).select('paymentId amount failureCategory failureCode method status recoveryStatus createdAt').lean(),
      RecoveryCase.find({}).select('paymentId caseId attemptCount maxAttemptsAllowed recoverabilityScore recoverabilityTier status').lean()
    ]);

    const caseByPaymentId = new Map();
    for (const c of recoveryCases) {
      if (c.paymentId) {
        caseByPaymentId.set(c.paymentId.toString(), c);
      }
    }

    // 3. Compute Metrics for both policies deterministically
    const currentResults = this._evaluateDataset(failedPayments, caseByPaymentId, currentPolicy);
    const proposedResults = this._evaluateDataset(failedPayments, caseByPaymentId, proposedPolicy);

    // 4. Calculate deltas
    const deltas = {
      recoveryCountDelta: proposedResults.projectedRecoveryCount - currentResults.projectedRecoveryCount,
      recoveredAmountDeltaPaise: proposedResults.projectedRecoveredAmountPaise - currentResults.projectedRecoveredAmountPaise,
      recoveryRateDelta: Number((proposedResults.projectedRecoveryRate - currentResults.projectedRecoveryRate).toFixed(1)),
      humanReviewsDelta: proposedResults.expectedHumanReviews - currentResults.expectedHumanReviews,
      blockedActionsDelta: proposedResults.policyBlockedActions - currentResults.policyBlockedActions,
      autoActionsDelta: proposedResults.autoExecutedCount - currentResults.autoExecutedCount
    };

    // 5. Generate transparent explainability
    const explainability = generateSimulationExplanations({
      currentPolicy,
      proposedPolicy,
      currentMetrics: currentResults,
      proposedMetrics: proposedResults,
      deltas
    });

    return {
      isSimulation: true,
      safetyStatement: SIMULATION_SAFETY_STATEMENT,
      evaluatedDatasetSize: failedPayments.length,
      currentPolicy: {
        retryDelayMinutes: currentPolicy.cooldownPeriodMinutes,
        maxAttempts: currentPolicy.maxRecoveryAttempts,
        approvalThresholdPaise: currentPolicy.autoActionMaxAmountPaise,
        strategy: currentPolicy.strategy
      },
      proposedPolicy: {
        retryDelayMinutes: proposedPolicy.retryDelayMinutes,
        maxAttempts: proposedPolicy.maxAttempts,
        approvalThresholdPaise: proposedPolicy.approvalThresholdPaise,
        strategy: proposedPolicy.strategy
      },
      current: currentResults,
      proposed: proposedResults,
      deltas,
      explainability
    };
  }

  /**
   * Helper that evaluates the dataset under a single policy.
   * Pure deterministic calculation.
   */
  static _evaluateDataset(payments, caseMap, policy) {
    if (!payments || payments.length === 0) {
      return {
        totalFailedCount: 0,
        totalFailedVolumePaise: 0,
        recoverableCount: 0,
        recoverableVolumePaise: 0,
        projectedRecoveryCount: 0,
        projectedRecoveredAmountPaise: 0,
        projectedRecoveryRate: 0.0,
        autoExecutedCount: 0,
        expectedHumanReviews: 0,
        policyBlockedActions: 0,
        riskExposurePaise: 0
      };
    }

    let totalFailedCount = payments.length;
    let totalFailedVolumePaise = 0;
    let recoverableCount = 0;
    let recoverableVolumePaise = 0;
    let autoExecutedCount = 0;
    let expectedHumanReviews = 0;
    let policyBlockedActions = 0;
    let riskExposurePaise = 0;

    let cumulativeProbability = 0;
    let cumulativeProjectedAmount = 0;

    for (const payment of payments) {
      const amount = payment.amount || 0;
      totalFailedVolumePaise += amount;

      const recCase = caseMap.get(payment._id?.toString()) || {
        attemptCount: 0,
        maxAttemptsAllowed: policy.maxAttempts,
        recoverabilityScore: null
      };

      const verdictInfo = evaluateCaseActionUnderPolicy(payment, recCase, policy);

      if (verdictInfo.isRecoverable) {
        recoverableCount += 1;
        recoverableVolumePaise += amount;
      }

      if (verdictInfo.actionVerdict === 'AUTO_EXECUTE') {
        autoExecutedCount += 1;
        riskExposurePaise += amount;
      } else if (verdictInfo.actionVerdict === 'REQUIRE_APPROVAL') {
        expectedHumanReviews += 1;
      } else {
        policyBlockedActions += 1;
      }

      const probability = computeCaseRecoveryProbability(payment, recCase, policy, verdictInfo.actionVerdict);
      cumulativeProbability += probability;
      cumulativeProjectedAmount += amount * probability;
    }

    const projectedRecoveryCount = Math.round(cumulativeProbability);
    const projectedRecoveredAmountPaise = Math.round(cumulativeProjectedAmount);
    const projectedRecoveryRate = totalFailedCount > 0
      ? Number(((projectedRecoveryCount / totalFailedCount) * 100).toFixed(1))
      : 0.0;

    return {
      totalFailedCount,
      totalFailedVolumePaise,
      recoverableCount,
      recoverableVolumePaise,
      projectedRecoveryCount,
      projectedRecoveredAmountPaise,
      projectedRecoveryRate,
      autoExecutedCount,
      expectedHumanReviews,
      policyBlockedActions,
      riskExposurePaise
    };
  }

  /**
   * Creates a formal reviewable Policy Proposal.
   */
  static async createProposal({
    merchantId = null,
    proposedPolicy,
    simulationSummary,
    user = null,
    requestId = null
  }) {
    let merchant = merchantId ? await Merchant.findById(merchantId) : await Merchant.findOne();
    if (!merchant) {
      merchant = await Merchant.create({
        merchantId: 'merch_apex_retail',
        name: 'Apex Retail Electronics',
        email: 'ops@apexretail.in',
        currency: 'INR'
      });
    }

    const currentPolicy = {
      autoActionMaxAmountPaise: merchant.policyConfig?.autoActionMaxAmountPaise ?? 500000,
      maxRecoveryAttempts: merchant.policyConfig?.maxRecoveryAttempts ?? 3,
      cooldownPeriodMinutes: merchant.policyConfig?.cooldownPeriodMinutes ?? 15,
      minConfidenceAutoAction: merchant.policyConfig?.minConfidenceAutoAction ?? 0.75,
      allowedAutoStrategies: merchant.policyConfig?.allowedAutoStrategies ?? ['RETRY_PAYMENT', 'SEND_PAYMENT_REMINDER']
    };

    const proposal = await PolicyProposal.create({
      merchantId: merchant._id,
      currentPolicy,
      proposedPolicy: {
        autoActionMaxAmountPaise: proposedPolicy.approvalThresholdPaise,
        maxRecoveryAttempts: proposedPolicy.maxAttempts,
        cooldownPeriodMinutes: proposedPolicy.retryDelayMinutes,
        minConfidenceAutoAction: proposedPolicy.minConfidenceAutoAction ?? 0.75,
        allowedAutoStrategies: proposedPolicy.allowedAutoStrategies ?? (
          proposedPolicy.strategy === 'ALL_ELIGIBLE'
            ? ['RETRY_PAYMENT', 'SEND_PAYMENT_REMINDER']
            : [proposedPolicy.strategy]
        )
      },
      simulationSummary: {
        projectedRecoveryRate: simulationSummary.projectedRecoveryRate,
        projectedRecoveredAmountPaise: simulationSummary.projectedRecoveredAmountPaise,
        projectedRecoveryCount: simulationSummary.projectedRecoveryCount,
        expectedHumanReviews: simulationSummary.expectedHumanReviews,
        policyBlockedActions: simulationSummary.policyBlockedActions,
        recoveryRateDelta: simulationSummary.recoveryRateDelta,
        recoveredAmountDeltaPaise: simulationSummary.recoveredAmountDeltaPaise,
        humanReviewsDelta: simulationSummary.humanReviewsDelta,
        explainability: simulationSummary.explainability || []
      },
      status: 'PENDING_REVIEW',
      proposedBy: mongoose.isValidObjectId(user?.id) ? user.id : null
    });

    await AuditService.logEvent({
      eventType: 'APPROVAL_REQUESTED',
      entityType: 'APPROVAL',
      entityId: proposal.proposalId,
      actor: { type: 'USER', id: user?.id || 'operator', role: user?.role || 'MERCHANT_OPS' },
      requestId,
      payload: {
        proposalId: proposal.proposalId,
        proposedPolicy: proposal.proposedPolicy,
        recoveryRateDelta: simulationSummary.recoveryRateDelta
      }
    });

    return proposal;
  }

  /**
   * Lists all policy proposals.
   */
  static async listProposals(merchantId = null) {
    const filter = merchantId ? { merchantId } : {};
    return PolicyProposal.find(filter)
      .populate('proposedBy', 'name email role')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Approves a policy proposal and activates it on the merchant's live policyConfig.
   */
  static async approveProposal(proposalId, user, notes = '', requestId = null) {
    const proposal = await PolicyProposal.findOne({
      $or: [{ _id: proposalId }, { proposalId: String(proposalId) }]
    });

    if (!proposal) {
      throw new NotFoundError(`Policy Proposal ${proposalId} not found.`);
    }

    if (proposal.status !== 'PENDING_REVIEW') {
      throw new BadRequestError(`Cannot approve proposal that is already ${proposal.status}.`);
    }

    proposal.status = 'APPROVED';
    proposal.reviewedBy = mongoose.isValidObjectId(user?.id) ? user.id : null;
    proposal.reviewedAt = new Date();
    proposal.reviewNotes = notes || 'Approved through merchant operator authorization';
    await proposal.save();

    // ACTIVATE: update Merchant policyConfig
    const merchant = await Merchant.findById(proposal.merchantId);
    if (merchant) {
      merchant.policyConfig = {
        autoActionMaxAmountPaise: proposal.proposedPolicy.autoActionMaxAmountPaise,
        maxRecoveryAttempts: proposal.proposedPolicy.maxRecoveryAttempts,
        cooldownPeriodMinutes: proposal.proposedPolicy.cooldownPeriodMinutes,
        minConfidenceAutoAction: proposal.proposedPolicy.minConfidenceAutoAction,
        allowedAutoStrategies: proposal.proposedPolicy.allowedAutoStrategies
      };
      await merchant.save();
    }

    await AuditService.logEvent({
      eventType: 'ACTION_APPROVED',
      entityType: 'APPROVAL',
      entityId: proposal.proposalId,
      actor: { type: 'USER', id: user?.id || 'operator', role: user?.role || 'ADMIN' },
      requestId,
      payload: {
        proposalId: proposal.proposalId,
        activatedPolicy: proposal.proposedPolicy,
        reviewNotes: proposal.reviewNotes
      }
    });

    return { proposal, merchant };
  }

  /**
   * Rejects a policy proposal.
   */
  static async rejectProposal(proposalId, user, notes = '', requestId = null) {
    const proposal = await PolicyProposal.findOne({
      $or: [{ _id: proposalId }, { proposalId: String(proposalId) }]
    });

    if (!proposal) {
      throw new NotFoundError(`Policy Proposal ${proposalId} not found.`);
    }

    if (proposal.status !== 'PENDING_REVIEW') {
      throw new BadRequestError(`Cannot reject proposal that is already ${proposal.status}.`);
    }

    proposal.status = 'REJECTED';
    proposal.reviewedBy = mongoose.isValidObjectId(user?.id) ? user.id : null;
    proposal.reviewedAt = new Date();
    proposal.reviewNotes = notes || 'Rejected by merchant operator';
    await proposal.save();

    await AuditService.logEvent({
      eventType: 'ACTION_REJECTED',
      entityType: 'APPROVAL',
      entityId: proposal.proposalId,
      actor: { type: 'USER', id: user?.id || 'operator', role: user?.role || 'ADMIN' },
      requestId,
      payload: {
        proposalId: proposal.proposalId,
        reviewNotes: proposal.reviewNotes
      }
    });

    return proposal;
  }
}
