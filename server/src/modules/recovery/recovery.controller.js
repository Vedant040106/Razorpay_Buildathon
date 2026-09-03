import { RecoveryService } from './recovery.service.js';
import { listCasesQuerySchema, caseIdParamSchema } from './recovery.validation.js';
import { sendSuccess } from '../../utils/response.js';

export class RecoveryController {
  static async listCases(req, res, next) {
    try {
      const validatedQuery = listCasesQuerySchema.parse(req.query);

      const result = await RecoveryService.listCases({
        merchantId: req.user?.merchantId,
        status: validatedQuery.status,
        priority: validatedQuery.priority,
        tier: validatedQuery.tier,
        page: validatedQuery.page,
        limit: validatedQuery.limit
      });

      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  static async getCase(req, res, next) {
    try {
      const { id } = caseIdParamSchema.parse(req.params);
      const caseDetail = await RecoveryService.getCaseDetail(id);
      return sendSuccess(res, { recoveryCase: caseDetail });
    } catch (err) {
      next(err);
    }
  }

  static async analyzeCase(req, res, next) {
    try {
      const { id } = caseIdParamSchema.parse(req.params);
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
