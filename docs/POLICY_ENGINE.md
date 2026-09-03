# RecoverAI — Policy Engine Specification

## 1. Role of the Policy Engine

The Policy Engine is the deterministic decision gatekeeper of RecoverAI. While the AI Layer recommends what *might* work, the Policy Engine strictly evaluates what is **permissible, financially safe, and compliant with merchant risk tolerances**.

Every recovery action must pass through the Policy Engine before entering the Action Gate.

---

## 2. Decision Outcomes

The Policy Engine evaluates inputs and returns a structured verdict:

```typescript
type PolicyDecision = {
  decision: 'ALLOW' | 'REQUIRE_APPROVAL' | 'BLOCK';
  reasonCode: string;
  explanation: string;
  appliedRules: string[];
  evaluatedAt: Date;
};
```

---

## 3. Core Deterministic Rules Matrix

| Rule ID | Rule Name | Condition | Verdict | Reason Code |
| :--- | :--- | :--- | :--- | :--- |
| **POL-001** | Payment Invariance | Payment status is already `CAPTURED`, `AUTHORIZED`, or `RECOVERED` | **BLOCK** | `ALREADY_SUCCESSFUL` |
| **POL-002** | Retry Limit Cap | `attemptCount >= maxAttemptsAllowed` (Default: 3) | **BLOCK** | `RETRY_LIMIT_EXCEEDED` |
| **POL-003** | Cooldown Enforcement | `Date.now() - lastAttemptAt < cooldownPeriodMs` | **BLOCK** | `COOLDOWN_ACTIVE` |
| **POL-004** | High-Value Gate | `amountInPaise > autoActionMaxAmountPaise` (Default: ₹5,000 / 500,000 paise) | **REQUIRE_APPROVAL** | `HIGH_VALUE_TRANSACTION` |
| **POL-005** | Low-Confidence Gate | AI confidence score < `minConfidenceAutoAction` (Default: 0.75) | **REQUIRE_APPROVAL** | `LOW_CONFIDENCE_SCORE` |
| **POL-006** | Fallback Review Gate | Recommendation originated from Fallback Classifier (AI outage) | **REQUIRE_APPROVAL** | `FALLBACK_CLASSIFIER_USED` |
| **POL-007** | High-Value Abandonment | Strategy is `MARK_UNRECOVERABLE` and `amountInPaise > 200000` (₹2,000) | **REQUIRE_APPROVAL** | `HIGH_VALUE_ABANDONMENT_REVIEW` |
| **POL-008** | Fraud Exclusion | Failure category is `FRAUD_SUSPECTED` or error code contains `FRAUD` | **BLOCK** | `FRAUD_SUSPECTED_BLOCK` |
| **POL-009** | Duplicate In-Flight Check | Identical action currently in `EXECUTING` or `PENDING_APPROVAL` status | **BLOCK** | `DUPLICATE_ACTION_IN_FLIGHT` |
| **POL-010** | Default Safety Pass | All checks passed, strategy valid, amount within threshold | **ALLOW** | `WITHIN_RECOVERY_POLICY` |

---

## 4. Configurable Merchant Thresholds

Each merchant can tune specific thresholds via their merchant policy configuration:

```json
{
  "autoActionMaxAmountPaise": 500000,     // ₹5,000.00
  "maxRecoveryAttempts": 3,
  "cooldownPeriodMinutes": 15,
  "minConfidenceAutoAction": 0.75,
  "allowedAutoStrategies": [
    "RETRY_PAYMENT",
    "SEND_PAYMENT_REMINDER"
  ]
}
```

---

## 5. Policy Evaluation Examples

### Example 1: Standard Transient Network Failure (Auto-Allowed)
- **Input:** Amount ₹4,500 (450000 paise), Attempt 1/3, AI confidence 0.92, Strategy `RETRY_PAYMENT`, Error `GATEWAY_ERROR`.
- **Evaluation:**
  - Already successful? No.
  - Retries exceeded? 0 < 3 -> Pass.
  - Cooldown active? First attempt -> Pass.
  - Value > ₹5,000? 4500 <= 5000 -> Pass.
  - Confidence < 0.75? 0.92 >= 0.75 -> Pass.
- **Verdict:**
  ```json
  {
    "decision": "ALLOW",
    "reasonCode": "WITHIN_RECOVERY_POLICY",
    "explanation": "Transaction is within automated recovery amount threshold and meets high confidence criteria."
  }
  ```

### Example 2: High-Value Authentication Failure (Approval Required)
- **Input:** Amount ₹12,000 (1200000 paise), Attempt 1/3, AI confidence 0.82, Strategy `SEND_PAYMENT_REMINDER`.
- **Evaluation:**
  - Already successful? No.
  - Retries exceeded? Pass.
  - Value > ₹5,000? ₹12,000 > ₹5,000 -> **Trigger POL-004**.
- **Verdict:**
  ```json
  {
    "decision": "REQUIRE_APPROVAL",
    "reasonCode": "HIGH_VALUE_TRANSACTION",
    "explanation": "Transaction value of ₹12,000.00 exceeds the automated action threshold of ₹5,000.00. Enqueued for human review."
  }
  ```

### Example 3: Exhausted Retry Cap (Blocked)
- **Input:** Amount ₹1,200, Attempt 3/3, Strategy `RETRY_PAYMENT`.
- **Evaluation:**
  - Retries exceeded? 3 >= 3 -> **Trigger POL-002**.
- **Verdict:**
  ```json
  {
    "decision": "BLOCK",
    "reasonCode": "RETRY_LIMIT_EXCEEDED",
    "explanation": "Recovery attempt limit of 3 attempts reached. Action blocked to prevent card network spam."
  }
  ```
