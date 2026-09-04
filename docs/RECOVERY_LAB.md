# RecoverAI — Recovery Lab & Policy Governance Engine

## 1. Overview & Objective

The **Recovery Lab** (`/recovery/lab`) is RecoverAI's policy simulation sandbox and change governance engine. It solves a fundamental problem in AI-driven fintech: **How do risk and finance teams safely optimize automated recovery thresholds without gambling real transaction volume or customer goodwill?**

Recovery Lab allows merchants to simulate adjustments to recovery policies against their real historical failed-payment dataset under an ironclad **Zero-Mutation Guarantee**.

### Governance Lifecycle

```mermaid
flowchart LR
    A[Simulation Sandbox\n(Read-Only Dataset)] --> B[Policy Proposal\n(PROP-2026-XXXXX)]
    B --> C[Merchant / Risk Review\n(Audit Ledger)]
    C -->|Rejection| D[Archived / Rejected]
    C -->|Approval| E[Production Policy Deployment\n(Zero-Downtime Hot Swap)]
```

---

## 2. The Zero-Mutation Guarantee

> **Safety Invariance:** No simulation scenario can create orders, issue Razorpay refunds or payment links, mutate payment records, alter recovery cases, or fire outbound webhooks.

### Technical Enforcement
1. **Query Isolation**: The simulation service queries existing payment and recovery records using `.lean()` projections.
2. **Pure Mathematical Evaluation**: The simulation rules are implemented as pure, side-effect-free functions (`simulationRules.js`) that produce in-memory results without writing to `RecoveryCase`, `Payment`, or `RecoveryAction` collections.
3. **Audit Isolation**: Simulation runs do not generate execution audit logs. Only formal proposal creation (`POLICY_PROPOSAL_CREATED`) and approval actions (`POLICY_PROPOSAL_APPROVED`) create cryptographic audit records in the immutable ledger.
4. **Safety Header**: Every simulation payload returned by the API includes the verified safety statement:
   ```json
   {
     "safetyStatement": "Simulation complete. No payments were modified. No recovery actions were executed. No Razorpay API mutation was performed."
   }
   ```

---

## 3. Simulation Parameters & Constraints

Merchants can tune four key policy levers within bounded, validated ranges:

| Parameter | Type | Valid Range | Default | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `cooldownMinutes` | Integer | `5` – `180` mins | `15` | Minimum delay between automated retries to let banking downtime resolve |
| `maxRetryAttempts` | Integer | `1` – `10` attempts | `3` | Maximum automated recovery attempts before declaring unrecoverable |
| `approvalValueThresholdPaise` | Integer | `100` – `50,000,000` (₹1 – ₹5,00,000) | `500,000` (₹5,000) | Threshold above which recoveries require explicit human clearance |
| `strategyFocus` | Enum | `BALANCED`, `AGGRESSIVE`, `CONSERVATIVE` | `BALANCED` | Strategic bias weighting recovery yield vs customer friction |

---

## 4. Mathematical Simulation Model

The simulation engine evaluates each historical failed payment against both the **Current Production Policy** and the **Proposed Policy** using a deterministic mathematical pipeline:

### 4.1 Cooldown Window Yield Multiplier ($M_{\text{cooldown}}$)
Bank downtime and customer network timeouts require adequate recovery breathing room. Retrying too early hits persisting network degradation:
$$M_{\text{cooldown}} = \begin{cases} 
0.82 + \left(\frac{c - 5}{10}\right) \times 0.08 & \text{if } c < 15 \\
0.90 + \left(\frac{c - 15}{45}\right) \times 0.10 & \text{if } 15 \le c \le 60 \\
1.00 - \left(\frac{c - 60}{120}\right) \times 0.07 & \text{if } c > 60 \text{ (customer churn decay)}
\end{cases}$$

### 4.2 Attempt Cap Sensitivity ($M_{\text{attempts}}$)
Higher attempts catch marginal transient failures but yield diminishing returns and risk issuing excessive payment reminders:
$$M_{\text{attempts}} = \begin{cases}
0.72 & \text{if } a = 1 \\
0.88 & \text{if } a = 2 \\
1.00 & \text{if } a = 3 \\
1.00 + (a - 3) \times 0.035 & \text{if } a > 3 \text{ (capped at } 1.14\text{)}
\end{cases}$$

### 4.3 High-Value Threshold Gate ($T_{\text{approval}}$)
Payments with `amount > approvalValueThresholdPaise` are routed to the **Human Approval Queue** rather than direct autonomous dispatch:
$$\text{RequiresApproval} = (\text{Amount} \ge T_{\text{approval}})$$

When human review is required, autonomous recovery friction introduces a 6% decay factor due to human review latency, but eliminates false-positive recovery risks on high-value orders.

### 4.4 Strategy Bias Vector ($W_{\text{strategy}}$)
- **`CONSERVATIVE`**: Prioritizes zero false positives. Downweights high-risk failure categories (e.g., `RISK_REJECTED`, `AUTHENTICATION_ERROR`), favors `SMART_RETRY` and customer-assisted links, reduces velocity friction by 12%.
- **`BALANCED`**: Standard distribution across retry scheduling, dynamic routing, and payment link delivery.
- **`AGGRESSIVE`**: Prioritizes gross recovered volume. Upweights multi-attempt recovery by 8%, increases recovery probability for soft declines, routes more transactions through immediate alternative payment method links.

### 4.5 Projected Financial Metrics
For all $N$ historical failed payments:
$$\text{ProjectedRecoveredVolume} = \sum_{i=1}^N \text{Amount}_i \times P_{\text{recovery}}(i) \times \mathbb{I}(\text{Allow}_i)$$
$$\text{OverallRecoveryRate} = \frac{\text{ProjectedRecoveredVolume}}{\text{TotalFailedVolume}}$$

---

## 5. Formal Policy Proposal Specification

When a merchant identifies an optimal policy configuration in the Lab, they can submit a formal **Policy Proposal**.

### Proposal Data Model (`policy_proposals`)
```javascript
{
  proposalId: "PROP-2026-89412",
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ACTIVATED",
  proposedPolicy: {
    cooldownMinutes: 30,
    maxRetryAttempts: 4,
    approvalValueThresholdPaise: 1000000, // ₹10,000
    strategyFocus: "BALANCED"
  },
  baselineMetrics: {
    recoveryRate: 0.624,
    recoveredVolumePaise: 48200000,
    requiresApprovalCount: 14
  },
  projectedMetrics: {
    recoveryRate: 0.689,
    recoveredVolumePaise: 53200000,
    requiresApprovalCount: 8,
    projectedDeltaPaise: 5000000
  },
  rationale: "Increase cooldown to 30m to account for UPI switch peak-hour latency.",
  proposedBy: ObjectId,
  reviewedBy: ObjectId,
  reviewedAt: ISODate,
  createdAt: ISODate
}
```

---

## 6. REST API Endpoints

### 1. `GET /api/recovery-lab/current-policy`
Returns active merchant recovery policy constraints.

### 2. `POST /api/recovery-lab/simulate`
Executes pure in-memory simulation against historical payments.
- **Request Body**:
  ```json
  {
    "cooldownMinutes": 25,
    "maxRetryAttempts": 4,
    "approvalValueThresholdPaise": 750000,
    "strategyFocus": "BALANCED"
  }
  ```
- **Response**: Full simulation comparison, projected deltas, explainability points, and safety guarantee statement.

### 3. `POST /api/recovery-lab/propose`
Submits simulated policy as a formal reviewable proposal.

### 4. `GET /api/recovery-lab/proposals`
Lists proposal history with statuses, authors, and projected impacts.

### 5. `POST /api/recovery-lab/proposals/:proposalId/approve`
Approves proposal and transitions to activation stage.

### 6. `POST /api/recovery-lab/proposals/:proposalId/reject`
Rejects proposal with audit review comment.
