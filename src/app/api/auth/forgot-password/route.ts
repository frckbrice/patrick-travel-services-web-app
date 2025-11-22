import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';
import { normalizeEmail } from '@/lib/utils/email';
import { prisma } from '@/lib/db/prisma';
import { sendPasswordResetEmail } from '@/lib/notifications/email.service';
import { getAppUrl } from '@/lib/constants';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Forgot Password API Endpoint
 * Generates password reset link via Firebase Admin and sends email via Nodemailer
 * Based on custom implementation flow using Firebase Admin SDK
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Step 1: Validate request body
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

    // Step 2: Email normalization
    const email = normalizeEmail(validation.data.email);

    // Step 3: Environment check
    const appUrl = getAppUrl();
    if (!appUrl) {
      logger.error('Application URL not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Application URL not configured',
        },
        { status: 500 }
      );
    }

    // Step 4: Firebase Admin check
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
      // Step 5: Verify user exists in Firebase
      const userRecord = await adminAuth.getUserByEmail(email);

      // Step 6: Generate password reset link using Firebase Admin SDK
      const resetLink = await adminAuth.generatePasswordResetLink(email, {
        url: `${appUrl}/reset-password`,
      });

      logger.info('Password reset link generated', {
        userId: userRecord.uid,
        email: email,
      });

      // Step 7: Get user name from database (optional)
      let userName: string | undefined;
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email },
          select: { firstName: true, lastName: true },
        });
        if (dbUser?.firstName && dbUser?.lastName) {
          userName = `${dbUser.firstName} ${dbUser.lastName}`;
        } else if (dbUser?.firstName) {
          userName = dbUser.firstName;
        } else if (userRecord.displayName) {
          userName = userRecord.displayName;
        }
      } catch (dbError) {
        // If database lookup fails, continue without name
        logger.warn('Could not fetch user name from database', { email });
        // Fallback to Firebase display name if available
        if (userRecord.displayName) {
          userName = userRecord.displayName;
        }
      }

      // Step 8: Send password reset email using Nodemailer service
      try {
        await sendPasswordResetEmail({
          to: email,
          clientName: userName || userRecord.displayName || 'there',
          resetLink,
        });
        logger.info('Password reset email sent successfully', { email });
      } catch (emailError) {
        // Log email error but don't fail the request
        // The link was generated successfully, user can request another email
        logger.error('Failed to send password reset email', emailError);
        // Still return success to avoid revealing if user exists
      }

      // Step 9: Security response - always return success (even if user doesn't exist)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent',
      });
    } catch (error: any) {
      // Handle Firebase errors
      if (error.code === 'auth/user-not-found') {
        // For security, don't reveal if user exists
        // Return success anyway to prevent email enumeration
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
