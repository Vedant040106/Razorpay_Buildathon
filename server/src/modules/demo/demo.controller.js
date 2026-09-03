import { DemoService } from './demo.service.js';
import { sendSuccess } from '../../utils/response.js';

export class DemoController {
  static async simulate(req, res, next) {
    try {
      const { scenarioId } = req.params;
      const result = await DemoService.simulateScenario(scenarioId, req.user?.merchantId);
      return sendSuccess(res, result, 200, {
        message: `Scenario ${scenarioId} executed successfully`
      });
    } catch (err) {
      next(err);
    }
  }

  static async reset(req, res, next) {
    try {
      const result = await DemoService.resetBaseline(req.user?.merchantId);
      return sendSuccess(res, result, 200, {
        message: 'Demo state reset successfully'
      });
    } catch (err) {
      next(err);
    }
  }
}
