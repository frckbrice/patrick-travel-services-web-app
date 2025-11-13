// Contact Form API Route - POST (submit contact form)
// Public endpoint - no authentication required

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { prisma } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/notifications/email.service';
import { escapeHtml, textToSafeHtml } from '@/lib/utils/helpers';

// Validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  subject: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || undefined),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

// POST /api/contact - Submit contact form
const postHandler = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();

  logger.info('Received contact form submission', { body });

  // Validate input
  const validationResult = contactSchema.safeParse(body);
  if (!validationResult.success) {
    logger.error('Validation failed', { errors: validationResult.error.issues });
    const errors = validationResult.error.issues.map((err) => err.message).join(', ');
    throw new ApiError(errors, HttpStatus.BAD_REQUEST);
  }

  const { name, email, phone, subject, message } = validationResult.data;

  try {
    // Save contact submission to database
    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        phone,
        subject: subject || 'General Inquiry',
        message,
        status: 'NEW',
      },
    });

    logger.info('Contact form submitted', {
      contactId: contact.id,
    });

    // Send notification email to admin (don't block the response on email sending)
    // Use a fire-and-forget approach for email notification
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    const adminRecipients: string[] = [];

    if (adminEmail) {
      adminRecipients.push(adminEmail);
    }

    const dynamicAdmins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true,
      },
      select: {
        email: true,
      },
      take: 5,
    });

    dynamicAdmins
      .map((admin) => admin.email)
      .filter((emailValue): emailValue is string =>
        Boolean(emailValue && emailValue.trim().length > 0)
      )
      .forEach((emailValue) => {
        if (!adminRecipients.includes(emailValue)) {
          adminRecipients.push(emailValue);
        }
      });

    if (adminRecipients.length > 0) {
      // Sanitize all user-controlled values to prevent XSS/HTML injection
      const safeName = escapeHtml(name);
      const safeEmail = escapeHtml(email);
      const safePhone = phone ? escapeHtml(phone) : null;
      const safeSubject = subject ? escapeHtml(subject) : 'General Inquiry';
      const safeMessage = textToSafeHtml(message); // Convert newlines to <br/> after escaping

      const emailPayload = {
        subject: `Contact Form: ${safeSubject} - ${safeName}`,
        html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
                            .header h2 { margin: 0; font-size: 24px; }
                            .content { padding: 30px; }
                            .info-row { margin-bottom: 16px; }
                            .info-label { font-weight: bold; color: #667eea; margin-bottom: 4px; }
                            .info-value { color: #333; }
                            .message-box { background: #f9fafb; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
                            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e5e7eb; }
                            .timestamp { color: #6b7280; font-size: 13px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
                            .contact-id { background: #e9ecef; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 8px; font-family: monospace; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h2>📧 New Contact Form Submission</h2>
                            </div>
                            <div class="content">
                                <div class="info-row">
                                    <div class="info-label">Subject:</div>
                                    <div class="info-value" style="font-size: 16px; font-weight: 600; color: #667eea;">${safeSubject}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">Name:</div>
                                    <div class="info-value">${safeName}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">Email:</div>
                                    <div class="info-value"><a href="mailto:${safeEmail}" style="color: #667eea; text-decoration: none;">${safeEmail}</a></div>
                                </div>
                                ${
                                  safePhone
                                    ? `
                                <div class="info-row">
                                    <div class="info-label">Phone:</div>
                                    <div class="info-value">${safePhone}</div>
                                </div>
                                `
                                    : ''
                                }
                                <div class="info-row" style="margin-top: 24px;">
                                    <div class="info-label">Message:</div>
                                </div>
                                <div class="message-box">
                                    ${safeMessage}
                                </div>
                                <div class="timestamp">
                                    <strong>Submitted at:</strong> ${new Date().toLocaleString()}<br>
                                    <span class="contact-id">Contact ID: ${contact.id}</span>
                                </div>
                            </div>
                            <div class="footer">
                                <p style="margin: 0; font-weight: 600;">Patrick Travel Services</p>
                                <p style="margin: 8px 0 0 0;">This message was sent from the contact support form.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
      };

      await Promise.all(
        adminRecipients.map((recipient) =>
          sendEmail({
            to: recipient,
            ...emailPayload,
          }).catch((error) => {
            logger.error('Failed to send contact notification email', { recipient, error });
          })
        )
      );
    }

    return successResponse(
      {
        id: contact.id,
        message: 'Thank you for contacting us. We will get back to you soon!',
      },
      SUCCESS_MESSAGES.CREATED,
      HttpStatus.CREATED
    );
  } catch (error) {
    logger.error('Error saving contact submission', error);
    throw new ApiError(
      'Failed to submit contact form. Please try again later.',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
});

// Apply middleware with rate limiting (stricter for public endpoint)
export const POST = withCorsMiddleware(
  withRateLimit(
    postHandler,
    RateLimitPresets.STRICT // Strict rate limiting for public endpoint
  )
);
