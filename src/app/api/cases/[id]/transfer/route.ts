// POST /api/cases/[id]/transfer - Transfer case to another agent (ADMIN only)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { createRealtimeNotification } from '@/lib/firebase/notifications.service';
import { sendEmail } from '@/lib/notifications/email.service';
import { z } from 'zod';

const transferSchema = z.object({
    newAgentId: z.string().min(1, 'Agent ID is required'),
    reason: z.enum(['REASSIGNMENT', 'COVERAGE', 'SPECIALIZATION', 'WORKLOAD', 'OTHER']),
    handoverNotes: z.string().optional(),
    notifyClient: z.boolean().default(true),
    notifyAgent: z.boolean().default(true),
});

const handler = asyncHandler(async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    const params = await context?.params;

    if (!params) {
        throw new ApiError('Invalid request parameters', HttpStatus.BAD_REQUEST);
    }

    const req = request as AuthenticatedRequest;

    // Only ADMIN can transfer cases
    if (!req.user || req.user.role !== 'ADMIN') {
        throw new ApiError('Only administrators can transfer cases', HttpStatus.FORBIDDEN);
    }

    const body = await request.json();

    // Validate request body
    const validationResult = transferSchema.safeParse(body);
    if (!validationResult.success) {
        throw new ApiError(
            validationResult.error.errors[0]?.message || 'Invalid request data',
            HttpStatus.BAD_REQUEST
        );
    }

    const { newAgentId, reason, handoverNotes, notifyClient, notifyAgent } = validationResult.data;

    // Fetch the case with relations
    const caseData = await prisma.case.findUnique({
        where: { id: params.id },
        include: {
            client: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
            assignedAgent: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    if (!caseData) {
        throw new ApiError('Case not found', HttpStatus.NOT_FOUND);
    }

    // Verify new agent exists and has AGENT role
    const newAgent = await prisma.user.findUnique({
        where: { id: newAgentId },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
        },
    });

    if (!newAgent || newAgent.role !== 'AGENT') {
        throw new ApiError('Invalid agent ID or agent is not active', HttpStatus.BAD_REQUEST);
    }

    if (!newAgent.isActive) {
        throw new ApiError('Cannot transfer to inactive agent', HttpStatus.BAD_REQUEST);
    }

    // Prevent transferring to same agent
    if (caseData.assignedAgentId === newAgentId) {
        throw new ApiError('Case is already assigned to this agent', HttpStatus.BAD_REQUEST);
    }

    const oldAgentId = caseData.assignedAgentId;
    const oldAgentName = caseData.assignedAgent
        ? `${caseData.assignedAgent.firstName} ${caseData.assignedAgent.lastName}`
        : null;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
        // 1. Update case assignment
        const updatedCase = await tx.case.update({
            where: { id: params.id },
            data: { assignedAgentId: newAgentId },
            include: {
                client: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                assignedAgent: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        // 2. Create transfer history record
        await tx.transferHistory.create({
            data: {
                caseId: params.id,
                fromAgentId: oldAgentId,
                fromAgentName: oldAgentName,
                toAgentId: newAgentId,
                toAgentName: `${newAgent.firstName} ${newAgent.lastName}`,
                reason,
                handoverNotes,
                transferredBy: req.user.userId,
                notifyClient,
                notifyAgent,
            },
        });

        // 3. Add internal note about transfer
        const transferNote = `Case transferred from ${oldAgentName || 'unassigned'} to ${newAgent.firstName} ${newAgent.lastName}. Reason: ${reason}${handoverNotes ? `\n\nHandover Notes: ${handoverNotes}` : ''}`;

        await tx.case.update({
            where: { id: params.id },
            data: {
                internalNotes: caseData.internalNotes
                    ? `${caseData.internalNotes}\n\n---\n[${new Date().toISOString()}] ${transferNote}`
                    : transferNote
            },
        });

        return updatedCase;
    });

    // 4. Send notification to new agent
    try {
        await createRealtimeNotification(newAgentId, {
            type: 'CASE_ASSIGNED',
            title: 'Case Transferred to You',
            message: `Case ${caseData.referenceNumber} has been transferred to you${reason ? ` (${reason})` : ''}`,
            actionUrl: `/dashboard/cases/${params.id}`,
        });
    } catch (error) {
        logger.warn('Failed to create notification for new agent', error);
    }

    // 5. Send emails if requested
    const emailPromises = [];

    if (notifyAgent) {
        emailPromises.push(
            sendEmail({
                to: newAgent.email,
                subject: `New Case Transferred - ${caseData.referenceNumber}`,
                html: `
                    <h2>Case Transferred to You</h2>
                    <p>Hi ${newAgent.firstName},</p>
                    <p>A case has been transferred to you:</p>
                    
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Client:</strong> ${caseData.client.firstName} ${caseData.client.lastName}</p>
                        <p><strong>Reference:</strong> ${caseData.referenceNumber}</p>
                        <p><strong>Service Type:</strong> ${caseData.serviceType.replace(/_/g, ' ')}</p>
                        <p><strong>Status:</strong> ${caseData.status}</p>
                        <p><strong>Priority:</strong> ${caseData.priority}</p>
                        ${oldAgentName ? `<p><strong>Previous Agent:</strong> ${oldAgentName}</p>` : ''}
                    </div>

                    ${handoverNotes ? `
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Handover Notes:</strong></p>
                        <p style="white-space: pre-wrap;">${handoverNotes}</p>
                    </div>
                    ` : ''}

                    <p>Please review the case details and reach out to the client within 24 hours.</p>
                    
                    <p style="margin-top: 20px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cases/${params.id}" 
                           style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            View Case Details
                        </a>
                    </p>

                    <p style="margin-top: 20px;">Best regards,<br/>Patrick Travel Services</p>
                `,
            }).catch((error) => {
                logger.error('Failed to send email to new agent', error);
            })
        );
    }

    if (notifyClient) {
        emailPromises.push(
            sendEmail({
                to: caseData.client.email,
                subject: `Your Immigration Case - Agent Update`,
                html: `
                    <h2>Immigration Case Update</h2>
                    <p>Dear ${caseData.client.firstName},</p>
                    <p>This is to inform you that your immigration case has been assigned to a new advisor:</p>
                    
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Your Case:</strong> ${caseData.referenceNumber}</p>
                        <p><strong>Service Type:</strong> ${caseData.serviceType.replace(/_/g, ' ')}</p>
                        ${oldAgentName ? `<p><strong>Previous Advisor:</strong> ${oldAgentName}</p>` : ''}
                        <p><strong>New Advisor:</strong> ${newAgent.firstName} ${newAgent.lastName}</p>
                        <p><strong>Email:</strong> ${newAgent.email}</p>
                    </div>

                    <p>Your new advisor has been fully briefed on your case and will continue to provide excellent service.</p>
                    <p>You can expect to hear from them within 24 hours.</p>
                    
                    <p>If you have any questions, please don't hesitate to reach out through your dashboard or contact your new advisor directly.</p>
                    
                    <p style="margin-top: 20px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cases/${params.id}" 
                           style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            View Your Case
                        </a>
                    </p>

                    <p style="margin-top: 20px;">Best regards,<br/>Patrick Travel Services</p>
                `,
            }).catch((error) => {
                logger.error('Failed to send email to client', error);
            })
        );
    }

    // Wait for all email promises (don't block response if they fail)
    await Promise.allSettled(emailPromises);

    // Comprehensive logging for ADMIN action
    logger.info('ADMIN_ACTION: Case transferred', {
        action: 'CASE_TRANSFER',
        caseId: params.id,
        caseReference: caseData.referenceNumber,
        fromAgentId: oldAgentId,
        fromAgentName: oldAgentName || 'Unassigned',
        toAgentId: newAgentId,
        toAgentName: `${newAgent.firstName} ${newAgent.lastName}`,
        reason,
        hasHandoverNotes: !!handoverNotes,
        notificationsSent: {
            client: notifyClient,
            agent: notifyAgent,
        },
        adminId: req.user.userId,
        clientId: caseData.client.id,
        clientName: `${caseData.client.firstName} ${caseData.client.lastName}`,
        timestamp: new Date().toISOString(),
    });

    return successResponse(
        {
            case: result,
            emailsSent: {
                client: notifyClient,
                agent: notifyAgent,
            }
        },
        'Case transferred successfully'
    );
});

export const POST = withCorsMiddleware(
    withRateLimit(
        authenticateToken(handler),
        RateLimitPresets.STANDARD
    )
);

