# ADR-003: Deterministic Policy Engine and Action Gate

## Status
Accepted

## Context
When an AI agent recommends a recovery action (e.g. `RETRY_PAYMENT` or `SEND_PAYMENT_REMINDER`), executing that recommendation unconditionally risks severe financial and regulatory hazards:
- Retrying an already captured payment (double debit)
- Exceeding card network retry velocity limits (causing card blocking or merchant fines)
- Retrying during active bank outages or within cooldown windows
- Auto-executing high-value transactions without human merchant oversight
- Duplicate execution caused by network re-deliveries or concurrent webhook replays

## Decision
We implement a **Deterministic Policy Engine** and a mandatory **Action Gate** between the AI recommendation layer and external gateway execution:
1. **Zero-LLM Logic:** The Policy Engine is 100% deterministic code with unit-tested rule sets.
2. **Three-State Verdict:** Evaluates the payment context and AI recommendation into:
   - `ALLOW`: Permitted to execute automatically.
   - `REQUIRE_APPROVAL`: High-risk or high-value; enqueued in human-in-the-loop review.
   - `BLOCK`: Violates safety constraints; immediately terminated with reason code.
3. **Action Gate Enforcement:** Every action must pass through `ActionGate.validateAndAuthorize()`:
   - Verifies state transitions (e.g., cannot recover a captured transaction).
   - Generates and verifies compound idempotency keys (`paymentId + actionType + attemptNumber`).
   - Verifies merchant-configured limits (`AUTO_ACTION_MAX_AMOUNT_PAISE`, `MAX_RECOVERY_ATTEMPTS`, `COOLDOWN_PERIOD_MINUTES`).

## Alternatives Considered
1. **Inline Controller Checks:**
   - *Rejected:* Scattered if-statements across routes or controllers lead to inconsistent policy enforcement, missing audit logs, and security vulnerabilities.
2. **External Rule Engine (Drools/json-rules-engine):**
   - *Rejected:* Adds unnecessary engine complexity and runtime overhead for an MVP without clear benefit over clean, functional, testable TypeScript/JavaScript rule pipelines.

## Consequences
- **Positive:**
  - Complete control: Every action is provably vetted against merchant safety rules.
  - Defense in depth: Even if an AI recommendation is flawed, the policy engine blocks hazardous actions.
  - Idempotency guarantees: Concurrent or duplicate triggers result in zero duplicate actions.
- **Negative:**
  - Adding new recovery strategies requires updating both the action vocabulary and policy rule matrix.
