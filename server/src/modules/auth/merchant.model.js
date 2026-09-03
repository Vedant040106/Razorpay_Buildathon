import mongoose from 'mongoose';

const policyConfigSchema = new mongoose.Schema({
  autoActionMaxAmountPaise: {
    type: Number,
    required: true,
    default: 500000 // ₹5,000.00
  },
  maxRecoveryAttempts: {
    type: Number,
    required: true,
    default: 3
  },
  cooldownPeriodMinutes: {
    type: Number,
    required: true,
    default: 15
  },
  minConfidenceAutoAction: {
    type: Number,
    required: true,
    default: 0.75
  },
  allowedAutoStrategies: {
    type: [String],
    default: ['RETRY_PAYMENT', 'SEND_PAYMENT_REMINDER']
  }
}, { _id: false });

const merchantSchema = new mongoose.Schema({
  merchantId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  currency: {
    type: String,
    required: true,
    default: 'INR'
  },
  policyConfig: {
    type: policyConfigSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

export const Merchant = mongoose.model('Merchant', merchantSchema);
