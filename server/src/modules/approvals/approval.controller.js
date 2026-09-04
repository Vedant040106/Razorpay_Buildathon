import { ApprovalService } from './approval.service.js';
import { approveActionSchema, rejectActionSchema, approvalQuerySchema } from './approval.validation.js';
import { sendSuccess } from '../../utils/response.js';

export class ApprovalController {
  static async listApprovals(req, res, next) {
    try {
      const validatedQuery = approvalQuerySchema.parse(req.query);

      const result = await ApprovalService.listApprovals({ 
        merchantId: req.user?.merchantId,
        status: validatedQuery.status, 
        page: validatedQuery.page, 
        limit: validatedQuery.limit 
      });
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async approve(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = approveActionSchema.parse(req.body || {});

      const result = await ApprovalService.approve(
        id,
        req.user,
        validatedData.notes,
        req.id
      );

      return sendSuccess(res, result, 200, {
        message: 'Action approved and executed successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  static async reject(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = rejectActionSchema.parse(req.body || {});

      const result = await ApprovalService.reject(
        id,
        req.user,
        validatedData.notes,
        req.id
      );

      return sendSuccess(res, result, 200, {
        message: 'Action rejected and case closed as unrecoverable'
      });
    } catch (err) {
      next(err);
    }
  }
}
