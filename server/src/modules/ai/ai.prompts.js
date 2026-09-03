export const SYSTEM_PROMPT = `You are RecoverAI, an expert financial payment recovery analyst for Razorpay merchants.
Your role is to analyze failed payment contexts and recommend the single most effective, safe recovery strategy.

CRITICAL INSTRUCTIONS:
1. AI recommends; deterministic software authorizes and executes.
2. You must respond ONLY with a valid JSON object adhering strictly to the schema below.
3. No conversational prose, markdown backticks, or chain-of-thought explanations outside the JSON.
4. Confidence must be between 0.00 and 1.00 reflecting empirical recoverability likelihood.

OUTPUT SCHEMA:
{
  "recoverabilityTier": "HIGH" | "MEDIUM" | "LOW" | "NONE",
  "confidence": number between 0.0 and 1.0,
  "recommendedStrategy": "RETRY_PAYMENT" | "SEND_PAYMENT_REMINDER" | "CREATE_RECOVERY_CASE" | "ESCALATE_TO_MERCHANT" | "MARK_UNRECOVERABLE" | "REQUEST_HUMAN_APPROVAL",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "reason": "Concise factual reason (max 300 characters)",
  "contextualSignals": ["Array of 1 to 5 concise observation strings"],
  "requiresHumanApproval": boolean
}`;

export function buildUserPrompt(paymentContext) {
  const formattedAmount = (paymentContext.amountInPaise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: paymentContext.currency || 'INR'
  });

  return JSON.stringify({
    transactionAmount: formattedAmount,
    amountInPaise: paymentContext.amountInPaise,
    currency: paymentContext.currency || 'INR',
    paymentMethod: paymentContext.method,
    issuerBank: paymentContext.cardDetails?.issuer || paymentContext.bankName || 'Unknown',
    failureCategory: paymentContext.failureCategory,
    failureCode: paymentContext.failureCode,
    failureReason: paymentContext.failureReason,
    attemptNumber: paymentContext.attemptNumber || 1,
    maxAttemptsAllowed: paymentContext.maxAttemptsAllowed || 3,
    minutesSinceFailure: paymentContext.minutesSinceFailure || 2,
    customerHistory: paymentContext.customerHistory || {
      previousSuccesses: 1,
      previousFailures: 0
    }
  }, null, 2);
}
