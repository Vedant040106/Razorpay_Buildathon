# RecoverAI — Failure Handling Log

This document serves as an engineering post-mortem register tracking real technical failures encountered during development, testing, and system execution. In accordance with strict engineering guidelines, entries reflect actual failures, root causes, detection mechanisms, remedies, and regression tests.

---

## Failure Entry #001: Absence of Local MongoDB Daemon on Host Environment

### Failure
During initial environment discovery on Windows, executing `mongod` and `Get-Service *mongo*` confirmed that MongoDB was neither installed on the host system PATH nor running as a local Windows service. Attempting a direct `mongoose.connect('mongodb://localhost:27017/...')` would throw connection refused (`ECONNREFUSED`) and crash the application.

### Root Cause
Development and evaluation environments (evaluator laptops, CI/CD runners, judges) cannot be assumed to have pre-installed MongoDB database servers or Docker engines running.

### Impact
Without mitigation, any reviewer running `npm start` or `npm test` on a machine without MongoDB would experience immediate startup termination.

### Detection
Environment inspection commands revealed `mongod: The term 'mongod' is not recognized`.

### Fix
Engineered a Dual-Mode Database Connection Manager in `server/src/config/database.js`. The manager attempts to connect to `MONGODB_URI` if provided and healthy; if unavailable or left unconfigured, it automatically initializes an embedded `mongodb-memory-server` in non-production environments with zero configuration required.

### Prevention
1. Never assume external daemons exist on developer machines.
2. Provide self-contained in-memory fallback for development and automated testing suites.

### Test Added
Database connection manager unit test verifying automatic fallback to in-memory instance when local connection is unreachable.

---

## Failure Entry #002: Hoisted Jest Binary in NPM Workspaces

### Failure
Running `npm test` from the `server` directory threw `Cannot find module 'D:\...\server\node_modules\jest\bin\jest.js'`.

### Root Cause
In npm workspace configurations (`"workspaces": ["server", "client"]`), npm hoists devDependencies (`jest`, `nodemon`) to the root `node_modules/` folder rather than replicating them into `server/node_modules/`.

### Impact
Server test script failed to locate the local jest binary.

### Detection
Executed `npm test` in server directory and observed the module resolution failure stack trace.

### Fix
Updated `server/package.json` test script to reference `node --experimental-vm-modules ../node_modules/jest/bin/jest.js --runInBand --detectOpenHandles --forceExit`.

### Prevention
In workspace monorepos, ensure path-dependent script invocations account for dependency hoisting.

### Test Added
Verified via `npm test` execution across all test suites.

---

## Failure Entry #003: String Method Invocations on Mongoose ObjectId Instances

### Failure
During seed script execution, `RecoveryService.processRecoveryCase` threw `TypeError: caseId.match is not a function`.

### Root Cause
The `caseId` parameter passed from internal callers was sometimes an `ObjectId` instance (e.g. `recCase._id`) rather than a string. Calling `.match()` directly on an `ObjectId` instance failed at runtime.

### Impact
Seeder and pipeline calls with direct document references crashed.

### Detection
Caught during `node src/database/seed.js` execution.

### Fix
Replaced string-only regex checks with `mongoose.isValidObjectId(caseId)` and safe string coercion in `RecoveryService.processRecoveryCase` and `RecoveryService.getCaseDetail`.

### Prevention
Always use `mongoose.isValidObjectId()` and string coercion when accepting polymorphic entity identifiers.

### Test Added
Unit test passing both raw `ObjectId` instances and human-readable slug strings (`REC-2026-XXXXX`) to recovery case lookups.

---

## Failure Entry #004: Mongoose Actor Enum Rejection in Audit Logger

### Failure
Audit logger threw `AuditEvent validation failed: actor.type: DEMO is not a valid enum value for path type`.

### Root Cause
The seed simulator passed `actor: { type: 'DEMO' }`, but the initial schema strictly allowed only `['SYSTEM', 'AI_AGENT', 'USER', 'WEBHOOK']`.

### Impact
Audit events initiated by the interactive demo simulator were dropped.

### Detection
Identified in seeder log output.

### Fix
Added `'DEMO'` to the allowed `actor.type` enum in `server/src/modules/audit/auditEvent.model.js`.

### Prevention
Ensure domain schema enums account for all system actors including diagnostic simulators.

### Test Added
Verified in seeder run and integration test pipeline.

---

## Failure Entry #005: Unmapped Webhook Payment Ingestion Schema Validation

### Failure
Webhook ingestion of a new payment threw `Payment validation failed: merchantId: Path merchantId is required`.

### Root Cause
When Razorpay sends a webhook for a payment initiated externally, the payload does not contain an internal `merchantId`. Setting `merchantId: null` failed Mongoose required schema validation.

### Impact
Webhook receiver returned HTTP 500 on valid Razorpay webhooks for unmapped merchants.

### Detection
Integration test #4 caught `Expected: 200, Received: 500`.

### Fix
Configured `WebhookService` to automatically look up and associate with the active merchant context or default merchant.

### Prevention
Gate external webhook ingestion with resilient foreign key fallback strategies.

### Test Added
Verified in `recovery-pipeline.test.js` test #4.
