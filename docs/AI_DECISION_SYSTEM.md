# RecoverAI — AI Decision System Specification

## 1. Core Engineering Principle

> **AI recommends; deterministic controls authorize and execute.**

In RecoverAI, the Artificial Intelligence model functions strictly as an advisory analyst. It is never granted direct execution privileges, never interacts directly with the Razorpay API, and cannot unilaterally alter financial states.

---

## 2. Why AI Is Required vs. Where Deterministic Software Is Better

### Where AI Adds Tangible Value:
- **Unstructured Gateway Error Interpretation:** Upstream bank and gateway error codes often return obscure strings (e.g. `"U30 - Transaction declined by customer bank"`, `"DECLINED_BY_ISSUER_RESTRICTED"`). An LLM interprets contextual patterns and customer history to categorize whether this is a permanent rejection (e.g., account frozen, stolen card) or a transient issue (temporary bank downtime, UPI server busy).
- **Multi-Signal Context Synthesis:** Combines transaction amount, customer attempt frequency, time elapsed, and payment instrument (Card vs. UPI vs. Netbanking) into a unified recovery assessment.
- **Adaptive Recovery Strategy Selection:** Recommends the optimal recovery approach (e.g. automated retry vs. smart payment link reminder vs. escalation to merchant) with prioritized urgency.
- **Human-Readable Operator Explanations:** Generates concise, auditable decision rationales for merchant finance operators.

### Where AI Is Strictly Forbidden (Deterministic Systems Rule):
- **Authorization & Permission Checks:** Whether an action is permissible is evaluated exclusively by deterministic policy code.
- **Financial Calculations:** Fee calculations, currency conversions, and retry cost/benefit equations use integer mathematics, never model generation.
- **Retry Velocity & Limits:** Hard caps on retry counts and cooldown windows are enforced deterministically.
- **API Call Execution:** Actual communication with Razorpay or third-party gateways is handled solely by the Action Gate.

---

## 3. Input Context Model

The AI Service extracts and sanitizes a focused context object from the payment and recovery record before invoking the provider:

```json
{
  "paymentId": "pay_O2Kq199s9Dkd",
  "amountInPaise": 450000,
  "amountFormatted": "₹4,500.00",
  "currency": "INR",
  "method": "card",
  "bankName": "HDFC Bank",
  "failureCode": "GATEWAY_ERROR",
  "failureDescription": "Gateway timed out while waiting for issuer response",
  "failureCategory": "TEMPORARY_NETWORK",
  "attemptNumber": 1,
  "maxAttemptsAllowed": 3,
  "minutesSinceFailure": 3,
  "customerHistory": {
    "totalSuccessfulPayments": 4,
    "previousFailuresCount": 0
  }
}
```

*Note: Customer PII (passwords, card numbers, full names, phone numbers) is strictly sanitized and omitted from the prompt.*

---

## 4. Structured Output Schema (Zod Validation)

Every AI response is strictly validated against the following Zod schema:

```javascript
import { z } from 'zod';

export const AIRecommendationSchema = z.object({
  recoverabilityTier: z.enum(['HIGH', 'MEDIUM', 'LOW', 'NONE']),
  confidence: z.number().min(0.0).max(1.0),
  recommendedStrategy: z.enum([
    'RETRY_PAYMENT',
    'SEND_PAYMENT_REMINDER',
    'CREATE_RECOVERY_CASE',
    'ESCALATE_TO_MERCHANT',
    'MARK_UNRECOVERABLE',
    'REQUEST_HUMAN_APPROVAL'
  ]),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  reason: z.string().min(10).max(350),
  contextualSignals: z.array(z.string()).min(1).max(5),
  requiresHumanApproval: z.boolean().default(false)
});
```

Any output that fails this validation is rejected immediately.

---

## 5. Confidence Score Handling

Model confidence is treated as a **decision signal**, not a guaranteed mathematical certainty:

- **High Confidence ($\ge 0.85$):** Passed to the Policy Engine for potential automated execution if all deterministic policy rules pass.
- **Medium Confidence ($0.70 \le \text{confidence} < 0.85$):** Passed to the Policy Engine; automatically routes to human approval if the transaction amount exceeds moderate thresholds.
- **Low Confidence ($< 0.70$):** Deterministically flagged for Human-in-the-Loop approval regardless of amount.
- **Zero Hallucination Tolerance:** If the model returns confidence outside $[0.0, 1.0]$, validation fails and fallback is applied.

---

## 6. Failure Resilience & Fallback Classifier

If the external LLM provider experiences an outage, network timeout (configured to 4000ms), rate limit, or returns malformed/unparseable JSON:

```
[ External LLM Fails / Times out / Schema Rejection ]
                      │
                      ▼
        [ Log AI_ANALYSIS_FAILED to Audit ]
                      │
                      ▼
      [ Invoke DeterministicClassifier ]
                      │
   - Inspects error code deterministically:
     * GATEWAY_ERROR / NETWORK_TIMEOUT -> Strategy: RETRY_PAYMENT (conf: 0.65)
     * AUTHENTICATION_FAILED -> Strategy: SEND_PAYMENT_REMINDER (conf: 0.60)
     * INSUFFICIENT_FUNDS -> Strategy: SEND_PAYMENT_REMINDER (conf: 0.50)
     * FRAUD_SUSPECTED -> Strategy: ESCALATE_TO_MERCHANT (conf: 0.90)
   - Sets requiresHumanApproval: true (Safety First)
                      │
                      ▼
        [ Enter Policy Engine Safely ]
```

**Result:** Zero application crashes. Uninterrupted recovery pipeline operation with zero unauthorized auto-actions.

---

## 7. Operational Transparency & Auditability

RecoverAI stores the complete raw AI response alongside parsed fields and validation status in the `recoveryDecisions` collection. In accordance with responsible financial AI guidelines, hidden chain-of-thought prompts are avoided in favor of concise, auditable decision rationales that human operators can quickly inspect.
