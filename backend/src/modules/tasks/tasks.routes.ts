import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requirePM, requireMember } from '../../middleware/rbac';
import * as controller from './tasks.controller';

export const projectTasksRouter = Router({ mergeParams: true });
projectTasksRouter.use(authenticate);
projectTasksRouter.get('/', controller.listForProject);
projectTasksRouter.post('/', requireMember, controller.create);

const taskRouter = Router();
taskRouter.use(authenticate);
taskRouter.get('/:id', controller.getById);
taskRouter.patch('/:id', controller.update);
taskRouter.post('/:id/assign', requirePM, controller.assign);
taskRouter.delete('/:id/assign/:userId', requirePM, controller.unassign);

export default taskRouter;
