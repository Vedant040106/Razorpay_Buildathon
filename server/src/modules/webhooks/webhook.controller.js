import { WebhookService } from './webhook.service.js';
import { sendSuccess } from '../../utils/response.js';

export class WebhookController {
  static async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      WebhookService.verifySignature(req.rawBody, signature);

      const result = await WebhookService.processEvent(req.body, req.id);
      return sendSuccess(res, result, 200, { received: true });
    } catch (err) {
      next(err);
    }
  }
}
