import { AuditService } from './audit.service.js';
import { sendSuccess } from '../../utils/response.js';

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
      const timeline = await AuditService.getTimelineForEntity(entityId);
      return sendSuccess(res, { timeline });
    } catch (err) {
      next(err);
    }
  }
}
