import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePM } from '../../middleware/rbac';
import * as controller from './clients.controller';

const router = Router();

router.use(authenticate);

router.get('/', requirePM, controller.list);
router.get('/:id', requirePM, controller.getById);
router.post('/', requirePM, controller.create);
router.patch('/:id', requirePM, controller.update);
router.delete('/:id', requirePM, controller.remove);

export default router;
