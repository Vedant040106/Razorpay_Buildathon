import crypto from 'crypto';
import { env } from '../../config/env.js';
import { Payment } from '../payments/payment.model.js';
import { Merchant } from '../auth/merchant.model.js';
import { RecoveryCase } from '../recovery/recoveryCase.model.js';
import { RecoveryService } from '../recovery/recovery.service.js';
import { PaymentService } from '../payments/payment.service.js';
import { AuditService } from '../audit/audit.service.js';
import { logger } from '../../utils/logger.js';
import { BadRequestError, UnauthorizedError } from '../../utils/errors.js';

// In-memory cache for webhook deduplication (persisted in AuditEvent)
const processedWebhooks = new Set();

export class WebhookService {
  /**
   * Verifies the cryptographic HMAC-SHA256 signature from Razorpay.
   */
  static verifySignature(rawBody, signature, secret = env.RAZORPAY_WEBHOOK_SECRET) {
    if (!signature) {
      throw new UnauthorizedError('Missing X-Razorpay-Signature header.');
    }

    if (!rawBody) {
      throw new BadRequestError('Missing raw request body for signature verification.');
    }

    // If placeholder secret configured in dev, allow signature pass with warning
    if (secret.includes('placeholder') && process.env.NODE_ENV !== 'production') {
      logger.warn('[WEBHOOK] Webhook secret is placeholder; skipping cryptographic validation in dev mode.');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );

    if (!isValid) {
      throw new UnauthorizedError('Invalid cryptographic webhook signature.');
    }

    return true;
  }

  /**
   * Idempotent webhook event processor.
   */
  static async processEvent(eventPayload, requestId = null) {
    const eventId = eventPayload.id || `evt_${Date.now()}`;
    const eventName = eventPayload.event;

    // 1. Idempotency Check: Prevent duplicate webhook replay attacks
    if (processedWebhooks.has(eventId)) {
      logger.warn(`[WEBHOOK] Duplicate webhook event detected: ${eventId} (${eventName}). Dropping.`);
      await AuditService.logEvent({
        eventType: 'WEBHOOK_DUPLICATE_DROPPED',
        entityType: 'WEBHOOK',
        entityId: eventId,
        actor: { type: 'WEBHOOK', id: 'razorpay' },
        requestId,
        payload: { eventId, eventName }
      });
      return { status: 'DUPLICATE_DROPPED', eventId };
    }

    processedWebhooks.add(eventId);

    await AuditService.logEvent({
      eventType: 'WEBHOOK_RECEIVED',
      entityType: 'WEBHOOK',
      entityId: eventId,
      actor: { type: 'WEBHOOK', id: 'razorpay' },
      requestId,
      payload: { eventId, eventName }
    });

    const paymentEntity = eventPayload.payload?.payment?.entity;

    // 2. Handle payment.failed
    if (eventName === 'payment.failed' && paymentEntity) {
      logger.info(`[WEBHOOK] Processing payment.failed event for ${paymentEntity.id}`);

      let payment = await Payment.findOne({ paymentId: paymentEntity.id });
      if (!payment) {
        const defaultMerchant = await Merchant.findOne();
        // Ingest payment from webhook payload
        payment = await Payment.create({
          paymentId: paymentEntity.id,
          orderId: paymentEntity.order_id || `order_${paymentEntity.id.slice(-8)}`,
          merchantId: defaultMerchant?._id, // Assign to default merchant
          amount: paymentEntity.amount, // In paise
          currency: paymentEntity.currency || 'INR',
          status: 'FAILED',
          customer: {
            id: paymentEntity.customer_id,
            email: paymentEntity.email || 'customer@example.com',
            contact: paymentEntity.contact || '+919999999999',
            name: paymentEntity.notes?.customer_name || 'Checkout Customer'
          },
          method: paymentEntity.method || 'card',
          failureCode: paymentEntity.error_code || 'GATEWAY_ERROR',
          failureReason: paymentEntity.error_description || 'Payment failed during processing',
          failureCategory: this._categorizeErrorCode(paymentEntity.error_code)
        });
      } else {
        await PaymentService.recordPaymentFailure(payment.paymentId, {
          failureCode: paymentEntity.error_code || 'GATEWAY_ERROR',
          failureReason: paymentEntity.error_description || 'Payment failed during processing',
          failureCategory: this._categorizeErrorCode(paymentEntity.error_code),
          rawGatewayResponse: paymentEntity
        }, requestId);
      }

      // Spawn recovery case and start autonomous analysis
      const recoveryCase = await RecoveryService.createOrGetRecoveryCase(payment, { type: 'WEBHOOK', id: 'razorpay' }, requestId);
      // Asynchronously process recovery case
      RecoveryService.processRecoveryCase(recoveryCase._id, {}, { type: 'SYSTEM', id: 'webhook_worker' }, requestId)
        .catch(err => logger.error(`Background recovery pipeline error: ${err.message}`));

      return { status: 'PROCESSED', eventName, paymentId: payment.paymentId, caseId: recoveryCase.caseId };
    }

    // 3. Handle payment.captured / order.paid
    if ((eventName === 'payment.captured' || eventName === 'order.paid') && paymentEntity) {
      logger.info(`[WEBHOOK] Processing payment capture for ${paymentEntity.id}`);
      await PaymentService.recordPaymentSuccess(paymentEntity.id, paymentEntity, requestId);
      return { status: 'CAPTURED', paymentId: paymentEntity.id };
    }

    // 4. Handle payment_link.paid
    if (eventName === 'payment_link.paid') {
      const plinkEntity = eventPayload.payload?.payment_link?.entity;
      logger.info(`[WEBHOOK] Processing payment_link.paid for link ${plinkEntity?.id}`);
      
      const originalPaymentId = plinkEntity?.notes?.originalPaymentId;
      if (originalPaymentId) {
        await PaymentService.recordPaymentSuccess(originalPaymentId, plinkEntity, requestId);
      }
      return { status: 'PAYMENT_LINK_RECOVERED', linkId: plinkEntity?.id };
    }

    return { status: 'IGNORED', eventName };
  }

  static _categorizeErrorCode(errorCode) {
    if (!errorCode) return 'UNKNOWN';
    const code = errorCode.toUpperCase();

    if (code.includes('TIMEOUT') || code.includes('GATEWAY') || code.includes('NETWORK')) {
      return 'TEMPORARY_NETWORK';
    }
    if (code.includes('AUTH') || code.includes('OTP') || code.includes('3DS')) {
      return 'AUTHENTICATION_FAILED';
    }
    if (code.includes('FUNDS') || code.includes('LIMIT') || code.includes('BALANCE')) {
      return 'INSUFFICIENT_FUNDS';
    }
    if (code.includes('BANK') || code.includes('DOWN') || code.includes('UNAVAILABLE')) {
      return 'BANK_DOWNTIME';
    }
    if (code.includes('FRAUD') || code.includes('RESTRICTED') || code.includes('STOLEN')) {
      return 'FRAUD_SUSPECTED';
    }
    return 'UNKNOWN';
  }
}
