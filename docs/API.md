# RecoverAI — REST API Documentation

## 1. Global Conventions

### 1.1 Base URL & Content Negotiation
- Base API URL: `/api`
- All requests containing payloads must specify `Content-Type: application/json`.
- All responses return JSON formatted with standard envelope.

### 1.2 Authentication
- Authentication is enforced via JWT token passed either in:
  - An `Authorization: Bearer <token>` header, or
  - An HTTP-only secure cookie (`token`).
- Roles: `ADMIN`, `OPS_MANAGER`, `VIEWER`.

### 1.3 Correlation & Request Tracing
Every request generates a unique correlation ID accessible in response headers as `X-Request-Id` and attached to all log and audit events.

### 1.4 Standard Response Envelopes

**Success Response (2xx):**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_c92bf18e90a",
    "timestamp": "2026-09-03T18:30:00.000Z"
  }
}
```

**Error Response (4xx / 5xx):**
```json
{
  "success": false,
  "error": {
    "code": "RECOVERY_ACTION_BLOCKED",
    "message": "The recovery attempt exceeds the configured retry limit.",
    "details": {},
    "requestId": "req_c92bf18e90a"
  }
}
```

---

## 2. API Endpoints

### 2.1 Authentication (`/api/auth`)

#### `POST /api/auth/login`
- **Body:** `{ "email": "admin@recoverai.local", "password": "password123" }`
- **Response:** `200 OK` with user object and JWT cookie/token.

#### `GET /api/auth/me`
- **Auth:** Required
- **Response:** Current authenticated user profile and merchant metadata.

#### `POST /api/auth/logout`
- **Response:** `200 OK`, clears session cookie.

---

### 2.2 Payments (`/api/payments`)

#### `GET /api/payments`
- **Auth:** Required
- **Query Params:** `page`, `limit`, `status`, `method`, `failureCategory`, `search`
- **Response:** Paginated list of payment records with attempt history.

#### `GET /api/payments/:id`
- **Auth:** Required
- **Response:** Payment record including attempts, linked recovery case, and audit events.

---

### 2.3 Recovery Engine (`/api/recovery`)

#### `GET /api/recovery`
- **Auth:** Required
- **Query Params:** `page`, `limit`, `status`, `priority`, `tier`
- **Response:** List of recovery cases with recoverability score, latest decision, and action status.

#### `GET /api/recovery/:id`
- **Auth:** Required
- **Response:** Deep recovery case detail including payment details, AI recommendation, policy checks, execution records, and audit timeline.

#### `POST /api/recovery/:id/analyze`
- **Auth:** Required (Admin or Ops Manager)
- **Description:** Triggers AI re-analysis on a failed payment case, evaluates the Policy Engine, and determines the permitted action.
- **Response:** `200 OK` with AI recommendation and policy verdict (`ALLOW`, `REQUIRE_APPROVAL`, `BLOCK`).

---

### 2.4 Actions & Gate (`/api/actions`)

#### `POST /api/actions/:id/execute`
- **Auth:** Required (Admin or Ops Manager)
- **Description:** Dispatches a permitted recovery action through the Idempotency Gate to Razorpay Test API.
- **Response:** `200 OK` with execution result and gateway reference ID.

---

### 2.5 Approvals (`/api/approvals`)

#### `GET /api/approvals`
- **Auth:** Required
- **Query Params:** `status` (default: `PENDING`)
- **Response:** Queue of recovery cases awaiting human authorization.

#### `POST /api/approvals/:id/approve`
- **Auth:** Required (Admin or Ops Manager)
- **Body:** `{ "notes": "Approved after customer confirmed intent" }`
- **Response:** `200 OK`, transitions approval to `APPROVED` and initiates action execution.

#### `POST /api/approvals/:id/reject`
- **Auth:** Required (Admin or Ops Manager)
- **Body:** `{ "notes": "Suspected abuse, aborting recovery" }`
- **Response:** `200 OK`, marks approval `REJECTED` and recovery case `CLOSED_UNRECOVERABLE`.

---

### 2.6 Analytics (`/api/analytics`)

#### `GET /api/analytics`
- **Auth:** Required
- **Response:**
  - Total payment volume, failed GMV, recoverable GMV, recovered GMV (in paise)
  - Recovery success rate (%)
  - Failure category breakdown
  - Recovery strategy performance breakdown
  - Daily recovery velocity trend

---

### 2.7 Audit Ledger (`/api/audit`)

#### `GET /api/audit`
- **Auth:** Required
- **Query Params:** `entityId`, `eventType`, `actorType`, `limit`, `page`
- **Response:** Chronological append-only event stream with correlation IDs.

---

### 2.8 Razorpay Webhook Ingestion (`/api/webhooks/razorpay`)

#### `POST /api/webhooks/razorpay`
- **Headers:** `X-Razorpay-Signature: <hmac_sha256>`
- **Description:** Ingests live Razorpay events (`payment.failed`, `payment.captured`, `payment_link.paid`).
- **Response:** `200 OK` (`{ "received": true }`).

---

### 2.9 Demo Simulator (`/api/demo`)

#### `POST /api/demo/simulate/:scenarioId`
- **Scenarios:** `case_a_transient`, `case_b_high_value`, `case_c_max_retry`, `case_d_ai_failure`, `case_e_gateway_failure`, `case_f_duplicate_webhook`
- **Description:** Deterministically seeds or triggers a pitch demo scenario for live evaluation.

#### `POST /api/demo/reset`
- **Description:** Resets demo data back to clean baseline state.
