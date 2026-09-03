import { Router } from 'express';
import { ApprovalController } from './approval.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/', ApprovalController.listApprovals);
router.post('/:id/approve', authorize('ADMIN', 'OPS_MANAGER'), ApprovalController.approve);
router.post('/:id/reject', authorize('ADMIN', 'OPS_MANAGER'), ApprovalController.reject);

export default router;
