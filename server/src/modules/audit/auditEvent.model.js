import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const actorSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['SYSTEM', 'AI_AGENT', 'USER', 'WEBHOOK', 'DEMO']
  },
  id: { type: String, default: 'system' },
  role: { type: String, default: null }
}, { _id: false });

const auditEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4(),
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'PAYMENT_RECEIVED',
      'PAYMENT_FAILED',
      'RECOVERY_CASE_CREATED',
      'AI_ANALYSIS_STARTED',
      'AI_ANALYSIS_COMPLETED',
      'AI_ANALYSIS_FAILED',
      'POLICY_EVALUATED',
      'ACTION_BLOCKED',
      'APPROVAL_REQUESTED',
      'ACTION_APPROVED',
      'ACTION_REJECTED',
      'ACTION_EXECUTED',
      'ACTION_FAILED',
      'RECOVERY_SUCCEEDED',
      'RECOVERY_EXHAUSTED',
      'WEBHOOK_RECEIVED',
      'WEBHOOK_DUPLICATE_DROPPED'
    ],
    index: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['PAYMENT', 'RECOVERY_CASE', 'ACTION', 'APPROVAL', 'WEBHOOK'],
    index: true
  },
  entityId: {
    type: String,
    required: true,
    index: true
  },
  actor: {
    type: actorSchema,
    required: true
  },
  requestId: {
    type: String,
    default: null,
    index: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  },
  prevHash: {
    type: String,
    default: null,
    index: true
  },
  hash: {
    type: String,
    default: null,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// Compound index for timeline queries on specific entities
auditEventSchema.index({ entityId: 1, timestamp: -1 });

export const AuditEvent = mongoose.model('AuditEvent', auditEventSchema);
