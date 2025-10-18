// Email notification service using Nodemailer

import nodemailer from 'nodemailer';
import { logger } from '@/lib/utils/logger';
import { escapeHtml } from '@/lib/utils/helpers';

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
}

export async function sendEmail(options: EmailOptions) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    logger.warn('Email service not configured. Skipping email send.');
    return;
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    logger.error('NEXT_PUBLIC_APP_URL not configured');
    throw new Error('NEXT_PUBLIC_APP_URL is required for sending emails');
  }

  try {
    await transporter.sendMail({
      from: `Patrick Travel Services <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
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
  
  await sendEmail({
    to,
    subject: escapeHtml(subject),
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
              <p>• Reply through your dashboard for full tracking and history</p>
              <p>• Or reply directly to this email (replies will be forwarded)</p>
              <p style="margin-top: 10px;"><strong>Thread ID:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${threadId}</code></p>
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
