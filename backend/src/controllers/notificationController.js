import { asyncHandler } from '../utils/asyncHandler.js';
import { Notification } from '../models/Notification.js';
import { sendEmail } from '../utils/emailService.js';

// Helper to get Socket.IO instance from app
const getIO = (req) => {
  return req.app.get('io');
};

// @desc    Send email notification
// @route   POST /api/notifications/email
// @access  Private/Admin/Supervisor
export const sendEmailNotification = asyncHandler(async (req, res) => {
  const { to, subject, template, data } = req.body;

  if (!to || !subject || !template) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: to, subject, template',
    });
  }

  try {
    // Send email using email service
    const emailSent = await sendEmail(to, subject, template, data);

    if (emailSent) {
      // Create notification record
      const notification = await Notification.create({
        userId: req.user.id,
        recipientEmail: to,
        title: subject,
        message: generateEmailMessage(template, data),
        type: getNotificationType(template),
        category: getNotificationCategory(template),
        isRead: false,
      });

      // Emit real-time notification via Socket.IO
      const io = getIO(req);
      if (io) {
        io.to(`user:${req.user.id}`).emit('notification', {
          id: notification._id.toString(),
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          timestamp: notification.timestamp.toISOString(),
          isRead: notification.isRead,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Email notification sent successfully',
        data: notification,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send email notification',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error sending email notification',
    });
  }
});

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, filter, category } = req.query;
  const skip = (page - 1) * limit;

  const query = { userId: req.user.id };

  if (filter === 'unread') {
    query.isRead = false;
  } else if (filter === 'read') {
    query.isRead = true;
  }

  if (category) {
    query.category = category;
  }

  const notifications = await Notification.find(query)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    userId: req.user.id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    data: notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
    unreadCount,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      error: 'Notification not found',
    });
  }

  notification.isRead = true;
  await notification.save();

  // Emit real-time update via Socket.IO
  const io = getIO(req);
  if (io) {
    io.to(`user:${req.user.id}`).emit('notificationUpdate', {
      id: notification._id.toString(),
      isRead: notification.isRead,
    });
  }

  res.status(200).json({
    success: true,
    data: notification,
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { userId: req.user.id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: `Marked ${result.modifiedCount} notifications as read`,
    modifiedCount: result.modifiedCount,
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.id,
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      error: 'Notification not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully',
  });
});

// @desc    Clear all notifications
// @route   DELETE /api/notifications/clear/all
// @access  Private
export const clearAllNotifications = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({ userId: req.user.id });

  res.status(200).json({
    success: true,
    message: `Cleared ${result.deletedCount} notifications`,
    deletedCount: result.deletedCount,
  });
});

// Helper functions
const generateEmailMessage = (template, data) => {
  const templates = {
    payment_approved: `Your payment of QAR ${data.amount?.toLocaleString()} for ${data.eventName} has been approved and is being processed.`,
    payment_pending: `A payment of QAR ${data.amount?.toLocaleString()} for ${data.eventName} is pending approval.`,
    event_acceptance: `You have been assigned to ${data.eventName} on ${data.eventDate} at ${data.location}. Please confirm your availability.`,
    event_rejection: `Your application for ${data.eventName} was not selected. ${data.reason || ''}`,
    event_assignment: `You have been assigned to ${data.eventName} on ${data.eventDate} at ${data.location} as ${data.role}. Please check your portal for details.`,
    shift_assignment: `You have been scheduled for a shift at ${data.eventName} on ${data.shiftDate} from ${data.startTime} to ${data.endTime}. Location: ${data.location}.`,
  };

  return templates[template] || 'You have a new notification.';
};

const getNotificationType = (template) => {
  const typeMap = {
    payment_approved: 'success',
    payment_pending: 'info',
    event_acceptance: 'success',
    event_rejection: 'warning',
    event_assignment: 'success',
    shift_assignment: 'info',
  };
  return typeMap[template] || 'info';
};

const getNotificationCategory = (template) => {
  if (template.includes('payment')) return 'Payment';
  if (template === 'event_assignment') return 'Event';
  if (template === 'shift_assignment') return 'Shift';
  if (template.includes('event')) return 'Application';
  return 'System';
};

