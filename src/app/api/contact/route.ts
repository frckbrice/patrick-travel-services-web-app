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

// Validation schema
const contactSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    message: z.string().min(10, 'Message must be at least 10 characters'),
});

// POST /api/contact - Submit contact form
const postHandler = asyncHandler(async (request: NextRequest) => {
    const body = await request.json();

    // Validate input
    const validationResult = contactSchema.safeParse(body);
    if (!validationResult.success) {
        const errors = validationResult.error.issues.map(err => err.message).join(', ');
        throw new ApiError(errors, HttpStatus.BAD_REQUEST);
    }

    const { name, email, phone, message } = validationResult.data;

    try {
        // Save contact submission to database
        const contact = await prisma.contact.create({
            data: {
                name,
                email,
                phone,
                message,
                status: 'NEW',
            },
        });

        logger.info('Contact form submitted', {
            contactId: contact.id,
            email,
            name,
        });

        // Send notification email to admin (don't block the response on email sending)
        // Use a fire-and-forget approach for email notification
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
            sendEmail({
                to: adminEmail,
                subject: `New Contact Form Submission from ${name}`,
                html: `
                    <h2>New Contact Form Submission</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                    <p><strong>Message:</strong></p>
                    <blockquote style="border-left: 4px solid #4F46E5; padding-left: 16px; margin: 16px 0; background-color: #f9fafb; padding: 16px;">
                        ${message}
                    </blockquote>
                    <p><strong>Submitted at:</strong> ${new Date().toLocaleString()}</p>
                    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 14px;">
                        Contact ID: ${contact.id}<br>
                        This message was sent from the Patrick Travel Services contact form.
                    </p>
                `,
            }).catch(error => {
                // Log email error but don't fail the request
                logger.error('Failed to send contact notification email', error);
            });
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

