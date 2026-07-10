import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePM } from '../../middleware/rbac';
import * as controller from './teams.controller';

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', requirePM, controller.create);
router.patch('/:id', requirePM, controller.update);
router.post('/:id/members', requirePM, controller.addMember);
router.delete('/:id/members/:userId', requirePM, controller.removeMember);

export default router;
