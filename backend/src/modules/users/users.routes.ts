import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePM, requireAdmin } from '../../middleware/rbac';
import * as controller from './users.controller';

const router = Router();

router.use(authenticate);

router.get('/me', controller.getMe);
router.patch('/me', controller.updateMe);
router.get('/', requirePM, controller.list);
router.get('/:id', controller.getById);
router.patch('/:id', requireAdmin, controller.updateAsAdmin);

export default router;
