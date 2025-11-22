// Email notification service using Nodemailer

import nodemailer from 'nodemailer';
import { logger } from '@/lib/utils/logger';
import { escapeHtml } from '@/lib/utils/helpers';
import { getAppointmentScheduledEmailTemplate } from './email-templates';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
}

export async function sendEmail(options: EmailOptions) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    logger.warn('Email service not configured. Skipping email send.');
    return;
  }

  // Note: App URL is not required for sending emails - links are provided in the email templates

  try {
    await transporter.sendMail({
      from: `Patrick Travel Services <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      headers: options.headers || {},
    });
    logger.info('Email sent successfully', { subject: options.subject });
  } catch (error) {
    logger.error('Failed to send email', error);
    throw error;
  }
}

export async function sendCaseStatusEmail(
  to: string,
  caseRef: string,
  status: string,
  clientName: string
) {
  await sendEmail({
    to,
    subject: `Case ${escapeHtml(caseRef)} Status Update`,
    html: `
            <h2>Case Status Update</h2>
            <p>Dear ${escapeHtml(clientName)},</p>
            <p>Your case <strong>${escapeHtml(caseRef)}</strong> status has been updated to: <strong>${escapeHtml(status)}</strong></p>
            <p>Login to your dashboard to view more details.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cases">View Dashboard</a>
            <br><br>
            <p>Best regards,<br>Patrick Travel Services</p>
        `,
  });
}

export async function sendDocumentVerifiedEmail(
  to: string,
  documentName: string,
  clientName: string
) {
  await sendEmail({
    to,
    subject: 'Document Approved',
    html: `
            <h2>Document Approved</h2>
            <p>Dear ${escapeHtml(clientName)},</p>
            <p>Your document <strong>${escapeHtml(documentName)}</strong> has been verified and approved.</p>
            <p>Login to your dashboard to continue with your application.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/documents">View Documents</a>
            <br><br>
            <p>Best regards,<br>Patrick Travel Services</p>
        `,
  });
}

export async function sendDocumentRejectedEmail(
  to: string,
  documentName: string,
  reason: string,
  clientName: string
) {
  await sendEmail({
    to,
    subject: 'Document Requires Reupload',
    html: `
            <h2>Document Requires Attention</h2>
            <p>Dear ${escapeHtml(clientName)},</p>
            <p>Your document <strong>${escapeHtml(documentName)}</strong> requires reupload.</p>
            <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
            <p>Please upload a corrected version at your earliest convenience.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/documents">Upload Document</a>
            <br><br>
            <p>Best regards,<br>Patrick Travel Services</p>
        `,
  });
}

export async function sendNewMessageEmail(
  to: string,
  from: string,
  message: string,
  clientName: string
) {
  // Escape message first, then truncate safely
  const escapedMessage = escapeHtml(message);
  const truncatedMessage = escapedMessage.substring(0, 200);
  const messagePreview = escapedMessage.length > 200 ? `${truncatedMessage}...` : truncatedMessage;

  await sendEmail({
    to,
    subject: `New Message from ${escapeHtml(from)}`,
    html: `
            <h2>New Message</h2>
            <p>Dear ${escapeHtml(clientName)},</p>
            <p><strong>${escapeHtml(from)}</strong> sent you a message:</p>
            <blockquote style="border-left: 4px solid #4F46E5; padding-left: 16px; margin: 16px 0;">
                ${messagePreview}
            </blockquote>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/messages">View Message</a>
            <br><br>
            <p>Best regards,<br>Patrick Travel Services</p>
        `,
  });
}

// Send user-composed email (formal email communication)
export async function sendUserEmail(options: {
  to: string;
  from: string;
  fromEmail: string;
  subject: string;
  content: string;
  threadId: string;
  caseRef?: string;
}) {
  const { to, from, fromEmail, subject, content, threadId, caseRef } = options;

  // Include thread ID in subject for better compatibility (as fallback if headers are stripped)
  // Format: [THREAD:threadId] Original Subject
  const subjectWithThreadId = subject.includes('[THREAD:')
    ? subject
    : `[THREAD:${threadId}] ${subject}`;

  await sendEmail({
    to,
    subject: escapeHtml(subjectWithThreadId),
    headers: {
      'In-Reply-To': `${threadId}@patricktravel.com`,
      References: `${threadId}@patricktravel.com`,
      'X-Thread-ID': threadId,
      'Reply-To': process.env.SMTP_USER || '',
    },
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px 20px; }
          .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; white-space: pre-wrap; word-wrap: break-word; }
          .footer { background: #e9ecef; padding: 20px; text-align: center; font-size: 14px; color: #6c757d; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .metadata { font-size: 12px; color: #6c757d; margin-top: 20px; padding: 15px; background: #f1f3f5; border-radius: 6px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📧 Email from ${escapeHtml(from)}</h2>
            ${caseRef ? `<p style="margin: 5px 0; font-size: 14px;">Case: ${escapeHtml(caseRef)}</p>` : ''}
          </div>
          <div class="content">
            <p><strong>From:</strong> ${escapeHtml(from)} (${escapeHtml(fromEmail)})</p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            
            <div class="message-box">
              ${escapeHtml(content)}
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/messages" class="button">
                📬 View & Reply in Dashboard
              </a>
            </div>

            <div class="metadata">
              <p><strong>How to Reply:</strong></p>
              <p>• Reply through your dashboard (recommended) for full tracking and history</p>
              <p>• Or simply reply to this email - your response will be received instantly</p>
            </div>
          </div>
          <div class="footer">
            <p><strong>Patrick Travel Services</strong></p>
            <p>Immigration & Travel Document Services</p>
            <p style="font-size: 12px; margin-top: 10px;">This email was sent through our secure messaging system.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendAppointmentScheduledEmail(options: {
  to: string;
  clientName: string;
  caseReference: string;
  caseId: string;
  appointmentId: string;
  scheduledAt: Date | string;
  location: string;
  advisorName?: string;
  notes?: string;
}) {
  const template = getAppointmentScheduledEmailTemplate({
    clientName: options.clientName,
    caseReference: options.caseReference,
    caseId: options.caseId,
    appointmentId: options.appointmentId,
    scheduledAt: options.scheduledAt,
    location: options.location,
    advisorName: options.advisorName,
    notes: options.notes,
  });

  await sendEmail({
    to: options.to,
    subject: template.subject,
    html: template.html,
  });
}

export async function sendVerificationEmail(options: {
  to: string;
  clientName?: string;
  verificationLink: string;
}) {
  const displayName = options.clientName || 'there';

  await sendEmail({
    to: options.to,
    subject: 'Verify Your Email - Patrick Travel Services',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(to right, #2563eb 0%, #0891b2 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h2 { margin: 0; font-size: 24px; color: white; }
          .content { padding: 30px; }
          .button-container { text-align: center; margin: 30px 0; }
          .button { display: inline-block; padding: 14px 32px; background: linear-gradient(to right, #2563eb 0%, #0891b2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; }
          .button:hover { opacity: 0.9; }
          .info-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e5e7eb; }
          .link-fallback { word-break: break-all; color: #2563eb; font-size: 12px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✉️ Verify Your Email</h2>
          </div>
          <div class="content">
            <p>Dear ${escapeHtml(displayName)},</p>
            <p>Thank you for signing up with Patrick Travel Services! Please verify your email address to complete your registration.</p>
            
            <div class="button-container">
              <a href="${escapeHtml(options.verificationLink)}" class="button">Verify Email</a>
            </div>
            
            <div class="info-box">
              <p style="margin: 0;"><strong>📋 Can't click the button?</strong></p>
              <p style="margin: 5px 0 0 0;">Copy and paste this link into your browser:</p>
              <p class="link-fallback">${escapeHtml(options.verificationLink)}</p>
            </div>
            
            <div class="warning-box">
              <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>This verification link will expire in 1 hour for security reasons</li>
                <li>You must verify your email to access all features of your account</li>
                <li>If you didn't create an account, please ignore this email</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px;">If you continue to have problems, please contact our support team.</p>
            
            <p style="margin-top: 20px;">Best regards,<br><strong>Patrick Travel Services</strong><br>Immigration & Travel Document Services</p>
          </div>
          <div class="footer">
            <p><strong>Patrick Travel Services</strong></p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendPasswordResetEmail(options: {
  to: string;
  clientName?: string;
  resetLink: string;
}) {
  const displayName = options.clientName || 'there';

  await sendEmail({
    to: options.to,
    subject: 'Reset Your Password - Patrick Travel Services',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(to right, #2563eb 0%, #0891b2 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h2 { margin: 0; font-size: 24px; color: white; }
          .content { padding: 30px; }
          .button-container { text-align: center; margin: 30px 0; }
          .button { display: inline-block; padding: 14px 32px; background: linear-gradient(to right, #2563eb 0%, #0891b2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; }
          .button:hover { opacity: 0.9; }
          .info-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e5e7eb; }
          .link-fallback { word-break: break-all; color: #2563eb; font-size: 12px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔐 Reset Your Password</h2>
          </div>
          <div class="content">
            <p>Dear ${escapeHtml(displayName)},</p>
            <p>We received a request to reset your password for your Patrick Travel Services account.</p>
            
            <div class="button-container">
              <a href="${escapeHtml(options.resetLink)}" class="button">Reset Password</a>
            </div>
            
            <div class="info-box">
              <p style="margin: 0;"><strong>📋 Can't click the button?</strong></p>
              <p style="margin: 5px 0 0 0;">Copy and paste this link into your browser:</p>
              <p class="link-fallback">${escapeHtml(options.resetLink)}</p>
            </div>
            
            <div class="warning-box">
              <p style="margin: 0;"><strong>⚠️ Security Notice:</strong></p>
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>This link will expire in 1 hour for security reasons</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>Your password will remain unchanged until you click the link above</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px;">If you continue to have problems, please contact our support team.</p>
            
            <p style="margin-top: 20px;">Best regards,<br><strong>Patrick Travel Services</strong><br>Immigration & Travel Document Services</p>
          </div>
          <div class="footer">
            <p><strong>Patrick Travel Services</strong></p>
            <p>This is an automated email. Please do not reply to this message.</p>
            <p style="margin-top: 10px; font-size: 11px;">If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
