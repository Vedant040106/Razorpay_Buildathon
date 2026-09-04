import { Router } from 'express';
import { DemoController } from './demo.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// Demo simulator routes (protected: only authenticated staff can simulate/reset)
router.use(authenticate);
router.post('/simulate/:scenarioId', authorize('ADMIN', 'OPS_MANAGER'), DemoController.simulate);
router.post('/reset', authorize('ADMIN'), DemoController.reset);

export default router;
