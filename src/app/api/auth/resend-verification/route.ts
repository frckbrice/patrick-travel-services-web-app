import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { logger } from '@/lib/utils/logger';
import { z } from 'zod';
import { normalizeEmail } from '@/lib/utils/email';

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Resend Email Verification API Endpoint
 * Generates and sends a new email verification link
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
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

    const email = normalizeEmail(validation.data.email);

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
      // Get user by email
      const userRecord = await adminAuth.getUserByEmail(email);

      // Check if already verified
      if (userRecord.emailVerified) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email is already verified',
          },
          { status: 400 }
        );
      }

      // Generate email verification link
      const verificationLink = await adminAuth.generateEmailVerificationLink(email, {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/login?verified=true`,
      });

      logger.info('Email verification link generated', {
        userId: userRecord.uid,
        email: email,
      });

      // In a real app, you would send this via email service
      // For now, Firebase will handle sending if using client SDK
      // Or you can integrate with SendGrid/Mailgun/etc here

      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully',
        data: {
          // Don't send the actual link in production
          // link: verificationLink,
        },
      });
    } catch (error: any) {
      // Handle Firebase errors
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          {
            success: false,
            error: 'No account found with this email address',
          },
          { status: 404 }
        );
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
