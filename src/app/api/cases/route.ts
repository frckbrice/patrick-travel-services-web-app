// Cases API Routes - GET (list all) and POST (create new case)
// Compatible with both web and mobile clients

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PAGINATION,
  NOTIFICATION_ACTION_URLS,
} from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/notifications/email.service';
import { sendPushNotificationToUser } from '@/lib/notifications/expo-push.service';
import { createRealtimeNotification } from '@/lib/firebase/notifications.service.server';
import { getCaseSubmissionConfirmationEmailTemplate } from '@/lib/notifications/email-templates';

// GET /api/cases - List all cases (with filters)
const getHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { searchParams } = new URL(request.url);

  // Pagination parameters
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  // Filter parameters
  const status = searchParams.get('status');
  const serviceType = searchParams.get('serviceType');
  const assignedAgentId = searchParams.get('assignedAgentId');
  const priority = searchParams.get('priority');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const search = searchParams.get('search');
  const isAssigned = searchParams.get('isAssigned'); // 'true' or 'false' string

  // Validate and parse page
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;

  // Validate and clamp limit
  let limit = limitParam ? parseInt(limitParam, 10) : PAGINATION.DEFAULT_LIMIT;

  if (isNaN(limit) || limit <= 0) {
    throw new ApiError('Limit must be a positive integer', HttpStatus.BAD_REQUEST);
  }

  // Clamp limit to MAX_LIMIT to prevent excessive resource usage
  limit = Math.min(limit, PAGINATION.MAX_LIMIT);

  const skip = (page - 1) * limit;

  // Build filter based on user role
  const where: any = {};

  if (req.user.role === 'CLIENT') {
    // Clients can only see their own cases
    where.clientId = req.user.userId;
    logger.info('CLIENT case filter', {
      userId: req.user.userId,
      clientId: where.clientId,
    });
  } else if (req.user.role === 'AGENT') {
    // Agents can only see their assigned cases
    where.assignedAgentId = req.user.userId;
  }

  // Apply server-side filters
  if (status && status !== 'all' && status !== 'active') {
    where.status = status;
  }

  if (serviceType && serviceType !== 'all') {
    where.serviceType = serviceType;
  }

  if (assignedAgentId) {
    if (assignedAgentId === 'unassigned') {
      where.assignedAgentId = null;
    } else {
      where.assignedAgentId = assignedAgentId;
    }
  }

  if (priority && priority !== 'all') {
    where.priority = priority;
  }

  if (isAssigned === 'true') {
    where.assignedAgentId = { not: null };
  } else if (isAssigned === 'false') {
    where.assignedAgentId = null;
  }

  // Date range filter
  if (startDate || endDate) {
    where.submissionDate = {};
    if (startDate) {
      where.submissionDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.submissionDate.lte = new Date(endDate);
    }
  }

  // Search filter (by reference number or client name via relation)
  const searchCondition = search && search.trim() !== '';
  const includeClause = {
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
  };

  let cases;
  let total;

  if (searchCondition) {
    // Search requires fetching all matching cases first, then paginating
    const searchTerm = search.trim();
    const allCases = await prisma.case.findMany({
      where,
      include: includeClause,
      orderBy: { submissionDate: 'desc' },
    });

    // Client-side filtering for search
    const filteredCases = allCases.filter((c) => {
      const matchesReference = c.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const clientName = `${c.client.firstName || ''} ${c.client.lastName || ''}`.toLowerCase();
      const matchesClientName = clientName.includes(searchTerm.toLowerCase());
      return matchesReference || matchesClientName;
    });

    total = filteredCases.length;

    // Paginate the filtered results
    cases = filteredCases.slice(skip, skip + limit);
  } else {
    // No search term - use database query directly
    [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: includeClause,
        orderBy: { submissionDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.case.count({ where }),
    ]);
  }

  logger.info('Cases retrieved', {
    userId: req.user.userId,
    role: req.user.role,
    count: cases.length,
    total,
    filter: where,
    page,
    limit,
  });

  return successResponse(
    {
      cases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    'Cases retrieved successfully'
  );
});

// POST /api/cases - Create new case
const postHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const body = await request.json();
  const { serviceType, priority } = body;

  // Validation
  if (!serviceType) {
    throw new ApiError('serviceType is required', HttpStatus.BAD_REQUEST);
  }

  // Generate unique reference number
  const referenceNumber = `PT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

  // Create case
  const newCase = await prisma.case.create({
    data: {
      referenceNumber,
      serviceType,
      priority: priority || 'NORMAL',
      status: 'SUBMITTED',
      clientId: req.user.userId,
    },
    include: {
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  logger.info('Case created', {
    caseId: newCase.id,
    userId: req.user.userId,
    referenceNumber,
  });

  // Send notifications to client and admin
  try {
    const clientFullName = `${newCase.client.firstName} ${newCase.client.lastName}`;

    // Get email templates
    const clientEmailTemplate = getCaseSubmissionConfirmationEmailTemplate({
      clientName: clientFullName,
      caseReference: referenceNumber,
      serviceType,
      caseId: newCase.id,
    });

    // Get all admin users for notification
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true, email: true },
    });

    const notificationPromises = [
      // 1. Send confirmation email to CLIENT
      sendEmail({
        to: newCase.client.email,
        subject: clientEmailTemplate.subject,
        html: clientEmailTemplate.html,
      }),

      // 2. Send mobile push notification to CLIENT
      sendPushNotificationToUser(newCase.clientId, {
        title: '✅ Case Submitted Successfully',
        body: `Your case ${referenceNumber} has been submitted. We'll assign an advisor soon.`,
        data: {
          type: 'CASE_SUBMITTED',
          caseId: newCase.id,
          caseRef: referenceNumber,
        },
      }),

      // 3. Send realtime notification to CLIENT
      createRealtimeNotification(newCase.clientId, {
        type: 'CASE_STATUS_UPDATE',
        title: 'Case Submitted',
        message: `Your case ${referenceNumber} has been successfully submitted`,
        actionUrl: NOTIFICATION_ACTION_URLS.CASE_SUBMISSION(newCase.id),
      }),
    ];

    // 4. Notify all ADMIN users (Dashboard + Push only, NO email for scalability)
    for (const admin of adminUsers) {
      notificationPromises.push(
        // Send realtime web dashboard notification to admin
        createRealtimeNotification(admin.id, {
          type: 'CASE_STATUS_UPDATE',
          title: 'New Case Submitted',
          message: `${clientFullName} submitted case ${referenceNumber}`,
          actionUrl: NOTIFICATION_ACTION_URLS.CASE_DETAILS(newCase.id),
        }),

        // Send mobile push notification to admin
        sendPushNotificationToUser(admin.id, {
          title: '🔔 New Case Submitted',
          body: `${clientFullName} submitted ${serviceType.replace(/_/g, ' ')} case. Ref: ${referenceNumber}`,
          data: {
            type: 'NEW_CASE_ADMIN',
            caseId: newCase.id,
            caseRef: referenceNumber,
            clientId: newCase.clientId,
            clientName: clientFullName,
          },
        })
      );
    }

    await Promise.all(notificationPromises);

    logger.info('Case submission notifications sent', {
      caseId: newCase.id,
      clientEmail: newCase.client.email,
      adminCount: adminUsers.length,
    });
  } catch (error) {
    logger.error('Failed to send case submission notifications', error, {
      caseId: newCase.id,
      clientId: newCase.clientId,
    });
    // Don't fail the case creation if notifications fail
  }

  return successResponse({ case: newCase }, SUCCESS_MESSAGES.CREATED, HttpStatus.CREATED);
});

// Apply middleware and authentication
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);

export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.STANDARD)
);
