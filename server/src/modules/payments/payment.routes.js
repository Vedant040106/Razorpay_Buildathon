import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/', PaymentController.listPayments);
router.get('/:id', PaymentController.getPayment);
router.post('/', authorize('ADMIN', 'OPS_MANAGER'), PaymentController.createPayment);
router.post('/:id/fail', authorize('ADMIN', 'OPS_MANAGER'), PaymentController.recordFailure);

export default router;
