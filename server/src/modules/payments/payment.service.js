import { Payment } from './payment.model.js';
import { PaymentAttempt } from './paymentAttempt.model.js';
import { AuditService } from '../audit/audit.service.js';
import { BadRequestError, NotFoundError, ConflictError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

export class PaymentService {
  /**
   * Creates a new payment record in CREATED status.
   */
  static async createPayment(merchantId, paymentData, requestId = null) {
    const existing = await Payment.findOne({ paymentId: paymentData.paymentId });
    if (existing) {
      throw new ConflictError(`Payment with ID ${paymentData.paymentId} already exists.`);
    }

    const payment = await Payment.create({
      ...paymentData,
      merchantId,
      status: 'CREATED'
    });

    await AuditService.logEvent({
      eventType: 'PAYMENT_RECEIVED',
      entityType: 'PAYMENT',
      entityId: payment.paymentId,
      actor: { type: 'SYSTEM', id: 'payment_ingestion' },
      requestId,
      payload: {
        paymentId: payment.paymentId,
        amount: payment.amount,
        method: payment.method
      }
    });

    return payment;
  }

  /**
   * Records a failed payment attempt and triggers the recovery pipeline.
   */
  static async recordPaymentFailure(paymentId, failureData, requestId = null) {
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      throw new NotFoundError(`Payment ${paymentId} not found`);
    }

    // Check if already captured/recovered
    if (payment.status === 'CAPTURED') {
      throw new ConflictError(`Cannot fail a payment that is already CAPTURED.`);
    }

    payment.status = 'FAILED';
    payment.failureCode = failureData.failureCode;
    payment.failureReason = failureData.failureReason;
    payment.failureCategory = failureData.failureCategory || 'UNKNOWN';
    payment.recoveryStatus = 'PENDING_ANALYSIS';
    await payment.save();

    // Record Attempt in ledger
    const attemptCount = await PaymentAttempt.countDocuments({ paymentId: payment._id });
    const attempt = await PaymentAttempt.create({
      paymentId: payment._id,
      attemptNumber: attemptCount + 1,
      status: 'FAILED',
      errorCode: failureData.failureCode,
      errorDescription: failureData.failureReason,
      rawGatewayResponse: failureData.rawGatewayResponse || {}
    });

    await AuditService.logEvent({
      eventType: 'PAYMENT_FAILED',
      entityType: 'PAYMENT',
      entityId: payment.paymentId,
      actor: { type: 'SYSTEM', id: 'gateway_webhook' },
      requestId,
      payload: {
        paymentId: payment.paymentId,
        attemptNumber: attempt.attemptNumber,
        failureCode: payment.failureCode,
        failureCategory: payment.failureCategory,
        amount: payment.amount
      }
    });

    return { payment, attempt };
  }

  /**
   * Records a successful payment capture and resolves any active recovery cases.
   */
  static async recordPaymentSuccess(paymentId, captureData = {}, requestId = null) {
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      throw new NotFoundError(`Payment ${paymentId} not found`);
    }

    const previousStatus = payment.status;
    payment.status = 'CAPTURED';
    payment.recoveryStatus = 'RECOVERED';
    await payment.save();

    const attemptCount = await PaymentAttempt.countDocuments({ paymentId: payment._id });
    await PaymentAttempt.create({
      paymentId: payment._id,
      attemptNumber: attemptCount + 1,
      status: 'SUCCESS',
      rawGatewayResponse: captureData
    });

    await AuditService.logEvent({
      eventType: previousStatus === 'FAILED' ? 'RECOVERY_SUCCEEDED' : 'PAYMENT_RECEIVED',
      entityType: 'PAYMENT',
      entityId: payment.paymentId,
      actor: { type: 'SYSTEM', id: 'gateway_capture' },
      requestId,
      payload: {
        paymentId: payment.paymentId,
        amount: payment.amount,
        previousStatus
      }
    });

    return payment;
  }

  /**
   * Lists payments with flexible filtering and pagination.
   */
  static async listPayments({ merchantId, status, method, failureCategory, search, page = 1, limit = 20 }) {
    const query = {};
    if (merchantId) query.merchantId = merchantId;
    if (status) query.status = status;
    if (method) query.method = method;
    if (failureCategory) query.failureCategory = failureCategory;
    if (search) {
      query.$or = [
        { paymentId: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments(query)
    ]);

    return {
      payments,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  /**
   * Fetches deep payment record with attempts and recovery case details.
   */
  static async getPaymentById(paymentId) {
    const payment = await Payment.findOne({ paymentId }).populate('merchantId').lean();
    if (!payment) {
      throw new NotFoundError(`Payment ${paymentId} not found`);
    }

    const attempts = await PaymentAttempt.find({ paymentId: payment._id }).sort({ attemptNumber: 1 }).lean();
    return { ...payment, attempts };
  }
}
