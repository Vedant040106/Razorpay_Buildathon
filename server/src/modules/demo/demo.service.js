import { Payment } from '../payments/payment.model.js';
import { PaymentAttempt } from '../payments/paymentAttempt.model.js';
import { RecoveryCase } from '../recovery/recoveryCase.model.js';
import { RecoveryDecision } from '../recovery/recoveryDecision.model.js';
import { RecoveryAction } from '../actions/recoveryAction.model.js';
import { Approval } from '../approvals/approval.model.js';
import { AuditEvent } from '../audit/auditEvent.model.js';
import { Merchant } from '../auth/merchant.model.js';
import { RecoveryService } from '../recovery/recovery.service.js';
import { WebhookService } from '../webhooks/webhook.service.js';
import { ActionService } from '../actions/action.service.js';
import { logger } from '../../utils/logger.js';

export class DemoService {
  /**
   * Resets and populates fresh baseline seed data.
   */
  static async resetBaseline(merchantId) {
    logger.info('[DEMO] Resetting demo data to baseline state...');
    await Promise.all([
      Payment.deleteMany({}),
      PaymentAttempt.deleteMany({}),
      RecoveryCase.deleteMany({}),
      RecoveryDecision.deleteMany({}),
      RecoveryAction.deleteMany({}),
      Approval.deleteMany({}),
      AuditEvent.deleteMany({})
    ]);

    // Ensure default merchant
    let merchant = await Merchant.findOne();
    if (!merchant) {
      merchant = await Merchant.create({
        merchantId: 'merch_apex_retail',
        name: 'Apex Retail Electronics',
        email: 'ops@apexretail.in',
        currency: 'INR',
        policyConfig: {
          autoActionMaxAmountPaise: 500000, // ₹5,000.00
          maxRecoveryAttempts: 3,
          cooldownPeriodMinutes: 15,
          minConfidenceAutoAction: 0.75
        }
      });
    }

    // Seed realistic baseline transactions
    await this.simulateScenario('case_a_transient', merchant._id);
    await this.simulateScenario('case_b_high_value', merchant._id);
    await this.simulateScenario('case_c_max_retry', merchant._id);

    return { message: 'Demo environment reset and baseline scenarios seeded successfully.' };
  }

  /**
   * Triggers deterministic scenario for pitch demonstration.
   */
  static async simulateScenario(scenarioId, merchantId = null) {
    let merchant = merchantId ? await Merchant.findById(merchantId) : await Merchant.findOne();
    if (!merchant) {
      merchant = await Merchant.create({
        merchantId: 'merch_apex_retail',
        name: 'Apex Retail Electronics',
        email: 'ops@apexretail.in',
        currency: 'INR'
      });
    }

    const timestamp = Date.now().toString().slice(-5);

    switch (scenarioId) {
      case 'case_a_transient': {
        // Case A: ₹4,500 Transient Network Failure -> AI High -> Policy ALLOW -> Auto-Recovered
        const payment = await Payment.create({
          paymentId: `pay_demo_a_${timestamp}`,
          orderId: `order_a_${timestamp}`,
          merchantId: merchant._id,
          amount: 450000, // ₹4,500
          currency: 'INR',
          status: 'FAILED',
          customer: {
            name: 'Rahul Sharma',
            email: 'rahul.sharma@example.com',
            contact: '+919876543210'
          },
          method: 'card',
          cardDetails: { network: 'Visa', last4: '4012', type: 'credit', issuer: 'HDFC Bank' },
          failureCode: 'GATEWAY_ERROR',
          failureReason: 'Gateway timed out while waiting for issuer response (U30)',
          failureCategory: 'TEMPORARY_NETWORK'
        });

        await PaymentAttempt.create({
          paymentId: payment._id,
          attemptNumber: 1,
          status: 'FAILED',
          errorCode: 'GATEWAY_ERROR',
          errorDescription: 'Gateway timed out'
        });

        const recCase = await RecoveryService.createOrGetRecoveryCase(payment);
        const result = await RecoveryService.processRecoveryCase(recCase._id, {}, { type: 'DEMO', id: 'pitch_simulator' });
        return { scenario: 'Case A: Transient Network Failure (Auto-Recovered)', paymentId: payment.paymentId, result };
      }

      case 'case_b_high_value': {
        // Case B: ₹12,000 High Value -> Policy: REQUIRE_APPROVAL
        const payment = await Payment.create({
          paymentId: `pay_demo_b_${timestamp}`,
          orderId: `order_b_${timestamp}`,
          merchantId: merchant._id,
          amount: 1200000, // ₹12,000 > ₹5,000 threshold
          currency: 'INR',
          status: 'FAILED',
          customer: {
            name: 'Priya Iyer',
            email: 'priya.iyer@example.com',
            contact: '+919811122233'
          },
          method: 'card',
          cardDetails: { network: 'Mastercard', last4: '5521', type: 'credit', issuer: 'ICICI Bank' },
          failureCode: 'AUTHENTICATION_FAILED',
          failureReason: '3D Secure customer authentication timed out',
          failureCategory: 'AUTHENTICATION_FAILED'
        });

        await PaymentAttempt.create({
          paymentId: payment._id,
          attemptNumber: 1,
          status: 'FAILED',
          errorCode: 'AUTHENTICATION_FAILED',
          errorDescription: 'OTP session expired'
        });

        const recCase = await RecoveryService.createOrGetRecoveryCase(payment);
        const result = await RecoveryService.processRecoveryCase(recCase._id, {}, { type: 'DEMO', id: 'pitch_simulator' });
        return { scenario: 'Case B: High-Value Transaction (Enqueued in Approvals)', paymentId: payment.paymentId, result };
      }

      case 'case_c_max_retry': {
        // Case C: ₹1,200 with 3 Attempts -> Policy: BLOCK (RETRY_LIMIT_EXCEEDED)
        const payment = await Payment.create({
          paymentId: `pay_demo_c_${timestamp}`,
          orderId: `order_c_${timestamp}`,
          merchantId: merchant._id,
          amount: 120000, // ₹1,200
          currency: 'INR',
          status: 'FAILED',
          customer: {
            name: 'Amit Patel',
            email: 'amit.patel@example.com',
            contact: '+919822233344'
          },
          method: 'upi',
          upiDetails: { vpa: 'amit@okhdfcbank' },
          failureCode: 'INSUFFICIENT_FUNDS',
          failureReason: 'Transaction declined by customer bank due to insufficient funds',
          failureCategory: 'INSUFFICIENT_FUNDS'
        });

        // 3 previous attempts
        for (let i = 1; i <= 3; i++) {
          await PaymentAttempt.create({
            paymentId: payment._id,
            attemptNumber: i,
            status: 'FAILED',
            errorCode: 'INSUFFICIENT_FUNDS',
            errorDescription: 'Declined'
          });
        }

        const recCase = await RecoveryService.createOrGetRecoveryCase(payment);
        recCase.attemptCount = 3;
        await recCase.save();

        const result = await RecoveryService.processRecoveryCase(recCase._id, {}, { type: 'DEMO', id: 'pitch_simulator' });
        return { scenario: 'Case C: Maximum Retries Exhausted (Blocked by Policy)', paymentId: payment.paymentId, result };
      }

      case 'case_d_ai_failure': {
        // Case D: AI Provider Outage / Malformed -> Fallback Classifier -> REQUIRE_APPROVAL
        const payment = await Payment.create({
          paymentId: `pay_demo_d_${timestamp}`,
          orderId: `order_d_${timestamp}`,
          merchantId: merchant._id,
          amount: 320000, // ₹3,200
          currency: 'INR',
          status: 'FAILED',
          customer: {
            name: 'Ananya Roy',
            email: 'ananya.roy@example.com',
            contact: '+919833344455'
          },
          method: 'card',
          failureCode: 'GATEWAY_ERROR',
          failureReason: 'Bank switch unresponsive',
          failureCategory: 'BANK_DOWNTIME'
        });

        const recCase = await RecoveryService.createOrGetRecoveryCase(payment);
        const result = await RecoveryService.processRecoveryCase(
          recCase._id,
          { simulatedAiFailure: true }, // Triggers intentional simulated LLM 500 error
          { type: 'DEMO', id: 'pitch_simulator' }
        );
        return { scenario: 'Case D: AI Outage Fallback Resilience', paymentId: payment.paymentId, result };
      }

      case 'case_e_gateway_failure': {
        // Case E: Razorpay API Timeout during action execution -> ACTION_FAILED logged, case kept recoverable
        const payment = await Payment.create({
          paymentId: `pay_demo_e_${timestamp}`,
          orderId: `order_e_${timestamp}`,
          merchantId: merchant._id,
          amount: 250000, // ₹2,500
          currency: 'INR',
          status: 'FAILED',
          customer: {
            name: 'Vikram Singh',
            email: 'vikram.singh@example.com',
            contact: '+919844455566'
          },
          method: 'card',
          failureCode: 'GATEWAY_ERROR',
          failureReason: 'Timeout',
          failureCategory: 'TEMPORARY_NETWORK'
        });

        const recCase = await RecoveryService.createOrGetRecoveryCase(payment);
        try {
          await RecoveryService.processRecoveryCase(
            recCase._id,
            { simulatedGatewayFailure: true }, // Triggers simulated Razorpay 504 error
            { type: 'DEMO', id: 'pitch_simulator' }
          );
        } catch (err) {
          logger.info(`Case E expected failure caught gracefully: ${err.message}`);
        }
        return { scenario: 'Case E: Gateway Timeout Safe Failure', paymentId: payment.paymentId };
      }

      case 'case_f_duplicate_webhook': {
        // Case F: Duplicate Webhook -> Idempotency drops without second recovery
        const duplicateEventId = `evt_demo_f_${timestamp}`;
        const mockPayload = {
          id: duplicateEventId,
          event: 'payment.failed',
          payload: {
            payment: {
              entity: {
                id: `pay_demo_f_${timestamp}`,
                amount: 150000,
                error_code: 'GATEWAY_ERROR',
                error_description: 'Transient timeout'
              }
            }
          }
        };

        const firstResult = await WebhookService.processEvent(mockPayload, 'req_first');
        const secondResult = await WebhookService.processEvent(mockPayload, 'req_second_replay');
        return {
          scenario: 'Case F: Duplicate Webhook Replay Protection',
          firstDelivery: firstResult,
          secondDelivery: secondResult
        };
      }

      default:
        throw new Error(`Unknown demo scenario: ${scenarioId}`);
    }
  }
}
