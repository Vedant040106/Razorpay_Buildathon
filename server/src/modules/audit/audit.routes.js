import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', AuditController.listEvents);
router.get('/timeline/:entityId', AuditController.getEntityTimeline);

export default router;
