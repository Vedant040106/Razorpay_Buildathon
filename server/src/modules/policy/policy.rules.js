/**
 * Pure deterministic rule functions.
 * ZERO LLM dependencies.
 */

// POL-001: Payment Invariance
export function checkPaymentInvariance(payment) {
  if (['AUTHORIZED', 'CAPTURED'].includes(payment.status) || payment.recoveryStatus === 'RECOVERED') {
    return {
      decision: 'BLOCK',
      reasonCode: 'ALREADY_SUCCESSFUL',
      explanation: `Payment is already in '${payment.status}' state with recovery status '${payment.recoveryStatus}'. Subsequent recovery actions are blocked to prevent duplicate charging.`,
      ruleId: 'POL-001'
    };
  }
  return null;
}

// POL-002: Retry Limit Exhaustion
export function checkRetryLimit(recoveryCase, maxAllowed = 3) {
  if (recoveryCase.attemptCount >= maxAllowed) {
    return {
      decision: 'BLOCK',
      reasonCode: 'RETRY_LIMIT_EXCEEDED',
      explanation: `Recovery attempt limit of ${maxAllowed} attempts has been reached for this transaction. Action blocked to prevent card network spam and chargeback risks.`,
      ruleId: 'POL-002'
    };
  }
  return null;
}

// POL-003: Cooldown Active
export function checkCooldown(recoveryCase, cooldownMinutes = 15) {
  if (!recoveryCase.lastAttemptAt) return null;

  const elapsedMs = Date.now() - new Date(recoveryCase.lastAttemptAt).getTime();
  const cooldownMs = cooldownMinutes * 60 * 1000;

  if (elapsedMs < cooldownMs) {
    const remainingMinutes = Math.ceil((cooldownMs - elapsedMs) / (60 * 1000));
    return {
      decision: 'BLOCK',
      reasonCode: 'COOLDOWN_ACTIVE',
      explanation: `Cooldown period active. Next eligible recovery attempt in ${remainingMinutes} minute(s).`,
      ruleId: 'POL-003'
    };
  }
  return null;
}

// POL-004: High-Value Transaction Gate
export function checkHighValueThreshold(payment, maxAutoAmountPaise = 500000) {
  if (payment.amount > maxAutoAmountPaise) {
    const formattedAmount = (payment.amount / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    const formattedLimit = (maxAutoAmountPaise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

    return {
      decision: 'REQUIRE_APPROVAL',
      reasonCode: 'HIGH_VALUE_TRANSACTION',
      explanation: `Transaction amount ${formattedAmount} exceeds the automated action threshold of ${formattedLimit}. Requires human-in-the-loop merchant approval.`,
      ruleId: 'POL-004'
    };
  }
  return null;
}

// POL-005: Low-Confidence AI Recommendation
export function checkAIConfidence(aiRecommendation, minConfidence = 0.75) {
  if (aiRecommendation.confidence < minConfidence) {
    return {
      decision: 'REQUIRE_APPROVAL',
      reasonCode: 'LOW_CONFIDENCE_SCORE',
      explanation: `AI model confidence score (${(aiRecommendation.confidence * 100).toFixed(0)}%) is below the automated recovery threshold (${(minConfidence * 100).toFixed(0)}%). Enqueued for human review.`,
      ruleId: 'POL-005'
    };
  }
  return null;
}

// POL-006: Fallback Classifier Gate
export function checkFallbackClassifier(aiRecommendation) {
  if (aiRecommendation.isFallback || aiRecommendation.requiresHumanApproval) {
    return {
      decision: 'REQUIRE_APPROVAL',
      reasonCode: 'FALLBACK_POLICY_ENFORCED',
      explanation: 'Recommendation was generated via fallback classifier or marked for mandatory review. Human authorization required.',
      ruleId: 'POL-006'
    };
  }
  return null;
}

// POL-007: High-Value Abandonment Review
export function checkHighValueAbandonment(payment, aiRecommendation, thresholdPaise = 200000) {
  if (['MARK_UNRECOVERABLE', 'ESCALATE_TO_MERCHANT'].includes(aiRecommendation.recommendedStrategy) && payment.amount > thresholdPaise) {
    return {
      decision: 'REQUIRE_APPROVAL',
      reasonCode: 'HIGH_VALUE_ABANDONMENT_REVIEW',
      explanation: 'AI recommended abandoning or escalating a high-value transaction. Requires merchant manager sign-off.',
      ruleId: 'POL-007'
    };
  }
  return null;
}

// POL-008: Fraud Suspected Block
export function checkFraudIndicator(payment) {
  if (payment.failureCategory === 'FRAUD_SUSPECTED' || (payment.failureCode && payment.failureCode.includes('FRAUD'))) {
    return {
      decision: 'BLOCK',
      reasonCode: 'FRAUD_SUSPECTED_BLOCK',
      explanation: 'Suspected fraud or risk flag detected by gateway. Automated recovery permanently blocked.',
      ruleId: 'POL-008'
    };
  }
  return null;
}
