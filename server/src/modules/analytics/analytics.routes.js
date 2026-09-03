import { Router } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', AnalyticsController.getOverview);

export default router;
