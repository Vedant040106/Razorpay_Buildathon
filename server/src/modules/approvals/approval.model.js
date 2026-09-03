import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const approvalSchema = new mongoose.Schema({
  approvalId: {
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
  actionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecoveryAction',
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    index: true
  },
  requestedAction: {
    type: String,
    required: true
  },
  aiRationale: {
    type: String,
    required: true
  },
  policyReason: {
    type: String,
    required: true
  },
  riskFlags: {
    type: [String],
    default: []
  },
  amountInPaise: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer paise value.'
    }
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

export const Approval = mongoose.model('Approval', approvalSchema);
