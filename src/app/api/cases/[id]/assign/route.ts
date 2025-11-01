// PATCH /api/cases/[id]/assign - Assign case to another agent (ADMIN only)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES, NOTIFICATION_ACTION_URLS } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { createRealtimeNotification } from '@/lib/firebase/notifications.service.server';
import { sendPushNotificationToUser } from '@/lib/notifications/expo-push.service';
import { sendEmail } from '@/lib/notifications/email.service';
import { initializeFirebaseChat, sendWelcomeMessage } from '@/lib/firebase/chat.service';
import { getAgentCaseAssignmentEmailTemplate } from '@/lib/notifications/email-templates';
import { adminAuth } from '@/lib/firebase/firebase-admin';

// PATCH /api/cases/[id]/assign - Assign case to agent
// ADMIN ONLY: Agents cannot assign cases to themselves or others
const handler = asyncHandler(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const params = await context.params;

    const req = request as AuthenticatedRequest;

    // SECURITY: Only ADMIN users can assign cases
    // Agents receive case assignments but cannot create or modify assignments
    if (!req.user || req.user.role !== 'ADMIN') {
      throw new ApiError(
        'Only administrators can assign cases. Agents receive assignments but cannot create them.',
        HttpStatus.FORBIDDEN
      );
    }

    const body = await request.json();
    const { agentId } = body;

    if (typeof agentId !== 'string' || !agentId.trim()) {
      throw new ApiError('Agent ID must be a non-empty string', HttpStatus.BAD_REQUEST);
    }

    // Verify agent exists and has AGENT role
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, role: true, firstName: true, lastName: true },
    });

    if (!agent || agent.role !== 'AGENT') {
      throw new ApiError('Invalid agent ID', HttpStatus.BAD_REQUEST);
    }

    // Verify case exists and check current assignment
    const existingCase = await prisma.case.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        assignedAgentId: true,
        referenceNumber: true,
        assignedAgent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!existingCase) {
      throw new ApiError('Case not found', HttpStatus.NOT_FOUND);
    }

    if (existingCase.status === 'CLOSED') {
      throw new ApiError('Cannot assign closed cases', HttpStatus.BAD_REQUEST);
    }

    // Check for duplicate assignment
    if (existingCase.assignedAgentId) {
      if (existingCase.assignedAgentId === agentId) {
        // Case is already assigned to the same agent
        throw new ApiError(
          `This case is already assigned to ${agent.firstName} ${agent.lastName}. No action needed.`,
          HttpStatus.CONFLICT
        );
      } else {
        // Case is assigned to a different agent - notify admin immediately
        const currentAgentName = existingCase.assignedAgent
          ? `${existingCase.assignedAgent.firstName} ${existingCase.assignedAgent.lastName}`
          : 'Unknown Agent';

        logger.warn('ADMIN_ACTION: Duplicate assignment attempt prevented', {
          action: 'CASE_ASSIGN_DUPLICATE',
          caseId: params.id,
          caseReference: existingCase.referenceNumber,
          currentAgentId: existingCase.assignedAgentId,
          currentAgentName,
          attemptedAgentId: agentId,
          attemptedAgentName: `${agent.firstName} ${agent.lastName}`,
          adminId: req.user.userId,
          timestamp: new Date().toISOString(),
        });

        // Send immediate notification to admin about duplicate assignment attempt
        createRealtimeNotification(req.user.userId, {
          type: 'SYSTEM_ANNOUNCEMENT',
          title: '⚠️ Duplicate Assignment Prevented',
          message: `Case ${existingCase.referenceNumber} is already assigned to ${currentAgentName}. You attempted to assign it to ${agent.firstName} ${agent.lastName}. Please use Transfer instead.`,
          actionUrl: NOTIFICATION_ACTION_URLS.CASE_DETAILS(params.id),
        }).catch((error) => {
          logger.error('Failed to send duplicate assignment notification to admin', error);
        });

        throw new ApiError(
          `This case is already assigned to ${currentAgentName}. Please transfer the case instead of reassigning it.`,
          HttpStatus.CONFLICT
        );
      }
    }

    const caseData = await prisma.case.update({
      where: { id: params.id },
      data: { assignedAgentId: agentId },
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

    // Comprehensive logging for ADMIN action (do this before async notifications)
    logger.info('ADMIN_ACTION: Case assigned', {
      action: 'CASE_ASSIGN',
      caseId: params.id,
      caseReference: caseData.referenceNumber,
      agentId,
      agentName: `${agent.firstName} ${agent.lastName}`,
      adminId: req.user.userId,
      clientId: caseData.client.id,
      clientName: `${caseData.client.firstName} ${caseData.client.lastName}`,
      timestamp: new Date().toISOString(),
    });

    // Send notifications to BOTH agent and client
    // FIRE-AND-FORGET: Don't await these operations to avoid timeout issues
    // The assignment is complete, notifications are best-effort background tasks
    (async () => {
      try {
        const agentFullName = `${agent.firstName} ${agent.lastName}`;
        const clientFullName = `${caseData.client.firstName} ${caseData.client.lastName}`;

        // Get email templates
        const clientEmailTemplate = {
          to: caseData.client.email,
          subject: `Case ${caseData.referenceNumber} - Advisor Assigned`,
          html: `
          <h2>Your Case Has Been Assigned!</h2>
          <p>Dear ${clientFullName},</p>
          <p>Great news! Your immigration case <strong>${caseData.referenceNumber}</strong> has been assigned to one of our experienced advisors.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Advisor</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${agentFullName}</p>
            <p style="margin: 5px 0;"><strong>Case Reference:</strong> ${caseData.referenceNumber}</p>
          </div>
          <p>Your advisor will review your case and contact you shortly to discuss the next steps.</p>
          <p>You can also reach out to them directly through the chat feature in your mobile app or web dashboard.</p>
          <p style="margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/case/${params.id}" 
               style="background: #0066CC; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Case Details
            </a>
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Best regards,<br/>
            Patrick Travel Services Team
          </p>
        `,
        };

        const agentEmailTemplate = getAgentCaseAssignmentEmailTemplate({
          agentName: agentFullName,
          caseReference: caseData.referenceNumber,
          clientName: clientFullName,
          serviceType: caseData.serviceType,
          priority: caseData.priority,
          caseId: params.id,
        });

        // Get Firebase UIDs for client and agent (needed for Firebase rules)
        // This must be done BEFORE the Promise.all to get the UIDs
        let clientFirebaseUid = '';
        let agentFirebaseUid = '';
        try {
          if (!adminAuth) {
            throw new Error('Firebase Admin not initialized');
          }
          const clientFirebaseUser = await adminAuth.getUserByEmail(caseData.client.email);
          clientFirebaseUid = clientFirebaseUser.uid;

          const agentFirebaseUser = await adminAuth.getUserByEmail(caseData.assignedAgent!.email);
          agentFirebaseUid = agentFirebaseUser.uid;

          // Initialize Firebase chat conversation
          await initializeFirebaseChat(
            params.id,
            caseData.referenceNumber,
            clientFirebaseUid, // Use Firebase UID, not PostgreSQL ID
            clientFullName,
            agentFirebaseUid, // Use Firebase UID, not PostgreSQL ID
            agentFullName
          );
        } catch (firebaseError) {
          logger.error('Failed to get Firebase UIDs for chat initialization', firebaseError);
          // Continue without chat initialization - non-critical
        }

        await Promise.all([
          // 1. Notify the AGENT (web dashboard)
          createRealtimeNotification(agentId, {
            type: 'CASE_ASSIGNED',
            title: 'New Case Assigned',
            message: `Case ${caseData.referenceNumber} has been assigned to you`,
            actionUrl: NOTIFICATION_ACTION_URLS.CASE_DETAILS(params.id),
          }),

          // 2. Notify the CLIENT (web dashboard)
          createRealtimeNotification(caseData.clientId, {
            type: 'CASE_ASSIGNED',
            title: 'Case Assigned!',
            message: `Your case ${caseData.referenceNumber} has been assigned to ${agentFullName}`,
            actionUrl: NOTIFICATION_ACTION_URLS.CASE_DETAILS(params.id),
          }),

          // 3. Send mobile push notification to CLIENT
          sendPushNotificationToUser(caseData.clientId, {
            title: '👤 Case Assigned!',
            body: `Your case ${caseData.referenceNumber} has been assigned to ${agentFullName}. They will contact you soon.`,
            data: {
              type: 'CASE_ASSIGNED',
              caseId: params.id,
              caseRef: caseData.referenceNumber,
              agentId: agentId,
              agentName: agentFullName,
            },
          }),

          // 4. Send mobile push notification to AGENT
          sendPushNotificationToUser(agentId, {
            title: '🎯 New Case Assigned',
            body: `Case ${caseData.referenceNumber} from ${clientFullName} has been assigned to you. Priority: ${caseData.priority}`,
            data: {
              type: 'CASE_ASSIGNED',
              caseId: params.id,
              caseRef: caseData.referenceNumber,
              clientId: caseData.clientId,
              clientName: clientFullName,
            },
          }),

          // 5. Send email to CLIENT
          sendEmail(clientEmailTemplate),

          // 6. Send email to AGENT
          sendEmail({
            to: caseData.assignedAgent!.email,
            subject: agentEmailTemplate.subject,
            html: agentEmailTemplate.html,
          }),

          // 7. Optional: Send automatic welcome message from agent
          // Use Firebase UIDs for welcome message
          ...(clientFirebaseUid && agentFirebaseUid
            ? [
                sendWelcomeMessage(
                  params.id,
                  agentFirebaseUid, // Use Firebase UID
                  agentFullName,
                  clientFullName,
                  caseData.referenceNumber
                ),
              ]
            : [
                Promise.resolve(
                  logger.warn('Skipping welcome message - Firebase UIDs not available')
                ),
              ]),
        ]);

        logger.info('All assignment notifications sent successfully', {
          caseId: params.id,
          clientId: caseData.clientId,
          agentId,
          clientEmail: caseData.client.email,
        });
      } catch (error) {
        logger.error('Failed to send assignment notifications', error, {
          caseId: params.id,
          clientId: caseData.clientId,
          agentId,
        });
        // Notifications failed but assignment is already complete
      }
    })();

    // Return immediately - don't wait for notifications to complete
    // This prevents timeout errors on the client while notifications are sent in background
    return successResponse({ case: caseData }, 'Case assigned successfully');
  }
);

export const PATCH = withCorsMiddleware(
  withRateLimit(authenticateToken(handler), RateLimitPresets.STANDARD)
);
