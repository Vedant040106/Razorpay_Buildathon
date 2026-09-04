# RecoverAI — 5-Minute Pitch Runbook & Demo Guide

## Pitch Overview

| Time Interval | Section | Focus & Demonstration |
| :--- | :--- | :--- |
| **0:00 – 0:30** | **The Problem** | Why treating all failed payments equally destroys revenue and customer trust. |
| **0:30 – 1:15** | **Recovery Command Center** | Live orchestration pipeline (8 stages), real-time KPIs, multi-dimensional failure intelligence. |
| **1:15 – 2:00** | **Recovery Lab Sandbox** | Zero-mutation policy experimentation, real-time projections, and formal governance proposals. |
| **2:00 – 3:00** | **8-Stage Recovery Timeline** | Deep dive into a real case: AI recommendations separated from deterministic policy/idempotency gates. |
| **3:00 – 3:45** | **Action Execution** | Permitted action execution through the Policy Engine & Idempotency Gate; instant audit log emission. |
| **3:45 – 4:30** | **Controlled Failure** | Live trigger of AI outage or Gateway failure: Graceful fallback, zero crashes, safe human routing. |
| **4:30 – 5:00** | **Architecture & Impact** | Modular monolith design, strict AI isolation, financial math, measurable recovery metrics. |

---

## Step-by-Step Demonstration Runbook

### Scene 1: The Problem (0:00 - 0:30)
**Speaker Script:**
> "In online commerce, 15% to 30% of all payment failures are completely recoverable. Yet most merchants make one of two critical mistakes: they either blindly retry every single failure—burning gateway fees and triggering card fraud flags—or they abandon failed payments entirely, bleeding hundreds of thousands of rupees in revenue.
>
> RecoverAI solves this with a strict engineering principle: **AI recommends; deterministic systems authorize and execute.**"

---

### Scene 2: Recovery Command Center (0:30 - 1:15)
1. Navigate to `/recovery/command-center` (or click **Command Center** in the navbar).
2. Point out the **Live Orchestration Funnel**:
   - Interactive 8-stage visualization from Payment Ingestion to Audit Ledger Persistence.
   - Click each node to show stage authority rules (e.g. AI is advisory, Policy Engine is authoritative).
3. Showcase the **8 Deterministic KPI Cards**:
   - Gross Failed GMV vs Recovered GMV in paise precision.
   - Active Recovery Yield (%) and In-Flight Recoverable Volume.
   - Idempotency Gate Blocks (0 double-charges guaranteed).
4. Highlight the **Multi-Dimensional Failure Intelligence Matrix**:
   - Failure categories (Bank Downtime vs Network Timeout vs Customer Drop-off) with empirical recovery success rates.
   - Payment method breakdown (UPI, Cards, Netbanking).

---

### Scene 3: Recovery Lab Policy Sandbox (1:15 - 2:00)
1. Navigate to `/recovery/lab` (or click **Recovery Lab** in the navbar).
2. Emphasize the **Persistent Zero-Mutation Safety Banner**:
   > *"Simulation complete. No payments were modified. No recovery actions were executed. No Razorpay API mutation was performed."*
3. Adjust policy controls interactively:
   - Increase Cooldown Window from 15 mins to 30 mins (allowing banking switch downtime to resolve).
   - Increase Max Attempts from 3 to 4.
   - Set Strategy Focus to `BALANCED`.
4. Point out the **Real-Time Financial Projections**:
   - Projected Recovery Rate change (e.g. +4.2% lift).
   - Incremental Recovered Volume (₹54,000 delta).
   - Approval Queue friction shift.
5. Click **"Submit Policy Proposal"** to demonstrate formal governance:
   - Enter proposal rationale and create reviewable proposal (`PROP-2026-XXXXX`).
   - Show proposal in the governance review ledger.

---

### Scene 4: 8-Stage Recovery Decision Timeline (2:00 - 3:00)
1. Open **Recovery Queue** (`/recovery`) and select **Case `REC-2026-90412`** (Amount: ₹4,500).
2. Highlight the full **8-Stage Decision Timeline**:
   - **Stage 1 & 2**: Payment Failed & Failure Classified (Deterministic).
   - **Stage 3**: AI Advisory Recommendation (Gemini 1.5 Pro / Fallback, Confidence 0.92, Strategy `RETRY_PAYMENT`).
   - **Stage 4**: Deterministic Policy Gate (Rules `POL-001` through `POL-004` evaluated).
   - **Stage 5**: Idempotency Check (SHA-256 Lock Key generated).
   - **Stage 6 & 7**: Recovery Action Dispatched & Execution Outcome Verified.
   - **Stage 8**: Audit Recorded (Cryptographically chained to previous event).
3. Expand stage telemetry payloads to demonstrate full transparency.

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
