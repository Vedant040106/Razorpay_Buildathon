import { PaymentService } from './payment.service.js';
import { createPaymentSchema, recordFailureSchema } from './payment.validation.js';
import { sendSuccess } from '../../utils/response.js';

export class PaymentController {
  static async listPayments(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const { status, method, failureCategory, search } = req.query;

      const result = await PaymentService.listPayments({
        merchantId: req.user?.merchantId,
        status,
        method,
        failureCategory,
        search,
        page,
        limit
      });

      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getPayment(req, res, next) {
    try {
      const { id } = req.params;
      const payment = await PaymentService.getPaymentById(id);
      return sendSuccess(res, { payment });
    } catch (err) {
      next(err);
    }
  }

  static async createPayment(req, res, next) {
    try {
      const validatedData = createPaymentSchema.parse(req.body);
      const payment = await PaymentService.createPayment(
        req.user.merchantId,
        validatedData,
        req.id
      );
      return sendSuccess(res, { payment }, 201);
    } catch (err) {
      next(err);
    }
  }

  static async recordFailure(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = recordFailureSchema.parse(req.body);
      const result = await PaymentService.recordPaymentFailure(id, validatedData, req.id);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
