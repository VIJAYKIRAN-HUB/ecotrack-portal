import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { authenticate, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, requireAuth);

router.get('/', NotificationController.getMyNotifications);
router.patch('/:id/read', NotificationController.markAsRead);
router.post('/read-all', NotificationController.markAllAsRead);

export default router;
