import { Router } from 'express';
import { DemoController } from './demo.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// Demo simulator routes (protected so only logged-in merchant can trigger)
router.use(authenticate);
router.post('/simulate/:scenarioId', DemoController.simulate);
router.post('/reset', DemoController.reset);

export default router;
