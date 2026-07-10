import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePM } from '../../middleware/rbac';
import * as controller from './projects.controller';

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', requirePM, controller.create);
router.patch('/:id', requirePM, controller.update);

router.get('/:id/engagements', requirePM, controller.listEngagements);
router.post('/:id/engagements', requirePM, controller.addEngagement);
router.patch('/:id/engagements/:userId', requirePM, controller.updateEngagement);
router.delete('/:id/engagements/:userId', requirePM, controller.removeEngagement);

export default router;
