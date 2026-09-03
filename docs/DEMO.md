# RecoverAI — 5-Minute Pitch Runbook & Demo Guide

## Pitch Overview

| Time Interval | Section | Focus & Demonstration |
| :--- | :--- | :--- |
| **0:00 – 0:30** | **The Problem** | Why treating all failed payments equally destroys revenue and customer trust. |
| **0:30 – 1:15** | **Merchant Console** | High-density dashboard: Total Failed GMV, Recoverable GMV, Recovery Rate (%). |
| **1:15 – 2:15** | **AI Recovery Case** | Deep dive into a real case: Payment context, AI recommendation, confidence meter, policy gate check. |
| **2:15 – 3:15** | **Action Execution** | Permitted action execution through the Policy Engine & Idempotency Gate; instant audit log emission. |
| **3:15 – 4:15** | **Controlled Failure** | Live trigger of AI outage or Gateway failure: Graceful fallback, zero crashes, safe human routing. |
| **4:15 – 5:00** | **Architecture & Impact** | Modular monolith design, strict AI isolation, financial math, measurable recovery metrics. |

---

## Step-by-Step Demonstration Runbook

### Scene 1: The Problem (0:00 - 0:30)
**Speaker Script:**
> "In online commerce, 15% to 30% of all payment failures are completely recoverable. Yet most merchants make one of two critical mistakes: they either blindly retry every single failure—burning gateway fees and triggering card fraud flags—or they abandon failed payments entirely, bleeding hundreds of thousands of rupees in revenue.
>
> RecoverAI solves this with a strict engineering principle: **AI recommends; deterministic systems authorize and execute.**"

---

### Scene 2: The Merchant Console (0:30 - 1:15)
1. Navigate to `http://localhost:5173` (Logged in as `admin@recoverai.local`).
2. Point to the **Top Metric Ribbon**:
   - **Total Failed Volume:** ₹4,85,000 across 42 transactions.
   - **Recoverable Opportunity:** ₹3,12,000 (64.3%).
   - **Recovered to Date:** ₹1,88,500 (60.4% conversion).
   - **Pending Approvals:** 3 critical cases awaiting review.
3. Show the **Recovery Trends Chart** and **Failure Category Breakdown** (Transient Network vs. Insufficient Funds vs. Authentication Drop-offs).

---

### Scene 3: Deep AI Recovery Case Analysis (1:15 - 2:15)
1. Open the **Recovery Queue** tab.
2. Select **Case A: `REC-2026-90412`** (Amount: ₹4,500, Failure: `GATEWAY_ERROR`).
3. Show the **Payment Context Panel**: Customer HDFC card, 1 attempt, transient timeout.
4. Highlight the **AI Decision Card**:
   - Strategy: `RETRY_PAYMENT`
   - Confidence Score: `0.92` (High)
   - Decision Rationale: *"Failure pattern indicates temporary gateway timeout during issuer communication. No prior customer decline recorded."*
5. Show the **Visual Policy Gate Pipeline**:
   - Payment State: Not yet captured (PASS)
   - Retry Count: 1/3 (PASS)
   - Value Threshold: ₹4,500 <= ₹5,000 auto-limit (PASS)
   - Decision: **ALLOW** (`WITHIN_RECOVERY_POLICY`)

---

### Scene 4: Action Execution & Audit Ledger (2:15 - 3:15)
1. On Case A, click **"Execute Recovery Action"**.
2. Point out what happens behind the scenes:
   - Action Gate checks compound idempotency key.
   - Razorpay Test Client is invoked.
   - Recovery case transitions to `RECOVERED`.
3. Scroll to the **Immutable Audit Trail**:
   - `PAYMENT_FAILED` -> `AI_ANALYSIS_COMPLETED` -> `POLICY_EVALUATED` -> `ACTION_EXECUTED` -> `RECOVERY_SUCCEEDED`.
   - Highlight the correlation trace ID `req_c92...` stamped across all records.

---

### Scene 5: Controlled Failure & Fallback Resilience (3:15 - 4:15)
1. Open the floating **"Demo Simulator Drawer"** (bottom right).
2. Click **"Trigger AI Provider Outage (Case D)"**.
3. Observe the system response live in the console:
   - System catches the simulated 500 error / timeout from the AI endpoint.
   - The app does **not** crash or freeze.
   - Audit trail registers `AI_ANALYSIS_FAILED (Provider unavailable)`.
   - Fallback Deterministic Classifier activates immediately.
   - Because AI is unavailable, Policy Rule `POL-006` deterministically forces **`REQUIRE_APPROVAL`**.
4. Navigate to the **Approvals** screen:
   - The case is safely queued for human review with risk badge *"Fallback Policy Applied"*.
   - Click **"Approve"** with notes *"Verified with customer"*.

---

### Scene 6: Architecture & Impact Summary (4:15 - 5:00)
1. Show the **Architecture Blueprint** in the Documentation tab:
   - Point out that the LLM is physically isolated from the Razorpay API.
   - Emphasize that all monetary math is integer paise—zero floating point drift.
2. Closing statement:
   > "RecoverAI is not a wrapper or a chatbot. It is a robust, auditable financial operations engine that protects merchant revenue while strictly safeguarding financial compliance."
