import { PaymentService } from './payment.service.js';
import { createPaymentSchema, recordFailureSchema, listPaymentsQuerySchema } from './payment.validation.js';
import { sendSuccess } from '../../utils/response.js';

export class PaymentController {
  static async listPayments(req, res, next) {
    try {
      const validatedQuery = listPaymentsQuerySchema.parse(req.query);

      const result = await PaymentService.listPayments({
        merchantId: req.user?.merchantId,
        status: validatedQuery.status,
        method: validatedQuery.method,
        failureCategory: validatedQuery.failureCategory,
        search: validatedQuery.search,
        page: validatedQuery.page,
        limit: validatedQuery.limit
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
