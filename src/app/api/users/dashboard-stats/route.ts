// GET /api/users/dashboard-stats - Get aggregated dashboard statistics
// Optimized for mobile: single endpoint returns all dashboard data
// Compatible with CLIENT, AGENT, and ADMIN roles

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

const TERMINAL_STATUSES = ['APPROVED', 'REJECTED', 'CLOSED'];

const getHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const userId = req.user.userId;
  const userRole = req.user.role;

  // Build queries based on role
  const casesWhere: any = {};
  const documentsWhere: any = {};

  if (userRole === 'CLIENT') {
    // Clients see only their own data
    casesWhere.clientId = userId;
    documentsWhere.uploadedById = userId;
  } else if (userRole === 'AGENT') {
    // Agents see assigned cases and related documents
    casesWhere.assignedAgentId = userId;
    // Documents: get all docs for cases assigned to this agent
  } else if (userRole === 'ADMIN') {
    // Admins see everything (no filters)
  }

  // Execute all queries in parallel for performance
  const [cases, documents, notifications, recentCases, recentDocuments] = await Promise.all([
    // Get all cases for stats
    prisma.case.findMany({
      where: casesWhere,
      select: {
        id: true,
        status: true,
        priority: true,
        serviceType: true,
        submissionDate: true,
      },
    }),

    // Get all documents for stats
    userRole === 'AGENT'
      ? // For agents: get documents for their assigned cases
        prisma.document.findMany({
          where: {
            case: {
              assignedAgentId: userId,
            },
          },
          select: {
            id: true,
            status: true,
            documentType: true,
            uploadDate: true,
          },
        })
      : // For clients/admins: direct filter
        prisma.document.findMany({
          where: documentsWhere,
          select: {
            id: true,
            status: true,
            documentType: true,
            uploadDate: true,
          },
        }),

    // Get unread notifications count
    prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    }),

    // Get 5 most recent cases with details
    prisma.case.findMany({
      where: casesWhere,
      take: 5,
      orderBy: { lastUpdated: 'desc' },
      select: {
        id: true,
        referenceNumber: true,
        serviceType: true,
        status: true,
        priority: true,
        submissionDate: true,
        lastUpdated: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedAgent: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),

    // Get 5 most recent documents (moved into parallel queries for performance)
    userRole === 'AGENT'
      ? prisma.document.findMany({
          where: {
            case: {
              assignedAgentId: userId,
            },
          },
          take: 5,
          orderBy: { uploadDate: 'desc' },
          select: {
            id: true,
            fileName: true,
            documentType: true,
            status: true,
            fileSize: true,
            uploadDate: true,
            case: {
              select: {
                referenceNumber: true,
                serviceType: true,
              },
            },
          },
        })
      : prisma.document.findMany({
          where: documentsWhere,
          take: 5,
          orderBy: { uploadDate: 'desc' },
          select: {
            id: true,
            fileName: true,
            documentType: true,
            status: true,
            fileSize: true,
            uploadDate: true,
            case: {
              select: {
                referenceNumber: true,
                serviceType: true,
              },
            },
          },
        }),
  ]);

  // Calculate case statistics
  const caseStats = {
    total: cases.length,
    active: cases.filter((c) => !TERMINAL_STATUSES.includes(c.status)).length,
    completed: cases.filter((c) => c.status === 'APPROVED').length,
    rejected: cases.filter((c) => c.status === 'REJECTED').length,
    byStatus: cases.reduce(
      (acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    byPriority: cases.reduce(
      (acc, c) => {
        acc[c.priority] = (acc[c.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
    byServiceType: cases.reduce(
      (acc, c) => {
        acc[c.serviceType] = (acc[c.serviceType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };

  // Calculate document statistics
  const documentStats = {
    total: documents.length,
    pending: documents.filter((d) => d.status === 'PENDING').length,
    approved: documents.filter((d) => d.status === 'APPROVED').length,
    rejected: documents.filter((d) => d.status === 'REJECTED').length,
    byType: documents.reduce(
      (acc, d) => {
        acc[d.documentType] = (acc[d.documentType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };

  logger.info('Dashboard stats retrieved', {
    userId,
    role: userRole,
    casesCount: cases.length,
    documentsCount: documents.length,
  });

  return successResponse(
    {
      user: {
        id: userId,
        role: userRole,
      },
      cases: caseStats,
      documents: documentStats,
      notifications: {
        unread: notifications,
      },
      recent: {
        cases: recentCases,
        documents: recentDocuments,
      },
    },
    'Dashboard statistics retrieved successfully'
  );
});

// Apply middleware and authentication
const authenticatedHandler = authenticateToken(getHandler);
export const GET = withCorsMiddleware(
  withRateLimit(authenticatedHandler, RateLimitPresets.STANDARD)
);
