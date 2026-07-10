import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';
import * as controller from './dashboard.controller';

const router = Router();

router.use(authenticate);

router.get('/admin', requireAdmin, controller.getAdmin);
router.get('/', controller.getForCaller);

export default router;
