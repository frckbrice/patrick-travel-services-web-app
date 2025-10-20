#!/usr/bin/env tsx
/**
 * GDPR Scheduled Account Deletion Script
 *
 * This script should run daily (cron job) to permanently delete accounts
 * that have been scheduled for deletion (30 days after user requested deletion).
 *
 * Usage:
 *   node --loader tsx scripts/process-scheduled-deletions.ts
 *
 * Or add to cron:
 *   0 2 * * * cd /path/to/project && node --loader tsx scripts/process-scheduled-deletions.ts
 *
 * Process:
 * 1. Find users where deletionScheduledFor <= NOW()
 * 2. Delete all related data (cases, documents, messages, notifications, etc.)
 * 3. Delete Firebase account
 * 4. Delete user record from database
 * 5. Log all deletions for audit trail
 */

import { PrismaClient } from '@prisma/client';
import { adminAuth } from '../src/lib/firebase/firebase-admin';

const prisma = new PrismaClient();

interface DeletionStats {
  usersDeleted: number;
  casesDeleted: number;
  documentsDeleted: number;
  messagesDeleted: number;
  notificationsDeleted: number;
  errors: number;
}

async function processScheduledDeletions(): Promise<DeletionStats> {
  const stats: DeletionStats = {
    usersDeleted: 0,
    casesDeleted: 0,
    documentsDeleted: 0,
    messagesDeleted: 0,
    notificationsDeleted: 0,
    errors: 0,
  };

  console.log('🗑️  Starting scheduled account deletions...');
  console.log('📅 Date:', new Date().toISOString());

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
      console.log('✅ No accounts scheduled for deletion.');
      return stats;
    }

    console.log(`📋 Found ${usersToDelete.length} account(s) to delete.`);

    // Process each user deletion
    for (const user of usersToDelete) {
      console.log(`\n🔄 Processing user: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Scheduled: ${user.deletionScheduledFor?.toISOString()}`);
      console.log(`   Reason: ${user.deletionReason || 'Not provided'}`);

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

          // Delete documents (CASCADE will handle this via case deletion, but delete explicitly)
          const deletedDocuments = await tx.document.deleteMany({
            where: { uploadedById: user.id },
          });
          stats.documentsDeleted += deletedDocuments.count;

          // Delete cases (CASCADE will handle related data)
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
            console.log(`   ✅ Firebase account deleted`);
          } catch (firebaseError: any) {
            // Firebase account may already be deleted or not exist
            if (firebaseError.code === 'auth/user-not-found') {
              console.log(`   ⚠️  Firebase account not found (already deleted)`);
            } else {
              console.error(`   ❌ Failed to delete Firebase account:`, firebaseError.message);
              // Continue anyway - database is cleaned up
            }
          }
        }

        stats.usersDeleted++;
        console.log(`   ✅ User permanently deleted`);
      } catch (error: any) {
        console.error(`   ❌ Error deleting user ${user.id}:`, error.message);
        stats.errors++;
        // Continue with next user
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 DELETION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Users deleted:         ${stats.usersDeleted}`);
    console.log(`📁 Cases deleted:         ${stats.casesDeleted}`);
    console.log(`📄 Documents deleted:     ${stats.documentsDeleted}`);
    console.log(`💬 Messages deleted:      ${stats.messagesDeleted}`);
    console.log(`🔔 Notifications deleted: ${stats.notificationsDeleted}`);
    console.log(`❌ Errors:                ${stats.errors}`);
    console.log('='.repeat(50));

    return stats;
  } catch (error: any) {
    console.error('❌ Fatal error during scheduled deletions:', error.message);
    throw error;
  }
}

// Run the script
processScheduledDeletions()
  .then((stats) => {
    console.log('\n✅ Scheduled deletions completed successfully.');
    process.exit(stats.errors > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n❌ Scheduled deletions failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
