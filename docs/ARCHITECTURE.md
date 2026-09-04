# RecoverAI — System Architecture

## 1. System Overview

RecoverAI is an enterprise-grade AI revenue recovery platform built for merchants processing payments via Razorpay. It intercepts failed payments, extracts technical and behavioral context, leverages an isolated Large Language Model to evaluate recovery feasibility and recommend mitigation strategies, evaluates deterministic policy constraints, and safely executes permitted actions through an idempotent action gate.

---

## 2. Architectural Blueprint

```mermaid
flowchart TB
    subgraph ClientLayer["Frontend Application (React + Vite + Tailwind CSS)"]
        Landing["Public Landing Page (/)"]
        Login["Merchant Authentication (/login)"]
        Dashboard["Operations Dashboard (/dashboard)"]
        CommandCenter["Recovery Command Center (/recovery/command-center)"]
        Queue["Recovery Queue (/recovery)"]
        RecoveryLab["Recovery Lab Policy Sandbox (/recovery/lab)"]
        Detail["Recovery Case & 8-Stage Timeline (/recovery/:id)"]
        Approvals["Human Approval Inbox (/approvals)"]
        Analytics["Recovery Analytics (/analytics)"]
        AuditView["Audit Trail Explorer (/audit)"]
        SimDrawer["Interactive Demo Simulator"]
    end

    subgraph APILayer["Express.js Modular Monolith Core"]
        AuthMiddleware["Auth & RBAC Middleware"]
        RateLimiter["Rate Limiting & Request ID"]
        ErrorHandler["Global Error Handler & Logger"]

        subgraph DomainModules["Domain Modules"]
            AuthMod["Auth Module"]
            PayMod["Payments Module"]
            RecMod["Recovery Module & Command Center"]
            LabMod["Recovery Lab & Governance Module"]
            ApproveMod["Approvals Module"]
            AuditMod["Audit & Ledger Module"]
            AnalyticMod["Analytics Module"]
        end

        subgraph DecisionAndExecution["Safety & Execution Core"]
            AIMod["AI Decision Layer\n(Zod Schema Validated)"]
            PolicyEngine["Deterministic Policy Engine\n(Thresholds, Cooldowns, Velocity)"]
            ActionGate["Idempotent Action Gate\n(Unique Lock & Pre-Flight Check)"]
        end

        subgraph IntegrationLayer["Integrations"]
            RazorpayClient["Razorpay API Client\n(Orders, Payments, Payment Links)"]
            AIProvider["AI Provider Abstraction\n(Gemini / OpenAI / Rule Fallback)"]
            WebhookHandler["Webhook Ingestion\n(HMAC-SHA256 Signature Verification)"]
        end
    end

    subgraph DataLayer["Storage & External Gateways"]
        MongoDB[(MongoDB Primary Store\npaise amounts, unique indexes)]
        RazorpayGateway["Razorpay Test Gateway"]
        LLMService["External LLM Endpoint"]
    end

    %% Connections
    ClientLayer -->|REST / HTTPS| APILayer
    WebhookHandler <--|Webhooks| RazorpayGateway
    AIMod --> AIProvider
    AIProvider --> LLMService
    RecMod --> AIMod
    AIMod --> PolicyEngine
    PolicyEngine -->|Decision: ALLOW| ActionGate
    PolicyEngine -->|Decision: REQUIRE_APPROVAL| ApproveMod
    PolicyEngine -->|Decision: BLOCK| AuditMod
    ApproveMod -->|Human Approval| ActionGate
    ActionGate --> RazorpayClient
    RazorpayClient --> RazorpayGateway
    DomainModules --> MongoDB
    ActionGate --> AuditMod
    AuditMod --> MongoDB
```

---

## 3. End-to-End Recovery Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Gateway
    participant RZP as Razorpay Gateway
    participant Webhook as Webhook Controller
    participant PaySvc as Payment Service
    participant RecSvc as Recovery Service
    participant AISvc as AI Service (LLM)
    participant Policy as Policy Engine
    participant Gate as Action Gate
    participant Approval as Approvals Queue
    participant Audit as Audit Service

    Customer->>RZP: Initiates ₹4,500 Payment
    RZP-->>Customer: Payment Failed (GATEWAY_ERROR: Network Timeout)
    RZP->>Webhook: POST /api/webhooks/razorpay (payment.failed)
    
    Webhook->>Webhook: Verify HMAC-SHA256 Signature
    Webhook->>PaySvc: Record Payment & Attempt (status: FAILED)
    Webhook->>Audit: Log PAYMENT_FAILED
    
    PaySvc->>RecSvc: Trigger Recovery Case Creation
    RecSvc->>Audit: Log RECOVERY_CASE_CREATED
    
    RecSvc->>AISvc: Analyze Failure Context (error, amount, history)
    AISvc->>AISvc: Invoke LLM & Validate Zod Schema
    alt AI Call Successful
        AISvc-->>RecSvc: Structured Recommendation (RETRY_PAYMENT, conf: 0.92)
        RecSvc->>Audit: Log AI_ANALYSIS_COMPLETED
    else AI Times Out / Corrupted
        AISvc-->>RecSvc: Deterministic Rule Fallback (conf: 0.50, fallback: true)
        RecSvc->>Audit: Log AI_ANALYSIS_FAILED (Safe fallback applied)
    end

    RecSvc->>Policy: Evaluate Policy Rules(Payment, RecCase, Recommendation)
    
    alt Policy = ALLOW (Amount <= Threshold & Attempts < Max)
        Policy-->>Gate: ALLOW (Reason: WITHIN_RECOVERY_POLICY)
        Gate->>Gate: Verify Idempotency Key (paymentId + action + attempt)
        Gate->>RZP: Dispatch Permitted Action (e.g. Smart Recovery Link / Test Retry)
        RZP-->>Gate: Action Executed (Reference ID plink_xxx)
        Gate->>RecSvc: Update Status: IN_FLIGHT / RECOVERED
        Gate->>Audit: Log ACTION_EXECUTED
    else Policy = REQUIRE_APPROVAL (High-Value / Low-Confidence)
        Policy-->>Approval: Enqueue Case in Approvals Inbox
        Approval->>Audit: Log APPROVAL_REQUESTED
    else Policy = BLOCK (Max Attempts Exceeded / Cooldown Active)
        Policy->>RecSvc: Mark RECOVERY_EXHAUSTED
        Policy->>Audit: Log ACTION_BLOCKED
    end
```

---

## 4. Domain Module Responsibilities

| Module | Location | Primary Responsibilities |
| :--- | :--- | :--- |
| **Auth** | `server/src/modules/auth` | JWT issuance, cookie management, role-based authorization (Admin, Ops Manager, Viewer) |
| **Payments** | `server/src/modules/payments` | Payment ingestion, attempt history, strict state transitions, paise integer storage |
| **Recovery** | `server/src/modules/recovery` | Recovery case lifecycle, context generation, strategy orchestration |
| **AI** | `server/src/modules/ai` | Provider abstraction, structured JSON prompting, Zod schema validation, safe rule fallback |
| **Policy** | `server/src/modules/policy` | Pure deterministic rules: cooldowns, retry limits, risk thresholds, approval checks |
| **Actions** | `server/src/modules/actions` | Action gate, idempotency lock generation, pre-flight gatekeeper, gateway dispatch |
| **Approvals** | `server/src/modules/approvals` | Human-in-the-loop review workflow, audit-tracked Approve/Reject transitions |
| **Audit** | `server/src/modules/audit` | Append-only immutable ledger recording actor, correlation ID, entity ID, and sanitised payload |
| **Analytics** | `server/src/modules/analytics` | Real-time recovery rates, revenue recovered, failure breakdowns, SLA tracking |
| **Webhooks** | `server/src/modules/webhooks` | Secure HMAC-SHA256 signature verification, event deduplication, background pipeline kickoff |

---

## 5. Security & Failure Boundaries

1. **AI Boundary:** The AI module operates inside an isolated sandbox. It has zero network access to the Razorpay integration layer and cannot trigger database mutations directly.
2. **Action Gate:** External gateway mutations are exclusively dispatched via the Action Gate after passing idempotency and policy validation.
3. **Integer Money Boundary:** All amounts entering the system are immediately converted to integers (paise). Floating-point values are rejected at the API schema validation layer.
