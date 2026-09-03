import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const executionDetailsSchema = new mongoose.Schema({
  gatewayOperation: { type: String, default: null },
  isSimulated: { type: Boolean, default: false },
  externalReferenceId: { type: String, default: null }, // e.g. Razorpay payment link plink_xxx
  responsePayload: { type: mongoose.Schema.Types.Mixed, default: null },
  errorMessage: { type: String, default: null }
}, { _id: false });

const recoveryActionSchema = new mongoose.Schema({
  actionId: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4(),
    index: true
  },
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecoveryCase',
    required: true,
    index: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    index: true
  },
  actionType: {
    type: String,
    required: true,
    enum: [
      'RETRY_PAYMENT',
      'SEND_PAYMENT_REMINDER',
      'CREATE_RECOVERY_CASE',
      'ESCALATE_TO_MERCHANT',
      'MARK_UNRECOVERABLE',
      'REQUEST_HUMAN_APPROVAL'
    ]
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1
  },
  // CRITICAL: Database-enforced idempotency key
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  policyDecision: {
    type: String,
    required: true,
    enum: ['ALLOW', 'REQUIRE_APPROVAL', 'BLOCK']
  },
  policyReasonCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: [
      'PENDING_APPROVAL',
      'SCHEDULED',
      'EXECUTING',
      'COMPLETED',
      'FAILED',
      'BLOCKED',
      'REJECTED'
    ],
    default: 'SCHEDULED',
    index: true
  },
  executionDetails: {
    type: executionDetailsSchema,
    default: () => ({})
  },
  executedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound unique index ensuring no duplicate execution for same payment, action and attempt
recoveryActionSchema.index({ paymentId: 1, actionType: 1, attemptNumber: 1 }, { unique: true });

export const RecoveryAction = mongoose.model('RecoveryAction', recoveryActionSchema);
