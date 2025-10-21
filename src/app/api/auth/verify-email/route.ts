import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

/**
 * Verify Email API Endpoint
 * Verifies email using Firebase verification token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = verifyEmailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { token } = validation.data;

    if (!adminAuth) {
      logger.error('Firebase Admin not initialized');
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication service unavailable',
        },
        { status: 500 }
      );
    }

    // Find user by verification token in database
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        isVerified: false,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired verification token',
        },
        { status: 400 }
      );
    }

    try {
      // Update user verification status in database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null,
        },
      });

      // Update Firebase Auth email verified status if admin SDK is available
      if (adminAuth) {
        try {
          await adminAuth.updateUser(user.id, {
            emailVerified: true,
          });
        } catch (firebaseError) {
          // Log but don't fail - database is already updated
          logger.warn('Failed to update Firebase email verification', firebaseError);
        }
      }

      logger.info('Email verified successfully', { email: user.email, userId: user.id });

      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        data: {
          email: user.email,
        },
      });
    } catch (error: any) {
      // Handle Firebase errors
      if (error.code === 'auth/invalid-action-code') {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid or expired verification code',
          },
          { status: 400 }
        );
      }

      if (error.code === 'auth/expired-action-code') {
        return NextResponse.json(
          {
            success: false,
            error: 'Verification code has expired. Please request a new one',
          },
          { status: 400 }
        );
      }

      throw error;
    }
  } catch (error: any) {
    logger.error('Verify email error', { error: error.message });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify email',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
