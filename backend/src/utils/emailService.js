// Email service utility
// In production, integrate with services like SendGrid, AWS SES, or Nodemailer

import nodemailer from 'nodemailer';

// Configure email transporter
// For production, use environment variables for credentials
const createTransporter = () => {
  // Example using Gmail (for development)
  // For production, use a proper email service
  if (process.env.EMAIL_SERVICE === 'gmail') {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Gmail email service configured but EMAIL_USER or EMAIL_PASSWORD not set');
      return createMockTransporter();
    }
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Example using SMTP (recommended for production)
  // Support both SMTP_* and MAIL_* environment variable naming conventions
  const smtpHost = process.env.SMTP_HOST || process.env.MAIL_HOST;
  const smtpPort = process.env.SMTP_PORT || process.env.MAIL_PORT || '587';
  const smtpUser = process.env.SMTP_USER || process.env.MAIL_USERNAME;
  const smtpPassword = process.env.SMTP_PASSWORD || process.env.MAIL_PASSWORD;
  const smtpSecure = process.env.SMTP_SECURE || (process.env.MAIL_ENCRYPTION === 'ssl' ? 'true' : 'false');
  const mailFrom = process.env.EMAIL_FROM || process.env.MAIL_FROM_ADDRESS || 'noreply@liywan.com';
  const mailFromName = process.env.EMAIL_FROM_NAME || process.env.MAIL_FROM_NAME || 'LIYWAN';

  if (smtpHost) {
    if (!smtpUser || !smtpPassword) {
      console.warn('⚠️ SMTP configured but SMTP_USER/MAIL_USERNAME or SMTP_PASSWORD/MAIL_PASSWORD not set');
      return createMockTransporter();
    }
    
    // Determine secure connection: port 465 or encryption=ssl means secure=true
    const isSecure = smtpPort === '465' || smtpSecure === 'true' || process.env.MAIL_ENCRYPTION === 'ssl';
    
    return nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: isSecure, // true for 465/ssl, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      // Optional: Add connection timeout
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false,
      },
    });
  }

  // Mock transporter for development (logs emails instead of sending)
  console.warn('⚠️ No email service configured. Using mock transporter (emails will not be sent).');
  console.warn('⚠️ To enable email sending, configure EMAIL_SERVICE=gmail or SMTP_HOST in .env file');
  return createMockTransporter();
};

// Mock transporter for development
const createMockTransporter = () => {
  return {
    sendMail: async (options) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 [MOCK EMAIL] Would send email:');
        console.log('   To:', options.to);
        console.log('   Subject:', options.subject);
        console.log('   From:', options.from);
      }
      return { messageId: 'mock-' + Date.now() };
    },
  };
};

const transporter = createTransporter();

// Email templates
const emailTemplates = {
  payment_approved: (data) => ({
    subject: `Payment Approved - QAR ${data.amount?.toLocaleString()}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8A1538; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .amount { font-size: 24px; font-weight: bold; color: #8A1538; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LIYWAN</h1>
          </div>
          <div class="content">
            <h2>Payment Approved</h2>
            <p>Dear ${data.staffName},</p>
            <p>Your payment has been approved and is being processed.</p>
            <p><strong>Event:</strong> ${data.eventName}</p>
            <p class="amount">Amount: QAR ${data.amount?.toLocaleString()}</p>
            <p>The payment will be processed within 3-5 business days.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from LIYWAN. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  payment_pending: (data) => ({
    subject: `Payment Pending Approval - QAR ${data.amount?.toLocaleString()}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8A1538; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .amount { font-size: 24px; font-weight: bold; color: #8A1538; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LIYWAN</h1>
          </div>
          <div class="content">
            <h2>Payment Pending Approval</h2>
            <p>Dear ${data.staffName},</p>
            <p>A payment is pending approval for your services.</p>
            <p><strong>Event:</strong> ${data.eventName}</p>
            <p class="amount">Amount: QAR ${data.amount?.toLocaleString()}</p>
            <p>You will be notified once the payment is approved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  event_acceptance: (data) => ({
    subject: `Event Assignment: ${data.eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8A1538; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background: #8A1538; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LIYWAN</h1>
          </div>
          <div class="content">
            <h2>Event Assignment Confirmed</h2>
            <p>Dear ${data.staffName},</p>
            <p>Congratulations! You have been assigned to the following event:</p>
            <p><strong>Event:</strong> ${data.eventName}</p>
            <p><strong>Date:</strong> ${data.eventDate}</p>
            <p><strong>Location:</strong> ${data.location}</p>
            <p>Please confirm your availability and review the event details in your portal.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/staff" class="button">View Event Details</a>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  event_rejection: (data) => ({
    subject: `Event Application Update: ${data.eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8A1538; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LIYWAN</h1>
          </div>
          <div class="content">
            <h2>Application Update</h2>
            <p>Dear ${data.staffName},</p>
            <p>Thank you for your interest in ${data.eventName}.</p>
            <p>${data.reason || 'Unfortunately, we were unable to assign you to this event at this time.'}</p>
            <p>We encourage you to apply for future events that match your skills and availability.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  event_assignment: (data) => ({
    subject: `🎉 Event Assignment: ${data.eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8A1538; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #8A1538; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #8A1538; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 LIYWAN</h1>
            <p style="margin: 0; font-size: 18px;">Event Assignment Confirmed</p>
          </div>
          <div class="content">
            <h2>Congratulations, ${data.staffName}!</h2>
            <p>You have been successfully assigned to an event. Here are the details:</p>
            
            <div class="info-box">
              <p style="margin: 5px 0;"><strong>Event:</strong> ${data.eventName}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${data.eventDate}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${data.location}</p>
              <p style="margin: 5px 0;"><strong>Your Role:</strong> ${data.role}</p>
            </div>
            
            <p>Please log in to your staff portal to:</p>
            <ul>
              <li>Review complete event details</li>
              <li>Confirm your availability</li>
              <li>View your shift schedule</li>
              <li>Access event instructions</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/staff" class="button">View Event in Portal</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from LIYWAN. Please do not reply.</p>
            <p>If you have questions, contact your supervisor or the event coordinator.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  shift_assignment: (data) => ({
    subject: `📅 Shift Scheduled: ${data.eventName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #3B82F6; margin: 15px 0; }
          .wage { font-size: 20px; font-weight: bold; color: #10B981; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 LIYWAN</h1>
            <p style="margin: 0; font-size: 18px;">Shift Schedule Notification</p>
          </div>
          <div class="content">
            <h2>Hello ${data.staffName}!</h2>
            <p>A shift has been scheduled for you. Please review the details below:</p>
            
            <div class="info-box">
              <p style="margin: 5px 0;"><strong>Event:</strong> ${data.eventName}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${data.shiftDate}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
              <p style="margin: 5px 0;"><strong>Location:</strong> ${data.location}</p>
              <p style="margin: 5px 0;"><strong>Role:</strong> ${data.role}</p>
              ${data.wage > 0 ? `<p style="margin: 5px 0;"><strong>Wage:</strong> <span class="wage">QAR ${data.wage.toLocaleString()}</span></p>` : ''}
            </div>
            
            ${data.instructions ? `
            <div class="info-box" style="background: #FEF3C7; border-left-color: #F59E0B;">
              <p style="margin: 0;"><strong>Special Instructions:</strong></p>
              <p style="margin: 5px 0 0 0;">${data.instructions}</p>
            </div>
            ` : ''}
            
            <p><strong>Important:</strong> Please arrive 15 minutes before your shift start time.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/staff" class="button">View Shift Details</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from LIYWAN. Please do not reply.</p>
            <p>If you need to make changes, contact your supervisor immediately.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  password_reset: (data) => ({
    subject: '🔐 Password Reset Request - LIYWAN',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8A1538; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 14px 30px; background: #8A1538; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .warning-box { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .code { background: #f3f4f6; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 LIYWAN</h1>
            <p style="margin: 0; font-size: 18px;">Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Hello ${data.name || 'User'}!</h2>
            <p>We received a request to reset your password for your LIYWAN account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="code">${data.resetUrl}</div>
            
            ${data.resetToken ? `
            <div class="warning-box" style="background: #EFF6FF; border-left-color: #3B82F6;">
              <p style="margin: 0;"><strong>🔧 Development Mode:</strong></p>
              <p style="margin: 10px 0 0 0;">You can also manually enter this reset token in the password reset form:</p>
              <div class="code" style="background: #DBEAFE; border: 2px solid #3B82F6; font-weight: bold; text-align: center; padding: 15px; margin: 10px 0;">${data.resetToken}</div>
            </div>
            ` : ''}
            
            <div class="warning-box">
              <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>This link will expire in <strong>10 minutes</strong></li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Your password will not change until you click the link above or enter the token</li>
              </ul>
            </div>
            
            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              For security reasons, this link can only be used once. If you need to reset your password again, please request a new link.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from LIYWAN. Please do not reply.</p>
            <p>If you have questions, contact support at ${process.env.SUPPORT_EMAIL || 'support@liywan.com'}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  password_changed: (data) => ({
    subject: '✅ Password Changed Successfully - LIYWAN',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
          .success-box { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ LIYWAN</h1>
            <p style="margin: 0; font-size: 18px;">Password Changed</p>
          </div>
          <div class="content">
            <h2>Hello ${data.name || 'User'}!</h2>
            <p>Your password has been successfully changed.</p>
            
            <div class="success-box">
              <p style="margin: 0;"><strong>✅ Password Updated</strong></p>
              <p style="margin: 5px 0 0 0;">Date: ${new Date().toLocaleString()}</p>
            </div>
            
            <p>If you did not make this change, please contact support immediately at ${process.env.SUPPORT_EMAIL || 'support@liywan.com'}</p>
          </div>
          <div class="footer">
            <p>This is an automated message from LIYWAN. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  application_submitted: (data) => ({
    subject: '🎉 Application Received - Welcome to LIYWAN!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8A1538 0%, #A6264A 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 14px 30px; background: #8A1538; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .info-box { background: white; padding: 20px; border-left: 4px solid #8A1538; margin: 20px 0; border-radius: 5px; }
          .success-box { background: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .quiz-score { font-size: 24px; font-weight: bold; color: #3B82F6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 LIYWAN</h1>
            <p style="margin: 0; font-size: 18px;">Application Received</p>
          </div>
          <div class="content">
            <h2>Hello ${data.name}!</h2>
            <p>Thank you for applying to join LIYWAN! We're excited to have you as part of our team.</p>
            
            <div class="success-box">
              <p style="margin: 0;"><strong>✅ Your Account Has Been Created!</strong></p>
              <p style="margin: 5px 0 0 0;">You can now log in to your Staff Portal using your email and password.</p>
            </div>
            
            <div class="info-box">
              <h3 style="margin-top: 0;">Application Details</h3>
              <p style="margin: 5px 0;"><strong>Role Applied:</strong> ${data.roleApplied}</p>
              <p style="margin: 5px 0;"><strong>Experience:</strong> ${data.experience || 'Not specified'}</p>
              ${data.quizScore ? `<p style="margin: 5px 0;"><strong>Quiz Score:</strong> <span class="quiz-score">${data.quizScore}%</span></p>` : ''}
              <p style="margin: 5px 0;"><strong>Status:</strong> ${data.status || 'Pending Review'}</p>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Our team will review your application</li>
              <li>You'll receive updates via email</li>
              <li>You can track your application status in your Staff Portal</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Login to Staff Portal</a>
            </div>
            
            <div class="info-box" style="background: #EFF6FF; border-left-color: #3B82F6; margin-top: 30px;">
              <p style="margin: 0; font-weight: bold; color: #1F2937;">🔐 Your Login Credentials:</p>
              <p style="margin: 10px 0 5px 0;"><strong>Email:</strong> ${data.email}</p>
              ${data.password ? `
                <p style="margin: 5px 0;"><strong>Password:</strong> <span style="font-family: monospace; background: #F3F4F6; padding: 4px 8px; border-radius: 4px;">${data.password}</span></p>
                <p style="margin: 10px 0 0 0; color: #EF4444; font-size: 13px;"><strong>⚠️ Important:</strong> Please save this password securely. You can change it after logging in.</p>
              ` : `
                <p style="margin: 5px 0;"><strong>Password:</strong> Use the password you set during the application process.</p>
              `}
              <p style="margin: 15px 0 0 0; font-size: 13px; color: #6B7280;">
                You can now log in to your Staff Portal to track your application status, view your profile, and access all features.
              </p>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from LIYWAN. Please do not reply.</p>
            <p>If you have questions, contact us at ${process.env.SUPPORT_EMAIL || 'support@liywan.com'}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  application_approved: (data) => ({
    subject: '🎉 Congratulations! Your Application Has Been Approved - LIYWAN',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 14px 30px; background: #10B981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .success-box { background: #D1FAE5; border-left: 4px solid #10B981; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 LIYWAN</h1>
            <p style="margin: 0; font-size: 18px;">Application Approved</p>
          </div>
          <div class="content">
            <h2>Congratulations, ${data.name}!</h2>
            <p>We're thrilled to inform you that your application has been approved!</p>
            
            <div class="success-box">
              <p style="margin: 0; font-size: 18px;"><strong>✅ Welcome to the LIYWAN Team!</strong></p>
              <p style="margin: 10px 0 0 0;">You're now an official member of our elite event staffing team.</p>
            </div>
            
            <p><strong>What's next?</strong></p>
            <ul>
              <li>Log in to your Staff Portal to complete your profile</li>
              <li>Upload any required documents</li>
              <li>Start browsing available events and shifts</li>
              <li>Get matched with exciting opportunities</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Access Staff Portal</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from LIYWAN. Please do not reply.</p>
            <p>Welcome aboard! We're excited to work with you.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  interview_scheduled: (data) => ({
    subject: `📅 Interview Scheduled - LIYWAN - ${data.roleApplied || 'Position'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 14px 30px; background: #3B82F6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .info-box { background: white; padding: 20px; border-left: 4px solid #3B82F6; margin: 20px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .highlight-box { background: #EFF6FF; border-left: 4px solid #3B82F6; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .time-badge { display: inline-block; background: #3B82F6; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          .location-badge { display: inline-block; background: #10B981; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          ul { margin: 10px 0; padding-left: 20px; }
          li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">📅 LIYWAN</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Interview Scheduled</p>
          </div>
          <div class="content">
            <h2 style="color: #1F2937; margin-top: 0;">Hello ${data.name}!</h2>
            <p>Congratulations! We are pleased to invite you for an interview for the <strong>${data.roleApplied || 'position'}</strong> role at LIYWAN.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #3B82F6;">📋 Interview Details</h3>
              <p style="margin: 10px 0;"><strong>Position:</strong> ${data.roleApplied || 'N/A'}</p>
              <p style="margin: 10px 0;"><strong>Date:</strong> ${data.interviewDate || 'N/A'}</p>
              <p style="margin: 10px 0;"><strong>Time:</strong> <span class="time-badge">${data.interviewTime || 'N/A'}</span></p>
              ${data.interviewType === 'online' && data.meetingLink ? `
                <p style="margin: 10px 0;"><strong>Meeting Link:</strong> <a href="${data.meetingLink}" style="color: #3B82F6; text-decoration: none; font-weight: bold;">${data.meetingLink}</a></p>
                <p style="margin: 10px 0; color: #6B7280; font-size: 14px;">This is an online interview. Please click the link above to join the meeting.</p>
              ` : `
                <p style="margin: 10px 0;"><strong>Location:</strong> <span class="location-badge">${data.interviewLocation || 'N/A'}</span></p>
                <p style="margin: 10px 0; color: #6B7280; font-size: 14px;">Please arrive 10 minutes early for check-in.</p>
              `}
              ${data.interviewer ? `<p style="margin: 10px 0;"><strong>Interviewer:</strong> ${data.interviewer}</p>` : ''}
            </div>
            
            ${data.interviewNotes ? `
            <div class="highlight-box">
              <p style="margin: 0;"><strong>📝 Additional Information:</strong></p>
              <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${data.interviewNotes}</p>
            </div>
            ` : ''}
            
            <div class="highlight-box" style="background: #FEF3C7; border-left-color: #F59E0B;">
              <p style="margin: 0;"><strong>⚠️ Important Reminders:</strong></p>
              <ul style="margin: 10px 0;">
                <li>Please bring a copy of your CV/Resume</li>
                <li>Bring a valid ID (QID or Passport)</li>
                <li>Dress professionally</li>
                ${data.interviewType === 'online' ? '<li>Test your internet connection and camera/microphone before the interview</li>' : '<li>Plan your route in advance to ensure timely arrival</li>'}
                <li>Prepare questions about the role and LIYWAN</li>
              </ul>
            </div>
            
            <p style="margin-top: 25px;">We look forward to meeting you and learning more about your experience and how you can contribute to our team.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              ${data.interviewType === 'online' && data.meetingLink ? `
                <a href="${data.meetingLink}" class="button">Join Interview Meeting</a>
              ` : `
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/staff" class="button">View Application Status</a>
              `}
            </div>
            
            <p style="color: #6B7280; font-size: 14px; margin-top: 25px;">
              <strong>Need to reschedule?</strong> Please contact us as soon as possible at ${process.env.SUPPORT_EMAIL || 'support@liywan.com'} or reply to this email.
            </p>
          </div>
          <div class="footer">
            <p>This is an automated message from LIYWAN. If you have questions, please contact us.</p>
            <p>We're excited to meet you! 🎉</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  application_rejected: (data) => ({
    subject: 'Application Update - LIYWAN',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6B7280; color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
          .info-box { background: #F3F4F6; border-left: 4px solid #6B7280; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LIYWAN</h1>
            <p style="margin: 0; font-size: 18px;">Application Update</p>
          </div>
          <div class="content">
            <h2>Hello ${data.name},</h2>
            <p>Thank you for your interest in joining LIYWAN. After careful review, we regret to inform you that we are unable to proceed with your application at this time.</p>
            
            <div class="info-box">
              <p style="margin: 0;"><strong>Application Status:</strong> Not Approved</p>
              <p style="margin: 5px 0 0 0;">Role Applied: ${data.roleApplied}</p>
            </div>
            
            <p>We encourage you to:</p>
            <ul>
              <li>Gain more experience in event staffing</li>
              <li>Reapply in the future when you meet our requirements</li>
              <li>Consider other roles that might be a better fit</li>
            </ul>
            
            <p>We appreciate your interest and wish you the best in your career journey.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from LIYWAN. Please do not reply.</p>
            <p>If you have questions, contact us at ${process.env.SUPPORT_EMAIL || 'support@liywan.com'}</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Send email function
export const sendEmail = async (to, subject, template, data) => {
  try {
    const templateData = emailTemplates[template];
    
    if (!templateData) {
      return false;
    }

    const emailContent = templateData(data);
    
    // Support both EMAIL_* and MAIL_* environment variable naming conventions
    const mailFrom = process.env.EMAIL_FROM || process.env.MAIL_FROM_ADDRESS || 'noreply@liywan.com';
    const mailFromName = process.env.EMAIL_FROM_NAME || process.env.MAIL_FROM_NAME || 'LIYWAN';
    const fromAddress = mailFromName ? `${mailFromName} <${mailFrom}>` : mailFrom;

    const mailOptions = {
      from: fromAddress,
      to,
      subject: emailContent.subject || subject,
      html: emailContent.html,
    };

    const result = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    return false;
  }
};

