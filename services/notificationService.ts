import { Notification } from '../types';

import { notifications as apiNotifications } from './api';

// Email notification service
export const sendEmailNotification = async (
  to: string,
  subject: string,
  template: 'payment' | 'event_acceptance' | 'event_rejection' | 'payment_approved' | 'payment_pending',
  data: Record<string, any>
): Promise<boolean> => {
  try {
    const response = await apiNotifications.sendEmail(to, subject, template, data);
    return response.success === true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
};

// Payment notification
export const notifyPaymentApproved = async (
  staffEmail: string,
  staffName: string,
  amount: number,
  eventName: string
): Promise<boolean> => {
  return sendEmailNotification(
    staffEmail,
    `Payment Approved - QAR ${amount.toLocaleString()}`,
    'payment_approved',
    {
      staffName,
      amount,
      eventName,
      currency: 'QAR',
    }
  );
};

// Payment pending notification
export const notifyPaymentPending = async (
  staffEmail: string,
  staffName: string,
  amount: number,
  eventName: string
): Promise<boolean> => {
  return sendEmailNotification(
    staffEmail,
    `Payment Pending Approval - QAR ${amount.toLocaleString()}`,
    'payment_pending',
    {
      staffName,
      amount,
      eventName,
      currency: 'QAR',
    }
  );
};

// Event acceptance notification
export const notifyEventAccepted = async (
  staffEmail: string,
  staffName: string,
  eventName: string,
  eventDate: string,
  location: string
): Promise<boolean> => {
  return sendEmailNotification(
    staffEmail,
    `Event Assignment: ${eventName}`,
    'event_acceptance',
    {
      staffName,
      eventName,
      eventDate,
      location,
    }
  );
};

// Event rejection notification
export const notifyEventRejected = async (
  staffEmail: string,
  staffName: string,
  eventName: string,
  reason?: string
): Promise<boolean> => {
  return sendEmailNotification(
    staffEmail,
    `Event Application Update: ${eventName}`,
    'event_rejection',
    {
      staffName,
      eventName,
      reason: reason || 'Unfortunately, we were unable to assign you to this event.',
    }
  );
};

// Bulk notification helper
export const notifyBulkPayments = async (
  payments: Array<{
    staffEmail: string;
    staffName: string;
    amount: number;
    eventName: string;
  }>
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const payment of payments) {
    const result = await notifyPaymentApproved(
      payment.staffEmail,
      payment.staffName,
      payment.amount,
      payment.eventName
    );
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
};

