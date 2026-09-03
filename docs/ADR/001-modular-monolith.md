# ADR-001: Modular Monolith Architecture

## Status
Accepted

## Context
RecoverAI is a mission-critical revenue recovery platform built for the Razorpay AI Buildathon. The platform coordinates payment ingestion, failure classification, AI-driven recovery recommendations, deterministic policy evaluation, action execution against Razorpay test APIs, approvals, analytics, and immutable audit logging.

When architecting distributed financial systems, there is often an urge to decompose early into microservices (e.g., separate Payment Service, AI Service, Policy Service, Audit Service). However, premature microservice decomposition introduces:
- Distributed transaction complexity (two-phase commits / saga orchestration for payment states)
- Network latency overhead between AI analysis and policy enforcement
- Operational overhead (multiple deployments, service discovery, cross-service tracing)
- Inability to evaluate the entire system smoothly on an evaluator's local machine

## Decision
We chose a **Modular Monolith** architecture implemented in Node.js / Express:
- Clear domain module boundaries (`auth`, `payments`, `recovery`, `ai`, `policy`, `actions`, `approvals`, `audit`, `analytics`, `webhooks`).
- Strict layering: Route -> Controller -> Service -> Integration / Model.
- In-process domain calls with well-defined interfaces and zero cross-module circular dependencies.
- Shared transactional database (MongoDB) with module-specific models and bounded contexts.

## Alternatives Considered
1. **Microservices with Event Bus (Kafka/RabbitMQ):**
   - *Rejected:* High operational burden for the MVP, complex failure modes during demo/testing, latency penalty for synchronous policy gates.
2. **Standard Unstructured Monolith (MVC / "Fat Controllers"):**
   - *Rejected:* Mixes business logic into routes, makes the critical boundary between AI recommendations and policy enforcement blurry and untestable.

## Consequences
- **Positive:**
  - Extremely fast local setup and testing for judges and developers.
  - ACID guarantees within MongoDB sessions for state transitions and audit logging.
  - Strong encapsulation ensures any module (e.g., `ai` or `actions`) can be extracted into an independent microservice if scale demands it in the future.
- **Negative:**
  - Requires continuous discipline to prevent developers from bypassing service layers or creating leaky domain boundaries.
