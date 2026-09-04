import { AuditService } from './audit.service.js';
import { Payment } from '../payments/payment.model.js';
import { RecoveryCase } from '../recovery/recoveryCase.model.js';
import { sendSuccess } from '../../utils/response.js';
import { NotFoundError } from '../../utils/errors.js';

export class AuditController {
  static async listEvents(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '50', 10);
      const { entityType, eventType, requestId } = req.query;

      const result = await AuditService.listEvents({
        entityType,
        eventType,
        requestId,
        page,
        limit
      });

      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getEntityTimeline(req, res, next) {
    try {
      const { entityId } = req.params;
      const merchantId = req.user?.merchantId;

      if (merchantId) {
        const payment = await Payment.findOne({ paymentId: entityId }).lean();
        if (payment && payment.merchantId && payment.merchantId.toString() !== merchantId.toString()) {
          throw new NotFoundError(`Entity ${entityId} not found`);
        }

        const recCase = await RecoveryCase.findOne({ caseId: entityId }).lean();
        if (recCase && recCase.merchantId && recCase.merchantId.toString() !== merchantId.toString()) {
          throw new NotFoundError(`Entity ${entityId} not found`);
        }
      }

      const timeline = await AuditService.getTimelineForEntity(entityId);
      return sendSuccess(res, { timeline });
    } catch (err) {
      next(err);
    }
  }

  static async verifyLedger(req, res, next) {
    try {
      const result = await AuditService.verifyLedgerIntegrity();
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
