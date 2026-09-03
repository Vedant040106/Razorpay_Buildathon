# RecoverAI — Enterprise AI Revenue Recovery Agent

[![Razorpay AI Buildathon](https://img.shields.io/badge/Razorpay%20AI%20Buildathon-AI%20Revenue%20Recovery-blue)](https://github.com/Vedant040106/Razorpay_Buildathon)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-blueviolet)](https://vitejs.dev/)

> **RecoverAI** is an AI-powered revenue recovery agent that analyzes failed payments, determines whether they are recoverable, recommends the appropriate recovery strategy, and executes only permitted actions through a controlled policy layer while maintaining a complete audit trail.

---

## 1. The Problem

Failed payments are not all the same. Online merchants lose 15% to 30% of their Gross Merchandise Value (GMV) to payment failures resulting from:
- Temporary gateway or bank timeouts
- Insufficient customer funds
- Dropped 3D-Secure authentication sessions
- Recurring mandate execution failures
- Recoverable card limit or transient network anomalies

Treating every failure identically leads to two costly failures:
1. **Blind Retries:** Spams customer accounts, exhausts card network velocity limits, incurs chargeback penalties, and degrades customer trust.
2. **Total Abandonment:** Leaves substantial recoverable revenue unrecovered and forces unnecessary customer churn.

---

## 2. The Solution

RecoverAI introduces an intelligent, autonomous-yet-governed revenue recovery pipeline:
1. **Context Extraction:** Automatically captures error codes, gateway responses, payment instruments, and past attempt patterns upon payment failure.
2. **AI Recovery Feasibility Assessment:** An isolated LLM evaluates recovery likelihood, urgency, and recommended strategies with confidence scoring.
3. **Deterministic Policy Gate:** A strict, zero-LLM policy layer validates transaction amounts, cooldown windows, velocity caps, and fraud indicators.
4. **Governed Action Execution:** Safe actions (e.g. Smart Recovery Payment Links, Tokenized Recurring Retries) execute idempotently via Razorpay APIs.
5. **Human-in-the-Loop Reviews:** High-value or uncertain transactions are routed to a dedicated merchant approval queue.
6. **Complete Audit Ledger:** Every state change, AI recommendation, policy decision, and gateway response is cryptographically auditable.

---

## 3. Why This Matters

| Traditional Approach | RecoverAI Approach |
| :--- | :--- |
| Static, hardcoded retry schedules (e.g., retry all after 24h) | Dynamic, context-aware recovery tailored to the root cause of failure |
| High rate of failed retry attempts and gateway fees | Policy-gated retries preventing card network rate limit violations |
| "Black-box" automated actions with no human oversight | Strict approval workflows for high-value transactions (> ₹5,000) |
| Fragmented logs with missing correlation | Single-pane auditable timeline with correlation IDs for every transaction |
| Floating-point calculation drift | 100% integer arithmetic in paise (smallest currency unit) |

---

## 4. Key Features

- **Merchant Operations Console:** Data-dense financial operations interface built with React, Vite, and Tailwind CSS.
- **Strict Separation of Concerns:** *AI recommends. Deterministic systems authorize and execute.*
- **Dual AI Engine:** Supports Gemini API / OpenAI API with an automatic, zero-dependency Deterministic Fallback Classifier during outages.
- **Idempotent Action Gate:** Compound hash locks prevent duplicate execution races or replay attacks.
- **Real-Time Webhook Engine:** HMAC-SHA256 signature verification for Razorpay events (`payment.failed`, `payment.captured`, `payment_link.paid`).
- **Interactive Pitch Simulator:** Built-in drawer to test transient failures, high-value approvals, retry blocks, and API outages live.
- **Zero-Setup Database Mode:** Automatically leverages `mongodb-memory-server` if no external database URI is supplied.

---

## 5. Architecture

```
                    ┌──────────────────────────────┐
                    │  React + Vite Merchant UI    │
                    │  (Tailwind CSS, TanStack)    │
                    └──────────────┬───────────────┘
                                   │ HTTPS / REST
                                   ▼
                    ┌──────────────────────────────┐
                    │      Express.js Core         │
                    │                              │
                    │ Auth / RBAC                  │
                    │ Payments & State Machine     │
                    │ Recovery Engine              │
                    │ AI Decision System           │
                    │ Policy Engine                │
                    │ Idempotent Action Gate       │
                    │ Human Approvals              │
                    │ Audit Ledger                 │
                    │ Webhooks (HMAC-SHA256)       │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
       ┌─────────────┐     ┌──────────────┐     ┌───────────────┐
       │   MongoDB   │     │   Razorpay   │     │  AI Provider  │
       │  (Mongoose) │     │   Test API   │     │(Gemini/OpenAI)│
       └─────────────┘     └──────────────┘     └───────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for sequence diagrams and module boundaries.

---

## 6. AI Architecture & Guardrails

The LLM is strictly isolated from external networks and databases:
- **Input:** Sanitized payment context (amount in paise, error codes, attempt counts). Customer PII is excluded.
- **Output:** Rigid structured JSON validated through a strict **Zod Schema**.
- **Vocabulary:** Action recommendations are constrained to a predefined enum:
  - `RETRY_PAYMENT`
  - `SEND_PAYMENT_REMINDER`
  - `CREATE_RECOVERY_CASE`
  - `ESCALATE_TO_MERCHANT`
  - `MARK_UNRECOVERABLE`
  - `REQUEST_HUMAN_APPROVAL`
- **Fallback Guarantee:** If the AI provider times out or fails, a deterministic classifier safely assigns a baseline recommendation and mandates human approval.

See [docs/AI_DECISION_SYSTEM.md](docs/AI_DECISION_SYSTEM.md) for schemas, prompts, and failure handling.

---

## 7. Policy & Action Safety

The **Policy Engine** evaluates every AI recommendation against deterministic business rules:
- **POL-001 (Payment Invariance):** Blocks actions if payment is already captured or recovered.
- **POL-002 (Retry Limit):** Blocks actions if total attempts exceed `maxRecoveryAttempts` (default: 3).
- **POL-003 (Cooldown Active):** Blocks actions if the cooldown period hasn't elapsed.
- **POL-004 (High-Value Gate):** Enforces human approval if transaction > `autoActionMaxAmountPaise` (₹5,000).
- **POL-005 (Low-Confidence Gate):** Enforces human approval if AI confidence score is below 0.75.
- **POL-006 (Fallback Review):** Enforces human approval if generated via fallback classifier.

See [docs/POLICY_ENGINE.md](docs/POLICY_ENGINE.md) for the full rule matrix.

---

## 8. Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, TanStack Query, Recharts, Lucide Icons
- **Backend:** Node.js, Express.js (Modular Monolith architecture)
- **Database:** MongoDB, Mongoose ODM (Paise integer money handling, compound unique indexes)
- **AI Layer:** Google Gemini / OpenAI SDK + Deterministic Fallback Classifier + Zod Validation
- **Gateway Integration:** Official Razorpay Test Mode API (`razorpay` SDK) + HMAC Webhooks
- **Authentication:** JWT (JSON Web Tokens) with HTTP-only cookies / Bearer headers, RBAC
- **Testing:** Jest, Supertest

---

## 9. Project Structure

```
recoverai/
├── client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── app/                 # Routes and global providers
│   │   ├── components/          # Reusable UI, layout, tables, modal components
│   │   ├── features/            # Feature modules (dashboard, payments, recovery, approvals, audit, demo)
│   │   └── services/            # Axios API clients
│   └── package.json
│
├── server/                      # Express Backend
│   ├── src/
│   │   ├── config/              # Environment, database, Razorpay config
│   │   ├── middleware/          # Auth, RBAC, error handling, rate limiting
│   │   ├── modules/             # Domain modules (auth, payments, recovery, ai, policy, actions, audit, etc.)
│   │   ├── integrations/        # Isolated Razorpay client and AI providers
│   │   └── database/            # Seed data and indexes
│   ├── tests/                   # Unit, integration, and failure test suites
│   └── package.json
│
├── docs/                        # First-class technical documentation
│   ├── ARCHITECTURE.md
│   ├── AI_DECISION_SYSTEM.md
│   ├── POLICY_ENGINE.md
│   ├── DATA_MODEL.md
│   ├── API.md
│   ├── SECURITY.md
│   ├── DEMO.md
│   ├── DEVELOPMENT.md
│   ├── FAILURE_HANDLING.md
│   └── ADR/                     # Architecture Decision Records (001-004)
│
├── .env.example
├── package.json
└── README.md
```

---

## 10. Database Model

Amounts are stored exclusively as 64-bit integers in **paise** (1 INR = 100 paise) to prevent floating-point errors.
- `merchants`: Account profiles and custom policy thresholds.
- `users`: Console operators with RBAC (`ADMIN`, `OPS_MANAGER`, `VIEWER`).
- `payments`: Canonical payment records, failure categories, and status machine.
- `paymentAttempts`: Granular gateway attempt logs and error payloads.
- `recoveryCases`: Recovery workflow state, priority, and attempts count.
- `recoveryDecisions`: Historical record of AI prompts, raw responses, and validation results.
- `recoveryActions`: Permitted actions executed through the idempotent action gate.
- `approvals`: Human-in-the-loop review tickets.
- `auditEvents`: Append-only, tamper-evident operational ledger.

See [docs/DATA_MODEL.md](docs/DATA_MODEL.md) for full collection schemas.

---

## 11. Razorpay Integration & Action Vocabulary

- **Official Test Mode APIs:**
  - `POST /v1/orders`: Order generation
  - `GET /v1/payments/:id`: Payment verification
  - `POST /v1/payment_links`: Smart recovery payment links (`SEND_PAYMENT_REMINDER`)
- **Webhook Ingestion:** Raw-body HMAC-SHA256 signature verification on `POST /api/webhooks/razorpay`.
- **Zero Fake Claims:** Standard checkout card retries (which require customer 3DS OTP per RBI regulations) are either executed via the Payment Link reminder workflow or clearly labeled as `SIMULATED_TEST_RETRY` in test mode.

---

## 12. Setup & Installation

```bash
# 1. Clone repository
git clone https://github.com/Vedant040106/Razorpay_Buildathon.git
cd Razorpay_Buildathon

# 2. Install dependencies
npm install
cd server && npm install
cd ../client && npm install
cd ..

# 3. Configure environment
cp .env.example server/.env
```

---

## 13. Environment Variables

See `.env.example` for the complete list:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/recoverai   # If omitted, auto-runs in-memory Mongo!
JWT_SECRET=your_jwt_secret_key
RAZORPAY_KEY_ID=rzp_test_yourKey
RAZORPAY_KEY_SECRET=yourSecret
RAZORPAY_WEBHOOK_SECRET=yourWebhookSecret
AI_API_KEY=your_gemini_or_openai_key             # If omitted, auto-runs deterministic fallback!
```

---

## 14. Running Locally

```bash
# Run both Backend API and Frontend Console concurrently
npm run dev

# Or seed demo data first
npm run seed
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## 15. 5-Minute Pitch Demo

RecoverAI includes a built-in pitch simulator for demonstration:
- **Case A (Transient Network Timeout):** ₹4,500 failure -> High AI confidence (0.92) -> Policy: Auto-Allowed -> Recovered.
- **Case B (High-Value Human Approval):** ₹12,000 failure -> Policy: Requires Human Approval (Value > ₹5,000) -> Approved via UI.
- **Case C (Retry Exhaustion Blocked):** 3 attempts reached -> Policy: Blocked (`RETRY_LIMIT_EXCEEDED`).
- **Case D (AI Provider Failure):** Simulated LLM 500 error -> Fallback classifier engages -> Safely routed to Human Approval.
- **Case E (Gateway API Outage):** Simulated Razorpay 500 error -> Action fails safely, logged in audit, case preserved.
- **Case F (Duplicate Webhook Replay):** Idempotency drops duplicate event without double debit.

See [docs/DEMO.md](docs/DEMO.md) for the live pitch runbook.

---

## 16. Testing

```bash
# Run comprehensive backend test suite
cd server && npm test
```
Tests cover:
- Unit: Policy Engine rules, retry limits, cooldown windows, idempotency hash generation, AI Zod schema validation, paise integer math.
- Integration: Recovery workflow, human approval flow, webhook signature validation.
- Failure Scenarios: LLM timeout, malformed AI output, duplicate webhook replays.

---

## 17. Failure Handling

Real engineering failures encountered during implementation and their resolutions are logged in [docs/FAILURE_HANDLING.md](docs/FAILURE_HANDLING.md).

---

## 18. Security

- Cryptographic HMAC-SHA256 webhook verification.
- Compound unique indexes for action idempotency.
- Role-Based Access Control (Admin, Ops Manager, Viewer).
- Strict Helmet security headers, CORS restrictions, and rate limiting.
- Details in [docs/SECURITY.md](docs/SECURITY.md).

---

## 19. Limitations

- Test Mode requires customer-present authorization links for standard card retries per RBI regulations.
- AI token latency is subject to upstream provider SLAs (mitigated by 4s timeout and fallback classifier).

---

## 20. Future Improvements

- Multi-merchant SaaS tenancy with automated Razorpay OAuth onboarding.
- WhatsApp / SMS channel integration for automated Smart Recovery Links.
- Reinforcement Learning from human merchant approval decisions.

---

## 21. Buildathon Track

- **Event:** Razorpay AI Buildathon
- **Track:** AI Revenue Recovery

---

## 22. Team & Author

- **Author:** Vedant ([@Vedant040106](https://github.com/Vedant040106))
- **Repository:** [https://github.com/Vedant040106/Razorpay_Buildathon](https://github.com/Vedant040106/Razorpay_Buildathon)
