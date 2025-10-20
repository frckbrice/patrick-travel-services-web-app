// Vercel Cron Job - GDPR Scheduled Account Deletions
// This endpoint is called by Vercel Cron daily at 2:00 AM UTC
// Configuration: vercel.json

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { logger } from '@/lib/utils/logger';

interface DeletionStats {
  usersDeleted: number;
  casesDeleted: number;
  documentsDeleted: number;
  messagesDeleted: number;
  notificationsDeleted: number;
  errors: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify this is a Vercel Cron request (security)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.error('Unauthorized cron request', { headers: request.headers });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats: DeletionStats = {
    usersDeleted: 0,
    casesDeleted: 0,
    documentsDeleted: 0,
    messagesDeleted: 0,
    notificationsDeleted: 0,
    errors: 0,
  };

  logger.info('Starting GDPR scheduled account deletions', { timestamp: new Date().toISOString() });

  try {
    // Find users scheduled for deletion
    const usersToDelete = await prisma.user.findMany({
      where: {
        deletionScheduledFor: {
          lte: new Date(), // Deletion date has passed
        },
        isActive: false, // Should already be inactive (safety check)
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        deletionScheduledFor: true,
        deletionReason: true,
        createdAt: true,
      },
    });

    if (usersToDelete.length === 0) {
      logger.info('No accounts scheduled for deletion');
      return NextResponse.json({
        success: true,
        message: 'No accounts scheduled for deletion',
        stats,
      });
    }

    logger.info(`Found ${usersToDelete.length} account(s) to delete`, {
      count: usersToDelete.length,
    });

    // Process each user deletion
    for (const user of usersToDelete) {
      logger.info('Processing user deletion', {
        userId: user.id,
        email: user.email,
        scheduled: user.deletionScheduledFor?.toISOString(),
        reason: user.deletionReason,
      });

      try {
        // Delete all related data in transaction
        await prisma.$transaction(async (tx) => {
          // Delete notifications
          const deletedNotifications = await tx.notification.deleteMany({
            where: { userId: user.id },
          });
          stats.notificationsDeleted += deletedNotifications.count;

          // Delete messages (sent and received)
          const deletedMessages = await tx.message.deleteMany({
            where: {
              OR: [{ senderId: user.id }, { recipientId: user.id }],
            },
          });
          stats.messagesDeleted += deletedMessages.count;

          // Delete documents
          const deletedDocuments = await tx.document.deleteMany({
            where: { uploadedById: user.id },
          });
          stats.documentsDeleted += deletedDocuments.count;

          // Delete cases
          const deletedCases = await tx.case.deleteMany({
            where: { clientId: user.id },
          });
          stats.casesDeleted += deletedCases.count;

          // Delete activity logs
          await tx.activityLog.deleteMany({
            where: { userId: user.id },
          });

          // Delete system settings (push tokens, etc.)
          await tx.systemSetting.deleteMany({
            where: {
              key: {
                startsWith: `user:${user.id}:`,
              },
            },
          });

          // Delete invite usage records (set userId to null for audit trail)
          await tx.inviteUsage.updateMany({
            where: { userId: user.id },
            data: { userId: null },
          });

          // Delete the user
          await tx.user.delete({
            where: { id: user.id },
          });
        });

        // Delete Firebase account (outside transaction as it's external service)
        if (adminAuth) {
          try {
            await adminAuth.deleteUser(user.id);
            logger.info('Firebase account deleted', { userId: user.id });
          } catch (firebaseError: any) {
            if (firebaseError.code === 'auth/user-not-found') {
              logger.warn('Firebase account not found (already deleted)', { userId: user.id });
            } else {
              logger.error('Failed to delete Firebase account', {
                userId: user.id,
                error: firebaseError.message,
              });
            }
          }
        }

        stats.usersDeleted++;
        logger.info('User permanently deleted', { userId: user.id });
      } catch (error: any) {
        logger.error('Error deleting user', { userId: user.id, error: error.message });
        stats.errors++;
      }
    }

    logger.info('GDPR scheduled deletions completed', {
      usersDeleted: stats.usersDeleted as number,
      casesDeleted: stats.casesDeleted as number,
      documentsDeleted: stats.documentsDeleted as number,
      messagesDeleted: stats.messagesDeleted as number,
      notificationsDeleted: stats.notificationsDeleted as number,
      errors: stats.errors as number,
    });

    return NextResponse.json({
      success: true,
      message: 'Scheduled deletions completed',
      stats,
    });
  } catch (error: any) {
    logger.error('Fatal error during scheduled deletions', { error: error.message });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process scheduled deletions',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Note: This endpoint should ONLY be called by Vercel Cron
// Set CRON_SECRET in your environment variables for security
