import { Notification } from '../models/Notification.js';
import { sendEmail } from './emailService.js';

/**
 * Create and send notification to staff member
 * @param {Object} options - Notification options
 * @param {string} options.userId - User ID of the staff member
 * @param {string} options.email - Email address of the staff member
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.type - Notification type (info, success, warning, error)
 * @param {string} options.category - Notification category
 * @param {Object} options.metadata - Additional metadata
 * @param {string} options.emailTemplate - Email template name (optional)
 * @param {Object} options.emailData - Email template data (optional)
 * @param {Object} options.io - Socket.IO instance (optional)
 * @returns {Promise<Object>} Created notification
 */
export const notifyStaff = async ({
  userId,
  email,
  title,
  message,
  type = 'info',
  category = 'Staff',
  metadata = {},
  emailTemplate = null,
  emailData = {},
  io = null,
}) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      userId,
      recipientEmail: email,
      title,
      message,
      type,
      category,
      metadata: new Map(Object.entries(metadata)),
      isRead: false,
    });

    // Send email if template provided
    if (emailTemplate && email) {
      try {
        await sendEmail(email, title, emailTemplate, emailData);
      } catch (emailError) {
        // Don't fail the notification creation if email fails
      }
    }

    // Emit real-time notification via Socket.IO if available
    if (io) {
      try {
        io.to(`user:${userId}`).emit('notification', {
          id: notification._id.toString(),
          title: notification.title,
          message: notification.message,
          type: notification.type,
          category: notification.category,
          timestamp: notification.timestamp.toISOString(),
          isRead: notification.isRead,
          metadata: Object.fromEntries(notification.metadata || []),
        });
      } catch (socketError) {
        // Don't fail the notification creation if socket fails
      }
    }

    return notification;
  } catch (error) {
    throw error;
  }
};

/**
 * Notify staff about event assignment
 */
export const notifyEventAssignment = async (staff, event, role, io = null) => {
  const eventDate = event.startAt ? new Date(event.startAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'TBD';

  const location = typeof event.location === 'object' 
    ? event.location.address || event.location.city || 'TBD'
    : event.location || 'TBD';

  const title = `Event Assignment: ${event.title}`;
  const message = `You have been assigned to "${event.title}" as ${role}. Event date: ${eventDate}. Location: ${location}. Please check your portal for details.`;

  return await notifyStaff({
    userId: staff.userId,
    email: staff.email,
    title,
    message,
    type: 'success',
    category: 'Event',
    metadata: {
      eventId: event._id?.toString() || event.id,
      eventTitle: event.title,
      role: role,
      eventDate: eventDate,
      location: location,
      assignmentId: event.assignments?.[event.assignments.length - 1]?._id?.toString(),
    },
    emailTemplate: 'event_assignment',
    emailData: {
      staffName: staff.name,
      eventName: event.title,
      eventDate: eventDate,
      location: location,
      role: role,
    },
    io,
  });
};

/**
 * Notify staff about shift assignment
 */
export const notifyShiftAssignment = async (staff, shift, event, io = null) => {
  const shiftDate = shift.date ? new Date(shift.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : 'TBD';

  const startTime = shift.startTime ? new Date(shift.startTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }) : 'TBD';

  const endTime = shift.endTime ? new Date(shift.endTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }) : 'TBD';

  const location = shift.location || (typeof event.location === 'object' 
    ? event.location.address || event.location.city || 'TBD'
    : event.location || 'TBD');

  const title = `Shift Scheduled: ${event.title || shift.eventTitle}`;
  const message = `You have been scheduled for a shift at "${event.title || shift.eventTitle}" on ${shiftDate} from ${startTime} to ${endTime}. Location: ${location}.${shift.instructions ? ` Instructions: ${shift.instructions}` : ''}`;

  return await notifyStaff({
    userId: staff.userId,
    email: staff.email,
    title,
    message,
    type: 'info',
    category: 'Shift',
    metadata: {
      shiftId: shift._id?.toString() || shift.id,
      eventId: shift.eventId?._id?.toString() || shift.eventId || event._id?.toString() || event.id,
      eventTitle: event.title || shift.eventTitle,
      shiftDate: shiftDate,
      startTime: startTime,
      endTime: endTime,
      location: location,
      role: shift.role,
      wage: shift.wage,
    },
    emailTemplate: 'shift_assignment',
    emailData: {
      staffName: staff.name,
      eventName: event.title || shift.eventTitle,
      shiftDate: shiftDate,
      startTime: startTime,
      endTime: endTime,
      location: location,
      role: shift.role || 'General Staff',
      wage: shift.wage || 0,
      instructions: shift.instructions || '',
    },
    io,
  });
};

