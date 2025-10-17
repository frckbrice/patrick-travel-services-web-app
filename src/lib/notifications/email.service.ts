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

export async function sendCaseStatusEmail(to: string, caseRef: string, status: string, clientName: string) {
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

export async function sendDocumentVerifiedEmail(to: string, documentName: string, clientName: string) {
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

export async function sendDocumentRejectedEmail(to: string, documentName: string, reason: string, clientName: string) {
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

export async function sendNewMessageEmail(to: string, from: string, message: string, clientName: string) {
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
