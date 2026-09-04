import { Router } from 'express';
import { RecoveryController } from './recovery.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/', RecoveryController.listCases);
router.get('/command-center', RecoveryController.getCommandCenter);
router.get('/:id', RecoveryController.getCase);
router.post('/:id/analyze', authorize('ADMIN', 'OPS_MANAGER'), RecoveryController.analyzeCase);

export default router;
