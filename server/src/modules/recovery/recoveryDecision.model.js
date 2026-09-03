import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const parsedRecommendationSchema = new mongoose.Schema({
  recommendedStrategy: {
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
  confidence: {
    type: Number,
    required: true,
    min: 0.0,
    max: 1.0
  },
  priority: {
    type: String,
    required: true,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  },
  reason: {
    type: String,
    required: true
  },
  contextualSignals: {
    type: [String],
    default: []
  },
  requiresHumanApproval: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const recoveryDecisionSchema = new mongoose.Schema({
  decisionId: {
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
  aiProvider: {
    type: String,
    required: true,
    enum: ['gemini', 'openai', 'rule_fallback']
  },
  promptVersion: {
    type: String,
    default: 'v1.0.0'
  },
  rawModelResponse: {
    type: String,
    default: null
  },
  parsedRecommendation: {
    type: parsedRecommendationSchema,
    required: true
  },
  validationStatus: {
    type: String,
    required: true,
    enum: ['VALID', 'SCHEMA_REJECTED', 'FALLBACK_APPLIED'],
    default: 'VALID'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

export const RecoveryDecision = mongoose.model('RecoveryDecision', recoveryDecisionSchema);
