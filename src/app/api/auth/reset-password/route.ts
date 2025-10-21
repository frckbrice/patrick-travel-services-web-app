import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

/**
 * Reset Password API Endpoint
 * Verifies reset token and updates user password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

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

    // Find user by reset token in database
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired reset token',
        },
        { status: 400 }
      );
    }

    try {
      // Update password in Firebase Auth (handles hashing automatically)
      await adminAuth.updateUser(user.id, {
        password: password,
      });

      // Clear reset token from database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: password, // Store password in DB as well for consistency
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      logger.info('Password reset successful', { email: user.email });

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully',
        data: {
          email: user.email,
        },
      });
    } catch (firebaseError) {
      logger.error('Failed to update password', firebaseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to reset password',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Reset password error', { error: error.message });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset password',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
