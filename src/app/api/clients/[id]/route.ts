// GET /api/clients/[id] - Get client information by ID

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client ID is required',
        },
        { status: 400 }
      );
    }

    // Get the authenticated user from the request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.UNAUTHORIZED,
        },
        { status: 401 }
      );
    }

    // For now, we'll allow any authenticated user to get client info
    // In a production environment, you might want to add additional authorization checks
    // such as checking if the user is an agent/admin or if they have a relationship with the client

    // Get client information
    const client = await prisma.user.findUnique({
      where: { id },
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
        isActive: true,
        isVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        profilePicture: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.NOT_FOUND,
        },
        { status: 404 }
      );
    }

    logger.info('Client info retrieved', { clientId: client.id });

    return NextResponse.json(
      {
        success: true,
        data: client,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Get client info error', error);

    return NextResponse.json(
      {
        success: false,
        error: ERROR_MESSAGES.SERVER_ERROR,
      },
      { status: 500 }
    );
  }
}
