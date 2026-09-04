import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const policySnapshotSchema = new mongoose.Schema({
  autoActionMaxAmountPaise: {
    type: Number,
    required: true
  },
  maxRecoveryAttempts: {
    type: Number,
    required: true
  },
  cooldownPeriodMinutes: {
    type: Number,
    required: true
  },
  minConfidenceAutoAction: {
    type: Number,
    default: 0.75
  },
  allowedAutoStrategies: {
    type: [String],
    default: ['RETRY_PAYMENT', 'SEND_PAYMENT_REMINDER']
  }
}, { _id: false });

const simulationSummarySchema = new mongoose.Schema({
  projectedRecoveryRate: { type: Number, required: true },
  projectedRecoveredAmountPaise: { type: Number, required: true },
  projectedRecoveryCount: { type: Number, required: true },
  expectedHumanReviews: { type: Number, required: true },
  policyBlockedActions: { type: Number, required: true },
  recoveryRateDelta: { type: Number, required: true },
  recoveredAmountDeltaPaise: { type: Number, required: true },
  humanReviewsDelta: { type: Number, required: true },
  explainability: { type: [String], default: [] }
}, { _id: false });

const policyProposalSchema = new mongoose.Schema({
  proposalId: {
    type: String,
    required: true,
    unique: true,
    default: () => `PROP-2026-${uuidv4().slice(0, 8).toUpperCase()}`,
    index: true
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true,
    index: true
  },
  currentPolicy: {
    type: policySnapshotSchema,
    required: true
  },
  proposedPolicy: {
    type: policySnapshotSchema,
    required: true
  },
  simulationSummary: {
    type: simulationSummarySchema,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED'],
    default: 'PENDING_REVIEW',
    index: true
  },
  proposedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

export const PolicyProposal = mongoose.model('PolicyProposal', policyProposalSchema);
