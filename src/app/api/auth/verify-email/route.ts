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
          error: validation.error.errors[0].message,
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

    try {
      // Apply the email verification code
      const info = await adminAuth.checkActionCode(token);

      if (info.operation !== 'VERIFY_EMAIL') {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid verification code',
          },
          { status: 400 }
        );
      }

      // Apply the code to verify email
      await adminAuth.applyActionCode(token);

      // Get user email from the action code info
      const email = info.data.email;

      // Update Firebase user email verified status
      if (email) {
        const user = await adminAuth.getUserByEmail(email);
        await adminAuth.updateUser(user.uid, {
          emailVerified: true,
        });

        // Update in database if you're tracking email verification there
        await prisma.user.updateMany({
          where: { email },
          data: {
            emailVerified: true,
            updatedAt: new Date(),
          },
        });

        logger.info('Email verified successfully', { email, userId: user.uid });
      }

      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        data: {
          email,
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
