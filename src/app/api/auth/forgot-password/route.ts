import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Forgot Password API Endpoint
 * Generates and sends password reset email via Firebase Admin
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const { email } = validation.data;

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
      // Check if user exists
      const userRecord = await adminAuth.getUserByEmail(email);

      // Generate password reset link
      await adminAuth.generatePasswordResetLink(email, {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      });

      logger.info('Password reset link generated', {
        userId: userRecord.uid,
        email: email
      });

      // Firebase Admin SDK automatically sends the email
      // No need to manually send it

      return NextResponse.json({
        success: true,
        message: 'Password reset email sent successfully',
      });
    } catch (error: any) {
      // Handle Firebase errors
      if (error.code === 'auth/user-not-found') {
        // For security, don't reveal if user exists
        // Return success anyway
        logger.warn('Password reset attempted for non-existent email', { email });
        return NextResponse.json({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent',
        });
      }

      throw error;
    }
  } catch (error: any) {
    logger.error('Forgot password error', { error: error.message });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process password reset request',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
