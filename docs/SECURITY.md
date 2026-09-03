# RecoverAI — Security & Compliance Architecture

## 1. Threat Model & Security Posture

RecoverAI operates at the intersection of external payment gateways, LLMs, and merchant operational controls. The threat model accounts for:
- Webhook spoofing & replay attacks
- Unauthorized triggering of financial recovery actions
- Prompt injection / LLM manipulation attempts
- Floating-point currency truncation exploits
- Stolen credential / token compromise

---

## 2. Security Controls

### 2.1 Webhook Verification & Replay Protection
- Razorpay webhooks are verified using cryptographic HMAC-SHA256 signatures (`crypto.createHmac('sha256', secret)`).
- Webhook payloads use the raw body buffer to compute signatures prior to JSON parsing.
- Unique webhook event IDs (`event.id`) are indexed and recorded in an idempotency cache. Duplicate webhook deliveries are acknowledged with `200 OK` and immediately dropped without re-executing actions.

### 2.2 Strict AI Isolation
- The AI Provider has no access to the Razorpay integration layer or private payment credentials.
- Prompts use sanitized data; customer PII (credit card PANs, CVVs, passwords, full billing addresses) is strictly excluded.
- Output from the LLM is treated as untrusted user input and strictly parsed through a rigid Zod schema with explicit enums.

### 2.3 Deterministic Action Gating & Idempotency
- No financial or gateway mutation can occur directly from a route handler or AI recommendation.
- Every recovery action is assigned a compound idempotency key: `hash(paymentId + actionType + attemptNumber)`.
- The database enforces a compound unique index on these fields to prevent concurrent double-execution races.

### 2.4 Authentication & RBAC
- JWTs are signed using HMAC SHA-256 with strong secrets (`JWT_SECRET`) and issued in secure, HTTP-only, SameSite cookies or explicit Bearer headers.
- Passwords are encrypted using salted bcrypt hashing (cost factor 10).
- Role-Based Access Control (RBAC):
  - `ADMIN`: Full configuration, policy updates, action overrides, approvals.
  - `OPS_MANAGER`: Trigger analysis, submit approvals, view analytics.
  - `VIEWER`: Read-only access to dashboard, payments, and audit logs.

### 2.5 Input Validation & Rate Limiting
- All incoming REST payloads are validated using Zod schemas; excess or unexpected parameters are stripped.
- API endpoints are protected with `express-rate-limit` (e.g. 100 requests per 15 minutes per IP; sensitive endpoints like `/api/auth/login` capped at 10 requests per 15 minutes).

### 2.6 Security Headers & CORS
- Enforces strict HTTP security headers using `helmet`.
- Restricts Cross-Origin Resource Sharing (CORS) to the explicit merchant console origin (`CLIENT_URL`).

---

## 3. Known Limitations & Buildathon Disclosures

- **Test Mode Gateway:** In test mode, actual card debits are simulated or generated via Razorpay Test Payment Links because RBI AFA/2FA regulations require consumer-present OTP for card-on-file debits outside authorized e-mandates.
- **Key Rotation:** Secret rotation workflows are managed via environment variables; an enterprise HSM / KMS integration is recommended for production scale.
