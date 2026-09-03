# ADR-002: Strict Isolation of the AI Boundary

## Status
Accepted

## Context
Large Language Models (LLMs) excel at qualitative reasoning: contextual error classification, interpreting unstructured error strings from upstream banks, assessing recovery feasibility, and drafting personalized recovery communications. However, LLMs are fundamentally non-deterministic and susceptible to:
- Prompt injections / jailbreaks
- Hallucinated financial parameters or arbitrary API commands
- Stochastic decision drift across calls
- Latency spikes and upstream provider outages

In a financial system, granting an LLM direct invocation rights over external payment gateways (e.g. Razorpay API) or financial state transitions is an unacceptable security and operational hazard.

## Decision
We enforce a strict engineering principle:
> **AI recommends. Deterministic systems authorize and execute.**

Key architectural constraints:
1. **Zero Gateway Access:** The AI service layer has no credentials, network access, or client dependencies for the Razorpay API.
2. **Strict Structured Output:** The AI produces only structured JSON adhering to a rigid Zod schema (`recommendedStrategy`, `confidence`, `priority`, `reason`, `contextualSignals`). Arbitrary model commands are discarded.
3. **Validated Vocabulary:** Strategies are constrained to a predefined enum (`RETRY_PAYMENT`, `SEND_PAYMENT_REMINDER`, `CREATE_RECOVERY_CASE`, `ESCALATE_TO_MERCHANT`, `MARK_UNRECOVERABLE`, `REQUEST_HUMAN_APPROVAL`).
4. **Resilient Fallback:** If the LLM call times out (over 4s), fails, or produces schema violations, the system logs `AI_ANALYSIS_FAILED` to the audit trail and seamlessly invokes a deterministic rule classifier, routing uncertain cases to human approval.

## Alternatives Considered
1. **Autonomous ReAct Agent with Tool-Calling to Razorpay API:**
   - *Rejected:* Giving an LLM direct tool access to refund, retry, or generate payment links without deterministic policy verification violates financial safety standards and invites catastrophic loop execution.
2. **Purely Rule-Based Recovery without LLM:**
   - *Rejected:* Misses contextual nuances in bank failure messages, customer history, and dynamic recovery prioritization.

## Consequences
- **Positive:**
  - Guaranteed financial safety: No hallucinated API calls can ever reach Razorpay.
  - Provable auditability: Every AI recommendation is recorded verbatim alongside validation status before entering the policy engine.
  - Zero downtime: If the AI provider is unavailable, RecoverAI falls back to rule-based classification without crashing.
- **Negative:**
  - Requires maintaining and validating Zod schemas and fallback classifiers alongside the AI prompt.
