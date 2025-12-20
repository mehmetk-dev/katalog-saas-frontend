import { Router } from 'express';

import { requireAuth } from '../middlewares/auth';
import * as UserController from '../controllers/users';

const router = Router();

router.use(requireAuth);

router.get('/me', UserController.getMe);
router.put('/me', UserController.updateMe);
router.delete('/me', UserController.deleteMe);
router.post('/me/export', UserController.incrementExportsUsed);
router.post('/me/upgrade', UserController.upgradeToPro);
router.post('/me/welcome', UserController.sendWelcomeNotification);

export default router;
