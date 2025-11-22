import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  oobCode: z.string().min(1, 'Reset code is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

/**
 * Reset Password API Endpoint
 * Uses Firebase REST API to verify oobCode and reset password
 * Based on custom implementation flow using Firebase REST API
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

    const { oobCode, password } = validation.data;

    const apiKey = process.env.FIREBASE_API_KEY;

    if (!apiKey) {
      logger.error('FIREBASE_API_KEY not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication service unavailable',
        },
        { status: 500 }
      );
    }

    try {
      // First, verify the reset code to get the email (validates code is still valid)
      const verifyResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oobCode,
          }),
        }
      );

      const verifyPayload = (await verifyResponse.json().catch(() => undefined)) as
        | { email?: string; error?: { message?: string } }
        | undefined;

      if (!verifyResponse.ok || !verifyPayload?.email) {
        const errorMessage = verifyPayload?.error?.message || 'Invalid reset code';

        // Handle specific Firebase errors
        if (
          errorMessage.includes('EXPIRED_OOB_CODE') ||
          errorMessage.includes('INVALID_OOB_CODE') ||
          errorMessage.includes('INVALID_CODE')
        ) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid or expired reset link. Please request a new one.',
            },
            { status: 400 }
          );
        }

        logger.error('Failed to verify password reset code', {
          error: errorMessage,
          code: verifyPayload?.error,
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Invalid or expired reset link',
          },
          { status: 400 }
        );
      }

      const email = verifyPayload.email;

      // Now reset the password with the verified oobCode
      const resetResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            oobCode,
            newPassword: password,
          }),
        }
      );

      const resetPayload = (await resetResponse.json().catch(() => undefined)) as
        | { email?: string; error?: { message?: string } }
        | undefined;

      if (!resetResponse.ok) {
        const errorMessage = resetPayload?.error?.message || 'Failed to reset password';

        // Handle specific Firebase errors
        if (errorMessage.includes('WEAK_PASSWORD')) {
          return NextResponse.json(
            {
              success: false,
              error: 'Password is too weak. Please use a stronger password.',
            },
            { status: 400 }
          );
        }

        if (
          errorMessage.includes('EXPIRED_OOB_CODE') ||
          errorMessage.includes('INVALID_OOB_CODE') ||
          errorMessage.includes('INVALID_CODE')
        ) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid or expired reset link. Please request a new one.',
            },
            { status: 400 }
          );
        }

        logger.error('Failed to reset password', { error: errorMessage, email });

        return NextResponse.json(
          {
            success: false,
            error: 'Failed to reset password',
          },
          { status: 500 }
        );
      }

      // Update password in database if user exists
      try {
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        if (user && adminAuth) {
          // Update password in database for consistency
          await prisma.user.update({
            where: { id: user.id },
            data: {
              password: password, // Store password in DB as well for consistency
            },
          });
        }
      } catch (dbError) {
        // Log but don't fail - Firebase password is already reset
        logger.warn('Failed to update password in database', { error: dbError, email });
      }

      logger.info('Password reset successful', { email });

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully',
        data: {
          email,
        },
      });
    } catch (firebaseError: any) {
      logger.error('Failed to reset password', firebaseError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to reset password',
          message: firebaseError?.message || 'An unexpected error occurred',
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
