import { Router } from 'express';
import { WebhookController } from './webhook.controller.js';

const router = Router();

// Razorpay sends webhooks without Bearer token; security is enforced via HMAC-SHA256 signature
router.post('/razorpay', WebhookController.handleWebhook);

export default router;
