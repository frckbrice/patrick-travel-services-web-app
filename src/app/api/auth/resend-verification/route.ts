import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';
import { normalizeEmail } from '@/lib/utils/email';
import { prisma } from '@/lib/db/prisma';
import { sendVerificationEmail } from '@/lib/notifications/email.service';
import { getAppUrl } from '@/lib/constants';

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Resend Email Verification API Endpoint
 * Generates and sends a new email verification link via Firebase Admin and Nodemailer
 * Based on custom implementation flow using Firebase Admin SDK
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Step 1: Validate request body
    const validation = resendVerificationSchema.safeParse(body);
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
      // Step 5: Get user by email from Firebase
      const userRecord = await adminAuth.getUserByEmail(email);

      // Step 6: Check if already verified
      if (userRecord.emailVerified) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email is already verified',
          },
          { status: 400 }
        );
      }

      // Step 7: Generate email verification link using Firebase Admin SDK
      const verificationLink = await adminAuth.generateEmailVerificationLink(email, {
        url: `${appUrl}/login?verified=true`,
      });

      logger.info('Email verification link generated', {
        userId: userRecord.uid,
        email: email,
      });

      // Step 8: Get user name from database (optional)
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

      // Step 9: Send verification email using Nodemailer service
      try {
        await sendVerificationEmail({
          to: email,
          clientName: userName || userRecord.displayName || 'there',
          verificationLink,
        });
        logger.info('Verification email sent successfully', { email });
      } catch (emailError) {
        // Log email error but don't fail the request
        // The link was generated successfully, user can request another email
        logger.error('Failed to send verification email', emailError);
        // Still return success to avoid revealing if user exists
      }

      // Step 10: Return success response
      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully. Please check your inbox.',
      });
    } catch (error: any) {
      // Handle Firebase errors
      if (error.code === 'auth/user-not-found') {
        // For security, don't reveal if user exists
        // Still return success to prevent email enumeration
        logger.warn('Resend verification attempted for non-existent email', { email });
        return NextResponse.json({
          success: true,
          message: 'If an account exists with this email, a verification email has been sent',
        });
      }

      throw error;
    }
  } catch (error: any) {
    logger.error('Resend verification error', { error: error.message });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send verification email',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
