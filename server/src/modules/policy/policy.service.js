import * as rules from './policy.rules.js';
import { env } from '../../config/env.js';
import { AuditService } from '../audit/audit.service.js';

export class PolicyService {
  /**
   * Evaluates recovery policy rules against payment context and AI recommendation.
   * Pure deterministic execution.
   */
  static evaluate({ payment, recoveryCase, aiRecommendation, merchantPolicy = null, requestId = null }) {
    const maxAttempts = merchantPolicy?.maxRecoveryAttempts ?? env.MAX_RECOVERY_ATTEMPTS;
    const cooldownMins = merchantPolicy?.cooldownPeriodMinutes ?? env.COOLDOWN_PERIOD_MINUTES;
    const maxAutoAmount = merchantPolicy?.autoActionMaxAmountPaise ?? env.AUTO_ACTION_MAX_AMOUNT_PAISE;
    const minConfidence = merchantPolicy?.minConfidenceAutoAction ?? env.MIN_CONFIDENCE_AUTO_ACTION;

    const appliedRules = [];

    // 1. Critical Hard Blocks (evaluated first)
    const invarianceBlock = rules.checkPaymentInvariance(payment);
    if (invarianceBlock) {
      appliedRules.push(invarianceBlock.ruleId);
      return this._finalizeDecision(invarianceBlock, appliedRules, payment, recoveryCase, requestId);
    }

    const fraudBlock = rules.checkFraudIndicator(payment);
    if (fraudBlock) {
      appliedRules.push(fraudBlock.ruleId);
      return this._finalizeDecision(fraudBlock, appliedRules, payment, recoveryCase, requestId);
    }

    const retryLimitBlock = rules.checkRetryLimit(recoveryCase, maxAttempts);
    if (retryLimitBlock) {
      appliedRules.push(retryLimitBlock.ruleId);
      return this._finalizeDecision(retryLimitBlock, appliedRules, payment, recoveryCase, requestId);
    }

    const cooldownBlock = rules.checkCooldown(recoveryCase, cooldownMins);
    if (cooldownBlock) {
      appliedRules.push(cooldownBlock.ruleId);
      return this._finalizeDecision(cooldownBlock, appliedRules, payment, recoveryCase, requestId);
    }

    // 2. Human-in-the-loop Gates (evaluated second)
    const fallbackGate = rules.checkFallbackClassifier(aiRecommendation);
    if (fallbackGate) {
      appliedRules.push(fallbackGate.ruleId);
      return this._finalizeDecision(fallbackGate, appliedRules, payment, recoveryCase, requestId);
    }

    const highValueGate = rules.checkHighValueThreshold(payment, maxAutoAmount);
    if (highValueGate) {
      appliedRules.push(highValueGate.ruleId);
      return this._finalizeDecision(highValueGate, appliedRules, payment, recoveryCase, requestId);
    }

    const lowConfidenceGate = rules.checkAIConfidence(aiRecommendation, minConfidence);
    if (lowConfidenceGate) {
      appliedRules.push(lowConfidenceGate.ruleId);
      return this._finalizeDecision(lowConfidenceGate, appliedRules, payment, recoveryCase, requestId);
    }

    const abandonmentGate = rules.checkHighValueAbandonment(payment, aiRecommendation);
    if (abandonmentGate) {
      appliedRules.push(abandonmentGate.ruleId);
      return this._finalizeDecision(abandonmentGate, appliedRules, payment, recoveryCase, requestId);
    }

    // 3. Default Safe Pass
    appliedRules.push('POL-010');
    const allowVerdict = {
      decision: 'ALLOW',
      reasonCode: 'WITHIN_RECOVERY_POLICY',
      explanation: 'Transaction is within automated recovery parameters and meets confidence standards.',
      ruleId: 'POL-010'
    };

    return this._finalizeDecision(allowVerdict, appliedRules, payment, recoveryCase, requestId);
  }

  static _finalizeDecision(verdict, appliedRules, payment, recoveryCase, requestId) {
    const result = {
      decision: verdict.decision,
      reasonCode: verdict.reasonCode,
      explanation: verdict.explanation,
      requiresApproval: verdict.decision === 'REQUIRE_APPROVAL',
      appliedRules,
      evaluatedAt: new Date()
    };

    // Log to Audit Ledger asynchronously
    AuditService.logEvent({
      eventType: verdict.decision === 'BLOCK' ? 'ACTION_BLOCKED' : 'POLICY_EVALUATED',
      entityType: 'RECOVERY_CASE',
      entityId: recoveryCase.caseId || recoveryCase._id,
      actor: { type: 'SYSTEM', id: 'policy_engine' },
      requestId,
      payload: {
        paymentId: payment.paymentId,
        decision: result.decision,
        reasonCode: result.reasonCode,
        appliedRules: result.appliedRules
      }
    });

    return result;
  }
}
