import { ApprovalService } from './approval.service.js';
import { sendSuccess } from '../../utils/response.js';

export class ApprovalController {
  static async listApprovals(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const status = req.query.status || 'PENDING';

      const result = await ApprovalService.listApprovals({ status, page, limit });
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async approve(req, res, next) {
    try {
      const { id } = req.params;
      const { notes } = req.body || {};

      const result = await ApprovalService.approve(
        id,
        req.user,
        notes,
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
      const { notes } = req.body || {};

      const result = await ApprovalService.reject(
        id,
        req.user,
        notes,
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
