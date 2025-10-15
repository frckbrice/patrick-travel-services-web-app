// Users API Routes - GET, PUT, DELETE by ID
// Compatible with both web and mobile clients

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

interface RouteContext {
    params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Get user by ID
const getHandler = asyncHandler(async (request: NextRequest, context?: RouteContext) => {
    const req = request as AuthenticatedRequest;

    if (!req.user) {
        throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const { id } = await context!.params;

    // Users can only view their own profile unless they're ADMIN/AGENT
    if (
        req.user.userId !== id &&
        !['ADMIN', 'AGENT'].includes(req.user.role)
    ) {
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
            isVerified: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    logger.info('User retrieved', { userId: id, requestedBy: req.user.userId });

    return successResponse({ user }, 'User retrieved successfully');
});

// PUT /api/users/[id] - Update user
const putHandler = asyncHandler(async (request: NextRequest, context?: RouteContext) => {
    const req = request as AuthenticatedRequest;

    if (!req.user) {
        throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    const { id } = await context!.params;
    const body = await request.json();

    // Users can only update their own profile unless they're ADMIN
    if (req.user.userId !== id && req.user.role !== 'ADMIN') {
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    const user = await prisma.user.findUnique({
        where: { id },
    });

    if (!user) {
        throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // Build update data based on permissions
    const updateData: any = {};

    // Users can update their own basic info
    if (body.firstName) updateData.firstName = body.firstName;
    if (body.lastName) updateData.lastName = body.lastName;
    if (body.phone) updateData.phone = body.phone;

    // Only ADMIN can change role, isActive, isVerified
    if (req.user.role === 'ADMIN') {
        if (body.role) updateData.role = body.role;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;
        if (body.isVerified !== undefined) updateData.isVerified = body.isVerified;

        // Update Firebase custom claims if role changed
        if (body.role && adminAuth) {
            await adminAuth.setCustomUserClaims(id, {
                role: body.role,
            });
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            isActive: true,
            isVerified: true,
            lastLogin: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    logger.info('User updated', { userId: id, updatedBy: req.user.userId });

    return successResponse({ user: updatedUser }, SUCCESS_MESSAGES.UPDATED);
});

// DELETE /api/users/[id] - Delete/Deactivate user
const deleteHandler = asyncHandler(async (request: NextRequest, context?: RouteContext) => {
    const req = request as AuthenticatedRequest;

    if (!req.user) {
        throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
    }

    // Only ADMIN can delete users
    if (req.user.role !== 'ADMIN') {
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
    }

    const { id } = await context!.params;

    const user = await prisma.user.findUnique({
        where: { id },
    });

    if (!user) {
        throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // Soft delete - just deactivate the user
    await prisma.user.update({
        where: { id },
        data: { isActive: false },
    });

    // Disable user in Firebase
    if (adminAuth) {
        await adminAuth.updateUser(id, {
            disabled: true,
        });
    }

    logger.info('User deactivated', { userId: id, deactivatedBy: req.user.userId });

    return successResponse(null, 'User deactivated successfully');
});

// Apply middleware and authentication
export const GET = withCorsMiddleware(
    withRateLimit(
        authenticateToken(getHandler),
        RateLimitPresets.STANDARD
    )
);

export const PUT = withCorsMiddleware(
    withRateLimit(
        authenticateToken(putHandler),
        RateLimitPresets.STANDARD
    )
);

export const DELETE = withCorsMiddleware(
    withRateLimit(
        authenticateToken(deleteHandler),
        RateLimitPresets.STANDARD
    )
);

