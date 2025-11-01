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
import { createRealtimeNotification } from '@/lib/firebase/notifications.service.server';
import { sendEmail } from '@/lib/notifications/email.service';
import { escapeHtml, textToSafeHtml } from '@/lib/utils/helpers';
import { z } from 'zod';

const transferSchema = z.object({
  newAgentId: z.string().min(1, 'Agent ID is required'),
  reason: z.enum(['REASSIGNMENT', 'COVERAGE', 'SPECIALIZATION', 'WORKLOAD', 'OTHER']),
  handoverNotes: z.string().optional(),
  notifyClient: z.boolean().default(true),
  notifyAgent: z.boolean().default(true),
});

const handler = asyncHandler(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const params = await context.params;

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
        validationResult.error.issues[0]?.message || 'Invalid request data',
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
      throw new ApiError('Invalid agent ID or user is not an agent', HttpStatus.BAD_REQUEST);
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
              phone: true,
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
          documents: {
            select: {
              id: true,
              fileName: true,
              originalName: true,
              filePath: true,
              mimeType: true,
              fileSize: true,
              documentType: true,
              status: true,
              uploadDate: true,
            },
          },
        },
      });

      // 2. Create transfer history record with proper relations
      await tx.transferHistory.create({
        data: {
          caseId: params.id,
          fromAgentId: oldAgentId,
          fromAgentName: oldAgentName, // Denormalized for historical record
          toAgentId: newAgentId,
          toAgentName: `${newAgent.firstName} ${newAgent.lastName}`, // Denormalized for historical record
          reason,
          handoverNotes,
          transferredBy: req.user?.userId || null, // Will be linked via relation to User
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
            : transferNote,
        },
      });

      return updatedCase;
    });

    // 4. Send notification to new agent
    let realtimeNotificationDelivered = false;
    try {
      await createRealtimeNotification(newAgentId, {
        type: 'CASE_ASSIGNED',
        title: 'Case Transferred to You',
        message: `Case ${caseData.referenceNumber} has been transferred to you${reason ? ` (${reason})` : ''}`,
        actionUrl: `/dashboard/cases/${params.id}`,
      });
      realtimeNotificationDelivered = true;
    } catch (error) {
      logger.warn('Failed to create notification for new agent', error);
    }

    // 5. Send emails if requested
    const emailPromises: Promise<{ success: boolean; recipient: 'agent' | 'client' }>[] = [];

    // Sanitize all user-controlled values to prevent XSS/HTML injection
    const safeClientFirstName = escapeHtml(caseData.client.firstName);
    const safeClientLastName = escapeHtml(caseData.client.lastName);
    const safeNewAgentFirstName = escapeHtml(newAgent.firstName);
    const safeNewAgentLastName = escapeHtml(newAgent.lastName);
    const safeNewAgentEmail = escapeHtml(newAgent.email);
    const safeReferenceNumber = escapeHtml(caseData.referenceNumber);
    const safeServiceType = escapeHtml(caseData.serviceType.replace(/_/g, ' '));
    const safeStatus = escapeHtml(caseData.status);
    const safePriority = escapeHtml(caseData.priority);
    const safeOldAgentName = oldAgentName ? escapeHtml(oldAgentName) : null;
    const safeHandoverNotes = handoverNotes ? textToSafeHtml(handoverNotes) : null;

    if (notifyAgent) {
      emailPromises.push(
        sendEmail({
          to: newAgent.email,
          subject: `New Case Transferred - ${safeReferenceNumber}`,
          html: `
                    <h2>Case Transferred to You</h2>
                    <p>Hi ${safeNewAgentFirstName},</p>
                    <p>A case has been transferred to you:</p>
                    
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Client:</strong> ${safeClientFirstName} ${safeClientLastName}</p>
                        <p><strong>Reference:</strong> ${safeReferenceNumber}</p>
                        <p><strong>Service Type:</strong> ${safeServiceType}</p>
                        <p><strong>Status:</strong> ${safeStatus}</p>
                        <p><strong>Priority:</strong> ${safePriority}</p>
                        ${safeOldAgentName ? `<p><strong>Previous Agent:</strong> ${safeOldAgentName}</p>` : ''}
                    </div>

                    ${
                      safeHandoverNotes
                        ? `
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Handover Notes:</strong></p>
                        <p style="white-space: pre-wrap;">${safeHandoverNotes}</p>
                    </div>
                    `
                        : ''
                    }

                    <p>Please review the case details and reach out to the client within 24 hours.</p>
                    
                    <p style="margin-top: 20px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/cases/${params.id}" 
                           style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            View Case Details
                        </a>
                    </p>

                    <p style="margin-top: 20px;">Best regards,<br/>Patrick Travel Services</p>
                `,
        })
          .then(() => ({ success: true, recipient: 'agent' as const }))
          .catch((error) => {
            logger.error('Failed to send email to new agent', error);
            return { success: false, recipient: 'agent' as const };
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
                    <p>Dear ${safeClientFirstName},</p>
                    <p>This is to inform you that your immigration case has been assigned to a new advisor:</p>
                    
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Your Case:</strong> ${safeReferenceNumber}</p>
                        <p><strong>Service Type:</strong> ${safeServiceType}</p>
                        ${safeOldAgentName ? `<p><strong>Previous Advisor:</strong> ${safeOldAgentName}</p>` : ''}
                        <p><strong>New Advisor:</strong> ${safeNewAgentFirstName} ${safeNewAgentLastName}</p>
                        <p><strong>Email:</strong> ${safeNewAgentEmail}</p>
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
        })
          .then(() => ({ success: true, recipient: 'client' as const }))
          .catch((error) => {
            logger.error('Failed to send email to client', error);
            return { success: false, recipient: 'client' as const };
          })
      );
    }

    // Wait for all email promises (don't block response if they fail)
    const emailResults = await Promise.allSettled(emailPromises);

    // Determine which notifications were actually delivered
    let clientEmailDelivered = false;
    let agentEmailDelivered = false;

    emailResults.forEach(
      (result: PromiseSettledResult<{ success: boolean; recipient: 'agent' | 'client' }>) => {
        if (result.status === 'fulfilled') {
          if (result.value.recipient === 'client' && result.value.success) {
            clientEmailDelivered = true;
          }
          if (result.value.recipient === 'agent' && result.value.success) {
            agentEmailDelivered = true;
          }
        }
      }
    );

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
      notificationsRequested: {
        client: notifyClient,
        agent: notifyAgent,
      },
      notificationsDelivered: {
        clientEmail: clientEmailDelivered,
        agentEmail: agentEmailDelivered,
        realtimeNotification: realtimeNotificationDelivered,
      },
      adminId: req.user.userId,
      clientId: caseData.client.id,
      clientName: `${caseData.client.firstName} ${caseData.client.lastName}`,
      timestamp: new Date().toISOString(),
    });

    return successResponse(
      {
        case: result,
        notificationsRequested: {
          client: notifyClient,
          agent: notifyAgent,
        },
        notificationsDelivered: {
          client: clientEmailDelivered,
          agent: agentEmailDelivered,
        },
      },
      'Case transferred successfully'
    );
  }
);

export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);
