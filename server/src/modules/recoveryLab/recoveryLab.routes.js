import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';
import * as RecoveryLabController from './recoveryLab.controller.js';

const router = Router();

router.use(authenticate);

// 1. Get active policy baseline
router.get('/current-policy', RecoveryLabController.getCurrentPolicy);

// 2. Run simulation against historical/demo failed payment data
router.post('/simulate', RecoveryLabController.runSimulation);

// 3. Policy Proposal Workflow
router.post('/propose', RecoveryLabController.createProposal);
router.get('/proposals', RecoveryLabController.listProposals);
router.post('/proposals/:id/approve', authorize('ADMIN', 'OPS_MANAGER'), RecoveryLabController.approveProposal);
router.post('/proposals/:id/reject', authorize('ADMIN', 'OPS_MANAGER'), RecoveryLabController.rejectProposal);

export default router;
