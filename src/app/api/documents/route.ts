// Documents API Routes - GET (list) and POST (create metadata)
// Compatible with both web and mobile clients
// Actual file upload is handled by UploadThing

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, PAGINATION } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

// GET /api/documents - List all documents (with filters)
const getHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get('caseId');
  const type = searchParams.get('type');
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  // Validate and parse page
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;

  // Validate and clamp limit
  let limit = limitParam ? parseInt(limitParam, 10) : 20;

  if (isNaN(limit) || limit <= 0) {
    throw new ApiError('Limit must be a positive integer', HttpStatus.BAD_REQUEST);
  }

  // Clamp limit to MAX_LIMIT to prevent excessive resource usage
  limit = Math.min(limit, PAGINATION.MAX_LIMIT);

  const skip = (page - 1) * limit;

  const where: any = {};

  // Role-based filtering
  if (req.user.role === 'CLIENT') {
    where.uploadedById = req.user.userId;
  }

  if (caseId) {
    where.caseId = caseId;
  }

  if (type) {
    where.documentType = type;
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        case: {
          select: {
            id: true,
            referenceNumber: true,
            serviceType: true,
            status: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { uploadDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.document.count({ where }),
  ]);

  logger.info('Documents retrieved', {
    userId: req.user.userId,
    count: documents.length,
  });

  return successResponse(
    {
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    'Documents retrieved successfully'
  );
});

// POST /api/documents - Save document metadata after UploadThing upload
const postHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const body = await request.json();
  const { fileName, originalName, filePath, fileSize, mimeType, documentType, caseId } = body;

  // Validation
  if (!fileName || !filePath || !mimeType || !documentType || !caseId) {
    throw new ApiError(
      'fileName, filePath, mimeType, documentType, and caseId are required',
      HttpStatus.BAD_REQUEST
    );
  }

  // Verify case exists and access
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
  });

  if (!caseData) {
    throw new ApiError('Case not found', HttpStatus.NOT_FOUND);
  }

  if (req.user.role === 'CLIENT' && caseData.clientId !== req.user.userId) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  // Create document record
  const document = await prisma.document.create({
    data: {
      fileName,
      originalName: originalName || fileName,
      filePath,
      fileSize: fileSize || 0,
      mimeType,
      documentType,
      caseId,
      uploadedById: req.user.userId,
    },
    include: {
      case: {
        select: {
          id: true,
          referenceNumber: true,
          serviceType: true,
        },
      },
    },
  });

  logger.info('Document metadata saved', {
    documentId: document.id,
    userId: req.user.userId,
  });

  return successResponse({ document }, SUCCESS_MESSAGES.CREATED, HttpStatus.CREATED);
});

// Apply middleware and authentication
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);

export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.STANDARD)
);
