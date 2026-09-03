import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const paymentAttemptSchema = new mongoose.Schema({
  attemptId: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4(),
    index: true
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    index: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    required: true,
    enum: ['SUCCESS', 'FAILED']
  },
  errorCode: {
    type: String,
    default: null
  },
  errorDescription: {
    type: String,
    default: null
  },
  rawGatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// Ensure compound index for uniqueness of payment attempt sequence
paymentAttemptSchema.index({ paymentId: 1, attemptNumber: 1 }, { unique: true });

export const PaymentAttempt = mongoose.model('PaymentAttempt', paymentAttemptSchema);
