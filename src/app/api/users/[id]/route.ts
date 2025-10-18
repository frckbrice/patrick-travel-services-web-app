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
import { setCustomClaimsWithRetry } from '@/lib/utils/firebase-claims';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/users/[id] - Get user by ID
const getHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { id } = await context.params;

  if (!id) {
    throw new ApiError('Invalid user ID', HttpStatus.BAD_REQUEST);
  }

  // Check permissions:
  // - Users can view their own profile
  // - Admins can view any profile
  // - Agents can only view profiles of clients with assigned cases
  if (req.user.userId !== id) {
    if (req.user.role === 'ADMIN') {
      // Admin has full access
    } else if (req.user.role === 'AGENT') {
      // Agent can only view clients they have cases assigned to
      const user = await prisma.user.findUnique({
        where: { id },
        select: { role: true },
      });

      // Only check for clients (not other agents or admins)
      if (user?.role === 'CLIENT') {
        const hasAssignedCase = await prisma.case.findFirst({
          where: {
            clientId: id,
            assignedAgentId: req.user.userId,
          },
        });

        if (!hasAssignedCase) {
          throw new ApiError(
            'You can only view profiles of clients with cases assigned to you',
            HttpStatus.FORBIDDEN
          );
        }
      }
    } else {
      // Regular users can only view their own profile
      throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
    }
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
const putHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  const { id } = await context.params;
  if (!id) {
    throw new ApiError('Invalid user ID', HttpStatus.BAD_REQUEST);
  }
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

  // Track if role is being changed (for Firebase claims update)
  let roleChanged = false;
  const previousRole = user.role;

  // Only ADMIN can change role, isActive, isVerified
  if (req.user.role === 'ADMIN') {
    if (body.role && body.role !== user.role) {
      updateData.role = body.role;
      roleChanged = true;
    }
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isVerified !== undefined) updateData.isVerified = body.isVerified;
  }

  // Update database first
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

  // If role changed, update Firebase custom claims with retry and rollback on failure
  if (roleChanged) {
    try {
      await setCustomClaimsWithRetry(
        id,
        {
          role: updatedUser.role,
          userId: id,
        },
        {
          rollbackOnFailure: false, // We'll handle rollback manually for updates
        }
      );
    } catch (error) {
      // Claims update failed - revert database role change
      logger.error('Failed to update Firebase claims, reverting database role change', {
        userId: id,
        newRole: updatedUser.role,
        previousRole,
        error: error instanceof Error ? error.message : String(error),
      });

      // Revert the role in database
      try {
        await prisma.user.update({
          where: { id },
          data: { role: previousRole },
        });

        logger.info('Successfully reverted role change in database', {
          userId: id,
          revertedTo: previousRole,
        });
      } catch (revertError) {
        logger.error('Failed to revert role change in database', {
          userId: id,
          revertError: revertError instanceof Error ? revertError.message : String(revertError),
        });
      }

      // Throw error to inform caller
      throw new ApiError(
        'Failed to update user role: Firebase claims update failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { userId: id }
      );
    }
  }

  logger.info('User updated', { userId: id, updatedBy: req.user.userId });

  return successResponse({ user: updatedUser }, SUCCESS_MESSAGES.UPDATED);
});

// DELETE /api/users/[id] - Delete/Deactivate user
const deleteHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);
  }

  // Only ADMIN can delete users
  if (req.user.role !== 'ADMIN') {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  const { id } = await context.params;
  if (!id) {
    throw new ApiError('Invalid user ID', HttpStatus.BAD_REQUEST);
  }
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new ApiError(ERROR_MESSAGES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  // Soft delete - just deactivate the user in database first
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  // Disable user in Firebase with retry and rollback on failure
  if (adminAuth) {
    const maxRetries = 3;
    const initialDelayMs = 100;
    let lastError: Error | null = null;
    let success = false;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await adminAuth.updateUser(id, {
          disabled: true,
        });
        success = true;
        break;
      } catch (error) {
        lastError = error as Error;
        logger.warn('Failed to disable user in Firebase', {
          userId: id,
          attempt,
          maxRetries,
          error: lastError.message,
        });

        if (attempt < maxRetries) {
          const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    // If all retries failed, revert the database change
    if (!success) {
      logger.error('All attempts to disable user in Firebase failed, reverting database', {
        userId: id,
        error: lastError?.message,
      });

      try {
        await prisma.user.update({
          where: { id },
          data: { isActive: true },
        });

        logger.info('Successfully reverted user deactivation in database', { userId: id });
      } catch (revertError) {
        logger.error('Failed to revert user deactivation in database', {
          userId: id,
          revertError: revertError instanceof Error ? revertError.message : String(revertError),
        });
      }

      throw new ApiError(
        'Failed to deactivate user: Firebase update failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { userId: id }
      );
    }
  }

  logger.info('User deactivated', { userId: id, deactivatedBy: req.user.userId });

  return successResponse(null, 'User deactivated successfully');
});

// Apply middleware and authentication
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);

export const PUT = withCorsMiddleware(
  withRateLimit(authenticateToken(putHandler), RateLimitPresets.STANDARD)
);

export const DELETE = withCorsMiddleware(
  withRateLimit(authenticateToken(deleteHandler), RateLimitPresets.STANDARD)
);
