import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  sendEmailNotification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/notificationController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Email notification endpoint
router.post('/email', authorize('ADMIN', 'SUPERVISOR'), sendEmailNotification);

// Get user notifications
router.get('/', getNotifications);

// Mark notification as read
router.put('/:id/read', markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', markAllNotificationsAsRead);

// Delete notification
router.delete('/:id', deleteNotification);

// Clear all notifications
router.delete('/clear/all', clearAllNotifications);

export default router;

