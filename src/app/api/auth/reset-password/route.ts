import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebase-admin';
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

    try {
      // Verify the password reset code/token
      const email = await adminAuth.verifyPasswordResetCode(token);

      // Confirm password reset
      await adminAuth.confirmPasswordReset(token, password);

      logger.info('Password reset successful', { email });

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully',
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
            error: 'Invalid or expired reset token',
          },
          { status: 400 }
        );
      }

      if (error.code === 'auth/expired-action-code') {
        return NextResponse.json(
          {
            success: false,
            error: 'Reset token has expired. Please request a new one',
          },
          { status: 400 }
        );
      }

      throw error;
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
