# RecoverAI — Developer & Local Setup Guide

## 1. Prerequisites

- **Node.js:** v18+ (tested on Node v22.17.0)
- **npm:** v9+ (tested on npm 10.9.2)
- **MongoDB:** Optional! RecoverAI includes a built-in zero-setup in-memory database fallback (`mongodb-memory-server`) if no external MongoDB URI is provided. If you have a local MongoDB (`mongodb://localhost:27017/recoverai`) or MongoDB Atlas URI, it will seamlessly connect.

---

## 2. Quickstart Installation

Clone the repository and install all root and workspace dependencies:

```bash
# Clone the repository
git clone https://github.com/Vedant040106/Razorpay_Buildathon.git
cd Razorpay_Buildathon

# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
cd ..
```

---

## 3. Environment Configuration

Copy the sample environment file to `server/.env`:

```bash
cp .env.example server/.env
```

Review and adjust variables in `server/.env` if needed:
- If `MONGODB_URI` is omitted or local daemon is unreachable, the server will start an embedded in-memory MongoDB instance automatically.
- If `AI_API_KEY` is omitted, the AI layer automatically runs in **Deterministic Fallback Mode**, allowing 100% full application operation without requiring paid API keys!

---

## 4. Running the Application Locally

### Running Everything Concurrently (Root)
```bash
npm run dev
```
This boots:
- Express API server on `http://localhost:5000`
- React + Vite Merchant Console on `http://localhost:5173`

### Or Running Services Separately
**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```

---

## 5. Seeding Demo Scenarios

To populate the database with realistic payment failures and demo cases:

```bash
cd server
npm run seed
```

Default credentials:
- **Email:** `admin@recoverai.local`
- **Password:** `password123`
- **Role:** `ADMIN`

---

## 6. Running Tests

RecoverAI includes a full suite of unit, integration, and failure resilience tests using Jest and Supertest:

```bash
cd server
npm test
```

Test coverage targets:
- `tests/unit/policy.test.js`: Deterministic policy rules, cooldown windows, thresholds.
- `tests/unit/idempotency.test.js`: Duplicate action detection, unique hash generation.
- `tests/unit/ai-schema.test.js`: Zod schema validation for AI recommendations.
- `tests/integration/recovery-flow.test.js`: End-to-end payment failure -> recovery case -> action gate.
- `tests/integration/webhooks.test.js`: Razorpay HMAC-SHA256 signature verification & deduplication.
