// POST /api/chat/migrate - Migrate old caseId-based chats to new clientId-agentId format
// This consolidates old chat rooms that used caseId as the room ID into new format
// that uses clientId-agentId pair as the room ID

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';
import { adminDatabase } from '@/lib/firebase/firebase-admin';
import { getChatRoomIdFromCaseId } from '@/lib/firebase/chat.service.server';
import type { Database } from 'firebase-admin/database';

interface MigrateChatRequest {
  caseId?: string; // Optional: migrate specific case, otherwise migrate all
  dryRun?: boolean; // If true, only report what would be migrated without actually migrating
}

// POST /api/chat/migrate - Migrate old chats to new format
const postHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  if (!req.user) {
    throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  // Only allow admins to run migration
  if (req.user.role !== 'ADMIN') {
    throw new ApiError('Only admins can run chat migration', HttpStatus.FORBIDDEN);
  }

  if (!adminDatabase) {
    throw new ApiError('Firebase Admin not initialized', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  const body = (await request.json()) as MigrateChatRequest;
  const { caseId, dryRun = false } = body;

  try {
    const results: Array<{
      caseId: string;
      oldRoomId: string | null;
      newRoomId: string | null;
      status: 'migrated' | 'no_old_chat' | 'already_migrated' | 'error';
      messagesMerged?: number;
      error?: string;
    }> = [];

    if (caseId) {
      // Migrate specific case
      await migrateSingleCase(caseId, dryRun, results, adminDatabase!);
    } else {
      // Migrate all cases
      logger.info('Starting migration of all chats');

      // Get all cases that are assigned to agents
      const cases = await prisma.case.findMany({
        where: {
          assignedAgentId: { not: null },
        },
        select: {
          id: true,
        },
      });

      logger.info(`Found ${cases.length} cases to check for migration`);

      // Process in batches to avoid overwhelming Firebase
      const batchSize = 10;
      for (let i = 0; i < cases.length; i += batchSize) {
        const batch = cases.slice(i, i + batchSize);
        await Promise.all(
          batch.map((caseItem) => migrateSingleCase(caseItem.id, dryRun, results, adminDatabase!))
        );

        // Small delay between batches
        if (i + batchSize < cases.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }

    const summary = {
      total: results.length,
      migrated: results.filter((r) => r.status === 'migrated').length,
      alreadyMigrated: results.filter((r) => r.status === 'already_migrated').length,
      noOldChat: results.filter((r) => r.status === 'no_old_chat').length,
      errors: results.filter((r) => r.status === 'error').length,
    };

    logger.info('Chat migration completed', {
      dryRun,
      summary,
      caseId: caseId || 'all',
    });

    return successResponse(
      {
        dryRun,
        summary,
        results: results.slice(0, 100), // Limit results in response
        totalResults: results.length,
      },
      dryRun
        ? `Migration dry run completed. Would migrate ${summary.migrated} chat(s).`
        : `Migration completed. Migrated ${summary.migrated} chat(s).`
    );
  } catch (error) {
    logger.error('Failed to migrate chats', {
      caseId,
      dryRun,
      error: (error as Error)?.message,
    });
    throw error;
  }
});

async function migrateSingleCase(
  caseId: string,
  dryRun: boolean,
  results: Array<{
    caseId: string;
    oldRoomId: string | null;
    newRoomId: string | null;
    status: 'migrated' | 'no_old_chat' | 'already_migrated' | 'error';
    messagesMerged?: number;
    error?: string;
  }>,
  db: Database
): Promise<void> {
  try {
    // Check if old format chat exists (using caseId directly)
    const oldFormatExists = await db.ref(`chats/${caseId}`).get();

    // Get new format room ID
    const newRoomId = await getChatRoomIdFromCaseId(caseId);

    if (!newRoomId) {
      results.push({
        caseId,
        oldRoomId: null,
        newRoomId: null,
        status: 'error',
        error: 'Could not determine new room ID (case not assigned or missing Firebase UIDs)',
      });
      return;
    }

    // Check if new format room exists
    const newFormatExists = await db.ref(`chats/${newRoomId}`).get();

    if (!oldFormatExists.exists()) {
      // No old chat to migrate
      results.push({
        caseId,
        oldRoomId: null,
        newRoomId,
        status: 'no_old_chat',
      });
      return;
    }

    // Check if both rooms have the same caseId in caseReferences
    const oldMetadata = oldFormatExists.val();
    const newMetadata = newFormatExists.exists() ? newFormatExists.val() : null;

    const oldHasCase = oldFormatExists.exists(); // Old format uses caseId as room ID, so it's implied
    const newHasCase =
      newMetadata?.caseReferences?.some((ref: any) => ref.caseId === caseId) || false;

    if (!newFormatExists.exists()) {
      // Old chat exists but new doesn't - need to migrate
      if (dryRun) {
        results.push({
          caseId,
          oldRoomId: caseId,
          newRoomId,
          status: 'migrated',
          messagesMerged: 0, // Can't count in dry run
        });
      } else {
        try {
          // Manually migrate: copy messages and metadata from old to new
          await migrateChatFromOldToNew(caseId, newRoomId, db);
          const oldMessageCount = oldFormatExists.child('messages').exists()
            ? Object.keys(oldFormatExists.child('messages').val() || {}).length
            : 0;
          results.push({
            caseId,
            oldRoomId: caseId,
            newRoomId,
            status: 'migrated',
            messagesMerged: oldMessageCount,
          });
        } catch (migrateError: any) {
          results.push({
            caseId,
            oldRoomId: caseId,
            newRoomId,
            status: 'error',
            error: migrateError?.message || 'Migration failed',
          });
        }
      }
    } else {
      // Both exist - check if old one has different messages or case is missing from new
      if (!newHasCase) {
        // New room doesn't have this case - add case reference and migrate messages
        if (dryRun) {
          results.push({
            caseId,
            oldRoomId: caseId,
            newRoomId,
            status: 'migrated',
            messagesMerged: 0,
          });
        } else {
          try {
            await migrateChatFromOldToNew(caseId, newRoomId, db);
            results.push({
              caseId,
              oldRoomId: caseId,
              newRoomId,
              status: 'migrated',
              messagesMerged: oldFormatExists.child('messages').exists()
                ? Object.keys(oldFormatExists.child('messages').val() || {}).length
                : 0,
            });
          } catch (migrateError: any) {
            results.push({
              caseId,
              oldRoomId: caseId,
              newRoomId,
              status: 'error',
              error: migrateError?.message || 'Migration failed',
            });
          }
        }
      } else {
        // Both have the case - check if old one has more messages
        const oldMessages = oldFormatExists.child('messages');
        const newMessages = newFormatExists.child('messages');

        const oldMessageCount = oldMessages.exists() ? Object.keys(oldMessages.val()).length : 0;
        const newMessageCount = newMessages.exists() ? Object.keys(newMessages.val()).length : 0;

        if (oldMessageCount > newMessageCount) {
          // Old chat has more messages - migrate the missing ones
          if (dryRun) {
            results.push({
              caseId,
              oldRoomId: caseId,
              newRoomId,
              status: 'migrated',
              messagesMerged: oldMessageCount - newMessageCount,
            });
          } else {
            try {
              await migrateChatFromOldToNew(caseId, newRoomId, db);
              results.push({
                caseId,
                oldRoomId: caseId,
                newRoomId,
                status: 'migrated',
                messagesMerged: oldMessageCount - newMessageCount,
              });
            } catch (migrateError: any) {
              results.push({
                caseId,
                oldRoomId: caseId,
                newRoomId,
                status: 'error',
                error: migrateError?.message || 'Migration failed',
              });
            }
          }
        } else {
          // Already migrated or no new messages
          results.push({
            caseId,
            oldRoomId: caseId,
            newRoomId,
            status: 'already_migrated',
          });
        }
      }
    }
  } catch (error: any) {
    logger.error('Failed to migrate single case', {
      caseId,
      error: error?.message,
    });
    results.push({
      caseId,
      oldRoomId: null,
      newRoomId: null,
      status: 'error',
      error: error?.message || 'Unknown error',
    });
  }
}

/**
 * Migrate chat from old format (caseId as room ID) to new format (clientId-agentId)
 */
async function migrateChatFromOldToNew(
  caseId: string,
  newRoomId: string,
  db: Database
): Promise<void> {
  const oldRoomRef = db.ref(`chats/${caseId}`);
  const newRoomRef = db.ref(`chats/${newRoomId}`);

  const oldRoomSnapshot = await oldRoomRef.get();
  if (!oldRoomSnapshot.exists()) {
    logger.warn('Old chat room does not exist, nothing to migrate', { caseId });
    return;
  }

  const oldData = oldRoomSnapshot.val();
  const oldMessages = oldData.messages || {};
  const oldMetadata = oldData.metadata || {};

  // Get case info to add to new room's caseReferences
  const caseData = await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      referenceNumber: true,
      submissionDate: true,
    },
  });

  // Check if new room exists
  const newRoomSnapshot = await newRoomRef.get();
  const newMetadata = newRoomSnapshot.exists() ? newRoomSnapshot.val().metadata || {} : null;

  if (!newMetadata) {
    // Create new metadata if it doesn't exist
    // This should have been created during chat initialization, but handle it gracefully
    logger.warn('New chat room metadata does not exist, skipping migration', {
      caseId,
      newRoomId,
    });
    return;
  }

  // Add case to caseReferences if not already present
  const caseRefs = newMetadata.caseReferences || [];
  const caseExists = caseRefs.some((ref: any) => ref.caseId === caseId);

  if (!caseExists) {
    caseRefs.push({
      caseId,
      caseReference: caseData?.referenceNumber || caseId,
      assignedAt: caseData?.submissionDate?.getTime() || Date.now(),
    });

    await newRoomRef.child('metadata').update({
      caseReferences: caseRefs,
      updatedAt: Date.now(),
    });
  }

  // Migrate messages that don't already exist in new room
  const newMessagesSnapshot = await newRoomRef.child('messages').get();
  const existingNewMessages = newMessagesSnapshot.exists() ? newMessagesSnapshot.val() : {};
  const existingMessageIds = new Set(Object.keys(existingNewMessages));

  let migratedCount = 0;
  for (const [messageId, message] of Object.entries(oldMessages)) {
    if (!existingMessageIds.has(messageId)) {
      await newRoomRef.child(`messages/${messageId}`).set(message);
      migratedCount++;
    }
  }

  // Update new room's lastMessage if old room has a newer message
  const allMessages = { ...existingNewMessages, ...oldMessages };
  let latestMessage: any = null;
  let latestTime = 0;

  for (const message of Object.values(allMessages) as any[]) {
    const msgTime = message.sentAt || message.createdAt || 0;
    if (msgTime > latestTime) {
      latestTime = msgTime;
      latestMessage = message;
    }
  }

  if (latestMessage && latestTime > (newMetadata.lastMessageTime || 0)) {
    await newRoomRef.child('metadata').update({
      lastMessage: latestMessage.content?.substring(0, 100) || newMetadata.lastMessage,
      lastMessageTime: latestTime,
      updatedAt: Date.now(),
    });
  }

  logger.info('Chat migration completed', {
    caseId,
    oldRoomId: caseId,
    newRoomId,
    messagesMigrated: migratedCount,
  });

  // Optionally delete old room after successful migration
  // Uncomment if you want to clean up old format rooms
  // await oldRoomRef.remove();
}

// Apply middleware: CORS -> Rate Limit -> Auth -> Handler
export const POST = withCorsMiddleware(
  withRateLimit(authenticateToken(postHandler), RateLimitPresets.STANDARD)
);
