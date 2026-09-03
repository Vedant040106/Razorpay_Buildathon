import { AnalyticsService } from './analytics.service.js';
import { sendSuccess } from '../../utils/response.js';

export class AnalyticsController {
  static async getOverview(req, res, next) {
    try {
      const metrics = await AnalyticsService.getOverviewMetrics(req.user?.merchantId);
      return sendSuccess(res, { metrics });
    } catch (err) {
      next(err);
    }
  }
}
