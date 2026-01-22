import { Router } from 'express';

import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    cancelSubscription
} from '../controllers/notifications';
import { requireAuth } from '../middlewares/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Get user notifications
router.get('/', getNotifications);

// Mark single notification as read
router.patch('/:id/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete all notifications
router.delete('/delete-all', deleteAllNotifications);

// Delete notification
router.delete('/:id', deleteNotification);

// Cancel subscription
router.post('/cancel-subscription', cancelSubscription);

export default router;

