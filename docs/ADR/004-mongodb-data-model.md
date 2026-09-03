# ADR-004: MongoDB Document Model and Integer Money Representation

## Status
Accepted

## Context
A financial recovery system handles diverse and semi-structured payloads:
- Gateway webhook payloads from Razorpay with varying error codes and metadata
- Contextual payment attempt histories
- Multi-dimensional AI decision outputs with variable contextual signals
- Audit events with dynamic entity payloads

Simultaneously, financial systems require strict transactional safety:
- Absolute avoidance of IEEE 754 floating-point arithmetic errors
- Idempotency guarantees via compound unique indexes
- Complete audit trails with immutable append-only constraints

## Decision
We select **MongoDB with Mongoose ODM** using the following architectural guidelines:
1. **Integer Money Representation:**
   - All financial amounts are stored as 64-bit integers representing **paise** (1 INR = 100 paise).
   - E.g., ₹4,500.00 is stored as `450000`.
   - Floating-point calculations are strictly prohibited in the domain and service layers.
   - Formatting into decimal INR currency strings happens exclusively at the client presentation layer.
2. **Compound Unique Indexes for Idempotency:**
   - Enforce database-level idempotency on `recoveryActions` via `{ paymentId: 1, actionType: 1, attemptNumber: 1 }`.
   - Webhook event idempotency via unique `webhookEventId`.
3. **Dedicated Collections for Auditability:**
   - `auditEvents` collection is append-only, indexed on `timestamp`, `entityId`, and `eventType`.
4. **Embedded Subdocuments vs References:**
   - Frequent relational queries (e.g. looking up a recovery case by paymentId) use indexed references.
   - Transient event payloads and customer contact info are embedded directly for schema agility and read performance.

## Alternatives Considered
1. **PostgreSQL / Relational SQL:**
   - *Considered:* Strong relational schema; however, the semi-structured nature of upstream gateway error payloads, AI metadata, and flexible policy configurations fits document collections cleanly without requiring excessive JSONB column parsing.
2. **Floating-point Float/Double numbers:**
   - *Rejected:* Strict violation of financial engineering standards. 0.1 + 0.2 != 0.3 in IEEE 754 float arithmetic leads to rounding reconciliation discrepancies.

## Consequences
- **Positive:**
  - Zero financial rounding errors.
  - Native document storage for raw webhook payloads and AI reasoning traces.
  - Bulletproof idempotency enforced at the database engine level via unique indexes.
- **Negative:**
  - Requires explicit integer conversion utilities when ingesting from external APIs or formatting for UI displays.
