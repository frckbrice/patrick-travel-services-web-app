// Chat Message Archive API - Saves Firebase messages to Neon
// Part of hybrid approach: Real-time in Firebase + History in Neon

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';

interface ArchiveMessageRequest {
    firebaseId: string;
    senderId: string;
    senderName: string;
    senderEmail: string;
    recipientId: string;
    recipientName: string;
    recipientEmail: string;
    content: string;
    caseId?: string;
    subject?: string;
    isRead?: boolean;
    sentAt: string;
    attachments?: any[];
}

// POST /api/chat/archive - Archive Firebase message to Neon
const postHandler = asyncHandler(async (request: NextRequest) => {
    const body = await request.json() as ArchiveMessageRequest;

    // Validation
    if (!body.firebaseId || !body.senderId || !body.recipientId || !body.content) {
        throw new ApiError(
            'Missing required fields: firebaseId, senderId, recipientId, content',
            HttpStatus.BAD_REQUEST
        );
    }

    try {
        // Check if already archived (prevent duplicates)
        const existing = await prisma.chatMessage.findUnique({
            where: { firebaseId: body.firebaseId },
        });

        if (existing) {
            logger.info('Message already archived', { firebaseId: body.firebaseId });
            return successResponse({ messageId: existing.id }, 'Message already archived');
        }

        // Archive message to Neon
        const archivedMessage = await prisma.chatMessage.create({
            data: {
                firebaseId: body.firebaseId,
                senderId: body.senderId,
                senderName: body.senderName,
                senderEmail: body.senderEmail,
                recipientId: body.recipientId,
                recipientName: body.recipientName,
                recipientEmail: body.recipientEmail,
                content: body.content,
                caseId: body.caseId || null,
                subject: body.subject || null,
                isRead: body.isRead || false,
                sentAt: new Date(body.sentAt),
                attachments: body.attachments ? JSON.parse(JSON.stringify(body.attachments)) : null,
            },
        });

        logger.info('Message archived to Neon', {
            firebaseId: body.firebaseId,
            neonId: archivedMessage.id,
        });

        return successResponse(
            { messageId: archivedMessage.id },
            'Message archived successfully',
            HttpStatus.CREATED
        );
    } catch (error) {
        logger.error('Failed to archive message', { error, firebaseId: body.firebaseId });
        throw new ApiError(
            'Failed to archive message to database',
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
});

export const POST = postHandler;

