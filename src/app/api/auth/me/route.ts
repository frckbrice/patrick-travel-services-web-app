// GET /api/auth/me - Get current authenticated user

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';

async function handler(request: AuthenticatedRequest) {
  try {
    const userId = request.user?.userId || request.user?.uid;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.UNAUTHORIZED,
        },
        { status: 401 }
      );
    }

    // Determine which field to query based on userId format
    // If userId matches Firebase UID, it means custom claims aren't set yet, so query by firebaseId
    // Otherwise, userId is the database UUID from custom claims, so query by id
    const isFirebaseUid = userId === request.user?.uid;
    const whereClause = isFirebaseUid ? { firebaseId: userId } : { id: userId };

    // Get user from database (single query)
    let user = await prisma.user.findUnique({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        street: true,
        city: true,
        country: true,
        role: true,
        profilePicture: true,
        isActive: true,
        isVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        firebaseId: true, // Include to check if it exists
        // GDPR Consent Fields
        consentedAt: true,
        acceptedTerms: true,
        acceptedPrivacy: true,
        termsAcceptedAt: true,
        privacyAcceptedAt: true,
        dataExportRequests: true,
        lastDataExport: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.NOT_FOUND,
        },
        { status: 404 }
      );
    }

    // Ensure firebaseId is set (data consistency)
    // If user was found by UUID but doesn't have firebaseId, update it
    // This handles edge cases where user exists but firebaseId wasn't set
    if (!user.firebaseId && request.user?.uid) {
      logger.info('Updating user with missing firebaseId', {
        userId: user.id,
        email: user.email?.substring(0, 5) + '...',
      });

      user = await prisma.user.update({
        where: { id: user.id },
        data: { firebaseId: request.user.uid },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          street: true,
          city: true,
          country: true,
          role: true,
          profilePicture: true,
          isActive: true,
          isVerified: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          firebaseId: true,
          // GDPR Consent Fields
          consentedAt: true,
          acceptedTerms: true,
          acceptedPrivacy: true,
          termsAcceptedAt: true,
          privacyAcceptedAt: true,
          dataExportRequests: true,
          lastDataExport: true,
        },
      });

      logger.info('firebaseId successfully linked to user', {
        userId: user.id,
      });
    }

    logger.debug('User info retrieved', { userId: user.id });

    return NextResponse.json(
      {
        success: true,
        data: user,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Get current user error', error);

    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR,
      },
      { status: 500 }
    );
  }
}

export const GET = authenticateToken(handler);
