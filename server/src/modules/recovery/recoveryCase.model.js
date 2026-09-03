import mongoose from 'mongoose';

const recoveryCaseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    unique: true,
    index: true
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: [
      'PENDING_ANALYSIS',
      'ANALYZED',
      'ACTION_SCHEDULED',
      'APPROVAL_REQUIRED',
      'IN_FLIGHT',
      'RECOVERED',
      'EXHAUSTED',
      'CLOSED_UNRECOVERABLE'
    ],
    default: 'PENDING_ANALYSIS',
    index: true
  },
  recoverabilityScore: {
    type: Number,
    min: 0.0,
    max: 1.0,
    default: null
  },
  recoverabilityTier: {
    type: String,
    enum: ['HIGH', 'MEDIUM', 'LOW', 'NONE', null],
    default: null,
    index: true
  },
  priority: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM',
    index: true
  },
  attemptCount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxAttemptsAllowed: {
    type: Number,
    default: 3,
    min: 1
  },
  lastAttemptAt: {
    type: Date,
    default: null
  },
  nextEligibleAttemptAt: {
    type: Date,
    default: null
  },
  latestDecisionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecoveryDecision',
    default: null
  },
  latestActionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecoveryAction',
    default: null
  },
  finalOutcome: {
    type: String,
    enum: ['RECOVERED', 'UNRECOVERED', null],
    default: null
  }
}, {
  timestamps: true
});

export const RecoveryCase = mongoose.model('RecoveryCase', recoveryCaseSchema);
