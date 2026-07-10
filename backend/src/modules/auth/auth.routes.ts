import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './auth.controller';

const router = Router();

router.post('/register', controller.register);
router.post('/login',    controller.login);
router.post('/refresh',  controller.refresh);
router.post('/logout',   authenticate, controller.logout);

export default router;
