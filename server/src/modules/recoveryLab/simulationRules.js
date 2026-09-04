/**
 * Pure Deterministic Simulation Rules for RecoverAI Recovery Lab.
 * ZERO LLM dependencies.
 * All calculations are 100% reproducible, explainable, and bounded.
 */

export const CATEGORY_BASE_PROBABILITIES = {
  TEMPORARY_NETWORK: 0.84,
  BANK_DOWNTIME: 0.78,
  INSUFFICIENT_FUNDS: 0.52,
  AUTHENTICATION_FAILED: 0.62,
  CUSTOMER_ABANDONED: 0.44,
  EXPIRED_CARD: 0.14,
  UNKNOWN: 0.40,
  FRAUD_SUSPECTED: 0.00
};

/**
 * Deterministically evaluates whether a payment/case is ALLOW (Auto-Execute),
 * REQUIRE_APPROVAL (Human Review), or BLOCK under a given policy.
 */
export function evaluateCaseActionUnderPolicy(payment, recoveryCase, policy) {
  // 1. Payment invariance (already recovered or captured)
  if (['AUTHORIZED', 'CAPTURED'].includes(payment.status) || payment.recoveryStatus === 'RECOVERED') {
    return {
      actionVerdict: 'BLOCK',
      reasonCode: 'ALREADY_SUCCESSFUL',
      isRecoverable: false
    };
  }

  // 2. Suspected Fraud block
  if (payment.failureCategory === 'FRAUD_SUSPECTED' || (payment.failureCode && payment.failureCode.includes('FRAUD'))) {
    return {
      actionVerdict: 'BLOCK',
      reasonCode: 'FRAUD_SUSPECTED_BLOCK',
      isRecoverable: false
    };
  }

  // 3. Attempt Limit Exhaustion
  const attempts = recoveryCase.attemptCount ?? 0;
  if (attempts >= policy.maxAttempts) {
    return {
      actionVerdict: 'BLOCK',
      reasonCode: 'RETRY_LIMIT_EXCEEDED',
      isRecoverable: false
    };
  }

  // 4. High-Value Human Approval Gate
  if (payment.amount > policy.approvalThresholdPaise) {
    return {
      actionVerdict: 'REQUIRE_APPROVAL',
      reasonCode: 'HIGH_VALUE_TRANSACTION',
      isRecoverable: true
    };
  }

  // 5. Default Auto Execution Pass
  return {
    actionVerdict: 'AUTO_EXECUTE',
    reasonCode: 'WITHIN_POLICY',
    isRecoverable: true
  };
}

/**
 * Deterministically computes estimated recovery probability for a single case.
 */
export function computeCaseRecoveryProbability(payment, recoveryCase, policy, actionVerdict) {
  if (actionVerdict === 'BLOCK') {
    return 0.0;
  }

  const category = payment.failureCategory || 'UNKNOWN';
  const baseProb = CATEGORY_BASE_PROBABILITIES[category] ?? 0.40;

  // Blend with empirical case recoverability score if available
  let probability = recoveryCase.recoverabilityScore !== null && recoveryCase.recoverabilityScore !== undefined
    ? (baseProb * 0.35) + (recoveryCase.recoverabilityScore * 0.65)
    : baseProb;

  // Cooldown / Retry Delay factor
  // Shorter cooldowns capture fresh payment intent; longer delays suffer customer disengagement
  const delay = policy.retryDelayMinutes ?? 15;
  if (delay <= 15) {
    probability += 0.06;
  } else if (delay <= 30) {
    probability += 0.02;
  } else if (delay <= 60) {
    probability -= 0.03;
  } else {
    probability -= 0.08;
  }

  // Attempt headroom factor
  const currentAttempts = recoveryCase.attemptCount ?? 0;
  const attemptsLeft = Math.max(0, policy.maxAttempts - currentAttempts);
  if (attemptsLeft > 1) {
    probability += 0.04;
  }

  // Strategy suitability boost
  const selectedStrategy = policy.strategy || 'ALL_ELIGIBLE';
  if (selectedStrategy === 'SEND_PAYMENT_REMINDER' && ['AUTHENTICATION_FAILED', 'CUSTOMER_ABANDONED'].includes(category)) {
    // Payment links drastically improve recovery for customer-side 3DS drop-offs
    probability += 0.10;
  } else if (selectedStrategy === 'RETRY_PAYMENT' && ['TEMPORARY_NETWORK', 'BANK_DOWNTIME'].includes(category)) {
    probability += 0.07;
  }

  // Manual Review operational latency penalty (friction from turnaround delay)
  if (actionVerdict === 'REQUIRE_APPROVAL') {
    probability -= 0.08;
  }

  // Bound deterministically between 0.05 and 0.96
  return Math.min(0.96, Math.max(0.05, Math.round(probability * 1000) / 1000));
}

/**
 * Generates transparent, deterministic operational explanations for simulation changes.
 */
export function generateSimulationExplanations({
  currentPolicy,
  proposedPolicy,
  currentMetrics,
  proposedMetrics,
  deltas
}) {
  const insights = [];

  // 1. Approval Threshold Driver
  if (proposedPolicy.approvalThresholdPaise !== currentPolicy.approvalThresholdPaise) {
    const currentINR = (currentPolicy.approvalThresholdPaise / 100).toLocaleString('en-IN');
    const proposedINR = (proposedPolicy.approvalThresholdPaise / 100).toLocaleString('en-IN');
    if (proposedPolicy.approvalThresholdPaise > currentPolicy.approvalThresholdPaise) {
      insights.push(
        `Approval threshold increased from ₹${currentINR} to ₹${proposedINR}: shifted ${Math.abs(deltas.humanReviewsDelta)} transactions from human queue to instant auto-execution, removing manual turnaround latency.`
      );
    } else {
      insights.push(
        `Approval threshold reduced from ₹${currentINR} to ₹${proposedINR}: channeled ${Math.abs(deltas.humanReviewsDelta)} additional high-value transactions to mandatory human review for risk mitigation.`
      );
    }
  }

  // 2. Retry Attempt Cap Driver
  if (proposedPolicy.maxAttempts !== currentPolicy.maxAttempts) {
    if (proposedPolicy.maxAttempts > currentPolicy.maxAttempts) {
      insights.push(
        `Attempt limit raised from ${currentPolicy.maxAttempts} to ${proposedPolicy.maxAttempts}: unlocked ${Math.abs(deltas.blockedActionsDelta)} previously exhausted cases for additional recovery opportunities.`
      );
    } else {
      insights.push(
        `Attempt limit lowered from ${currentPolicy.maxAttempts} to ${proposedPolicy.maxAttempts}: curtailed subsequent retry attempts on ${Math.abs(deltas.blockedActionsDelta)} cases to guard against cardholder friction.`
      );
    }
  }

  // 3. Retry Cooldown Window Driver
  if (proposedPolicy.retryDelayMinutes !== currentPolicy.cooldownPeriodMinutes) {
    if (proposedPolicy.retryDelayMinutes < currentPolicy.cooldownPeriodMinutes) {
      insights.push(
        `Earlier retry window (${proposedPolicy.retryDelayMinutes}m vs ${currentPolicy.cooldownPeriodMinutes}m): engages customers and bank switches while session intent remains active.`
      );
    } else {
      insights.push(
        `Extended cooldown window (${proposedPolicy.retryDelayMinutes}m vs ${currentPolicy.cooldownPeriodMinutes}m): allows longer bank switch downtime recovery before dispatching retries.`
      );
    }
  }

  // 4. Strategy Driver
  if (proposedPolicy.strategy && proposedPolicy.strategy !== 'ALL_ELIGIBLE') {
    insights.push(
      `Focused recovery strategy set to '${proposedPolicy.strategy.replace(/_/g, ' ')}' for targeted failure channel mitigation.`
    );
  }

  // Default fallback if parameters match closely
  if (insights.length === 0) {
    insights.push(
      `Proposed parameters closely mirror active policy baseline with stable recovery conversion projected at ${proposedMetrics.projectedRecoveryRate}%.`
    );
  }

  return insights;
}
