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

*(Additional real development failures encountered during subsequent phases will be appended below)*
