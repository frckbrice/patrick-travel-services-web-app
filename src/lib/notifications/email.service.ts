// Email notification service using Nodemailer

import nodemailer from 'nodemailer';
import { logger } from '@/lib/utils/logger';

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

    try {
        await transporter.sendMail({
            from: `Patrick Travel Services`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text || options.html.replace(/<[^>]*>/g, ''),
        });
        logger.info('Email sent successfully', { to: options.to, subject: options.subject });
    } catch (error) {
        logger.error('Failed to send email', error);
        throw error;
    }
}

export async function sendCaseStatusEmail(to: string, caseRef: string, status: string, clientName: string) {
    await sendEmail({
        to,
        subject: `Case ${caseRef} Status Update`,
        html: `
            <h2>Case Status Update</h2>
            <p>Dear ${clientName},</p>
            <p>Your case <strong>${caseRef}</strong> status has been updated to: <strong>${status}</strong></p>
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
            <p>Dear ${clientName},</p>
            <p>Your document <strong>${documentName}</strong> has been verified and approved.</p>
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
            <p>Dear ${clientName},</p>
            <p>Your document <strong>${documentName}</strong> requires reupload.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>Please upload a corrected version at your earliest convenience.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/documents">Upload Document</a>
            <br><br>
            <p>Best regards,<br>Patrick Travel Services</p>
        `,
    });
}

export async function sendNewMessageEmail(to: string, from: string, message: string, clientName: string) {
    await sendEmail({
        to,
        subject: `New Message from ${from}`,
        html: `
            <h2>New Message</h2>
            <p>Dear ${clientName},</p>
            <p><strong>${from}</strong> sent you a message:</p>
            <blockquote style="border-left: 4px solid #4F46E5; padding-left: 16px; margin: 16px 0;">
                ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}
            </blockquote>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/messages">View Message</a>
            <br><br>
            <p>Best regards,<br>Patrick Travel Services</p>
        `,
    });
}
