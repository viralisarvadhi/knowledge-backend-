import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register-token', authenticate, notificationController.registerToken);
router.get('/', authenticate, notificationController.getNotifications);
router.put('/:id/read', authenticate, notificationController.markRead);
router.delete('/:id', authenticate, notificationController.deleteNotification);

export default router;
