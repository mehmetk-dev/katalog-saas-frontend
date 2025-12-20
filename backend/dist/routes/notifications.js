"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_1 = require("../controllers/notifications");
const router = (0, express_1.Router)();
// Get user notifications
router.get('/', notifications_1.getNotifications);
// Mark single notification as read
router.patch('/:id/read', notifications_1.markAsRead);
// Mark all notifications as read
router.patch('/read-all', notifications_1.markAllAsRead);
// Delete all notifications
router.delete('/delete-all', notifications_1.deleteAllNotifications);
// Delete notification
router.delete('/:id', notifications_1.deleteNotification);
// Cancel subscription
router.post('/cancel-subscription', notifications_1.cancelSubscription);
exports.default = router;
