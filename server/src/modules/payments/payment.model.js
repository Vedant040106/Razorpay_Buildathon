import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  id: { type: String },
  name: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  contact: { type: String, trim: true }
}, { _id: false });

const cardDetailsSchema = new mongoose.Schema({
  network: { type: String }, // Visa, Mastercard, RuPay
  last4: { type: String },
  type: { type: String }, // credit, debit
  issuer: { type: String } // HDFC Bank, ICICI Bank, SBI
}, { _id: false });

const upiDetailsSchema = new mongoose.Schema({
  vpa: { type: String }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true,
    index: true
  },
  // CRITICAL: Amount stored as integer in smallest currency unit (paise: 1 INR = 100 paise)
  amount: {
    type: Number,
    required: true,
    min: 100, // minimum ₹1.00
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer paise value. Floating-point amounts are forbidden.'
    }
  },
  currency: {
    type: String,
    required: true,
    default: 'INR'
  },
  status: {
    type: String,
    required: true,
    enum: ['CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'],
    default: 'CREATED',
    index: true
  },
  customer: {
    type: customerSchema,
    required: true
  },
  method: {
    type: String,
    required: true,
    enum: ['card', 'upi', 'netbanking', 'wallet', 'emi'],
    default: 'card'
  },
  cardDetails: {
    type: cardDetailsSchema
  },
  upiDetails: {
    type: upiDetailsSchema
  },
  failureCode: {
    type: String,
    default: null
  },
  failureReason: {
    type: String,
    default: null
  },
  failureCategory: {
    type: String,
    enum: [
      'TEMPORARY_NETWORK',
      'INSUFFICIENT_FUNDS',
      'AUTHENTICATION_FAILED',
      'BANK_DOWNTIME',
      'EXPIRED_CARD',
      'CUSTOMER_ABANDONED',
      'FRAUD_SUSPECTED',
      'UNKNOWN'
    ],
    default: 'UNKNOWN',
    index: true
  },
  recoveryStatus: {
    type: String,
    enum: [
      'NOT_APPLICABLE',
      'PENDING_ANALYSIS',
      'IN_RECOVERY',
      'RECOVERED',
      'EXHAUSTED',
      'UNRECOVERABLE'
    ],
    default: 'NOT_APPLICABLE',
    index: true
  },
  recoveryCaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecoveryCase',
    default: null
  },
  metadata: {
    type: Map,
    of: String,
    default: () => ({})
  }
}, {
  timestamps: true
});

// State transition validator method
paymentSchema.methods.canTransitionTo = function(newStatus) {
  const validTransitions = {
    'CREATED': ['AUTHORIZED', 'CAPTURED', 'FAILED'],
    'AUTHORIZED': ['CAPTURED', 'FAILED', 'REFUNDED'],
    'CAPTURED': ['REFUNDED'],
    'FAILED': ['CREATED', 'AUTHORIZED', 'CAPTURED'], // When recovered via smart link or retry
    'REFUNDED': []
  };

  return (validTransitions[this.status] || []).includes(newStatus);
};

export const Payment = mongoose.model('Payment', paymentSchema);
