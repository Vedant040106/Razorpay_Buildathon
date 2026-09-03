import { RecoveryService } from './recovery.service.js';
import { sendSuccess } from '../../utils/response.js';

export class RecoveryController {
  static async listCases(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const { status, priority, tier } = req.query;

      const result = await RecoveryService.listCases({
        merchantId: req.user?.merchantId,
        status,
        priority,
        tier,
        page,
        limit
      });

      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getCase(req, res, next) {
    try {
      const { id } = req.params;
      const caseDetail = await RecoveryService.getCaseDetail(id);
      return sendSuccess(res, { recoveryCase: caseDetail });
    } catch (err) {
      next(err);
    }
  }

  static async analyzeCase(req, res, next) {
    try {
      const { id } = req.params;
      const options = req.body || {};

      const result = await RecoveryService.processRecoveryCase(
        id,
        options,
        { type: 'USER', id: req.user.id, role: req.user.role },
        req.id
      );

      return sendSuccess(res, result, 200, {
        message: 'Recovery analysis and policy evaluation completed'
      });
    } catch (err) {
      next(err);
    }
  }
}
