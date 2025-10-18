import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { logger } from '@/lib/utils/logger';
import { uploadFiles, getAuthHeaders } from '@/lib/uploadthing/client';

// GET /api/templates - List all active templates
const getHandler = asyncHandler(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('serviceType');
    const category = searchParams.get('category');

    const where: any = {
        isActive: true,
    };

    if (serviceType) {
        where.serviceType = serviceType;
    }

    if (category) {
        where.category = category;
    }

    const templates = await prisma.documentTemplate.findMany({
        where,
        select: {
            id: true,
            name: true,
            description: true,
            serviceType: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            category: true,
            isRequired: true,
            downloadCount: true,
            version: true,
            createdAt: true,
        },
        orderBy: [
            { serviceType: 'asc' },
            { category: 'asc' },
            { name: 'asc' },
        ],
    });

    logger.info('Templates retrieved', { count: templates.length });

    return NextResponse.json({
        success: true,
        data: { templates },
    });
});

// POST /api/templates - Create new template (ADMIN only)
const postHandler = asyncHandler(async (request: NextRequest) => {
    const req = request as AuthenticatedRequest;

    if (!req.user || req.user.role !== 'ADMIN') {
        throw new ApiError('Admin access required', HttpStatus.FORBIDDEN);
    }

    const body = await request.json();
    const {
        name,
        description,
        serviceType,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        category,
        isRequired,
        version,
    } = body;

    if (!name || !fileUrl || !fileName || !category) {
        throw new ApiError('Missing required fields', HttpStatus.BAD_REQUEST);
    }

    const template = await prisma.documentTemplate.create({
        data: {
            name,
            description: description || '',
            serviceType: serviceType || null,
            fileUrl,
            fileName,
            fileSize: fileSize || 0,
            mimeType: mimeType || 'application/pdf',
            category,
            isRequired: isRequired || false,
            version: version || null,
            createdById: req.user.userId,
        },
    });

    logger.info('Template created', { templateId: template.id, name: template.name });

    return NextResponse.json({
        success: true,
        data: { template },
        message: 'Template created successfully',
    }, { status: 201 });
});

export const GET = withCorsMiddleware(
    withRateLimit(getHandler, RateLimitPresets.STANDARD)
);

export const POST = withCorsMiddleware(
    withRateLimit(authenticateToken(postHandler), RateLimitPresets.STANDARD)
);

