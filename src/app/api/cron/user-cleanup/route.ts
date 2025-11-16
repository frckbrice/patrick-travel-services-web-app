import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/utils/logger';

// Soft safety limits
const BATCH_LIMIT = Number(process.env.CRON_CLEANUP_BATCH_LIMIT || 100);
const INACTIVE_NO_CASES_DAYS = Number(process.env.CRON_CLEANUP_NO_CASES_DAYS || 90); // ~3 months
const INACTIVE_WITH_CASES_DAYS = Number(process.env.CRON_CLEANUP_WITH_CASES_DAYS || 180); // ~6 months

// Basic guard: require a shared secret to execute
function isAuthorized(req: NextRequest): boolean {
  const headerSecret = req.headers.get('x-cron-secret') || '';
  const envSecret = process.env.CRON_SECRET || '';
  return Boolean(envSecret) && headerSecret === envSecret;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Compute thresholds
  const now = new Date();
  const noCasesThreshold = new Date(now.getTime() - INACTIVE_NO_CASES_DAYS * 24 * 60 * 60 * 1000);
  const withCasesThreshold = new Date(
    now.getTime() - INACTIVE_WITH_CASES_DAYS * 24 * 60 * 60 * 1000
  );

  try {
    // Users with no cases and created at/before threshold
    const noCaseUsers = await prisma.user.findMany({
      where: {
        createdAt: { lte: noCasesThreshold },
        cases: { none: {} },
      },
      select: { id: true },
      take: BATCH_LIMIT,
    });

    // Users with at least one "in process" case and lastLoginAt <= threshold
    // NOTE: Adjust status values to match your DB enum/string. We consider these as "in process".
    const inProcessStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_REQUIRED', 'PROCESSING'];

    const withCaseUsers = await prisma.user.findMany({
      where: {
        // Schema field is `lastLogin`
        lastLogin: { lte: withCasesThreshold },
        cases: {
          some: {
            status: { in: inProcessStatuses as any },
          },
        },
      },
      select: { id: true },
      take: Math.max(0, BATCH_LIMIT - noCaseUsers.length),
    });

    const toHardDeleteIds = noCaseUsers.map((u) => u.id);
    const toSoftDeactivateIds = withCaseUsers.map((u) => u.id);

    let deletedCount = 0;
    let deactivatedCount = 0;

    const tx: any[] = [];

    if (toHardDeleteIds.length > 0) {
      // Hard-delete only users without cases to respect FK constraints
      tx.push(
        prisma.user.deleteMany({
          where: { id: { in: toHardDeleteIds } },
        })
      );
    }

    if (toSoftDeactivateIds.length > 0) {
      // For users with in-process cases, do NOT delete to avoid FK issues; deactivate instead
      tx.push(
        prisma.user.updateMany({
          where: { id: { in: toSoftDeactivateIds } },
          data: {
            isActive: false,
            deletionScheduledFor: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // schedule in 30 days
            deletionReason: 'Inactive 6+ months with in-process cases',
          },
        })
      );
    }

    if (tx.length > 0) {
      const results = await prisma.$transaction(tx);
      for (const r of results) {
        if ('count' in r) {
          // First result corresponds to deleteMany if present
          // Sum conservatively by checking which op ran
          deletedCount += r.count || 0;
        }
      }
      // If both ops ran, second is updateMany
      if (results.length === 2 && 'count' in results[1]) {
        deactivatedCount = results[1].count || 0;
      } else if (results.length === 1 && toSoftDeactivateIds.length > 0 && 'count' in results[0]) {
        deactivatedCount = results[0].count || 0;
      }
    }

    logger.info('Cron user cleanup executed', {
      hardDeleteCandidates: toHardDeleteIds.length,
      softDeactivateCandidates: toSoftDeactivateIds.length,
      deleted: deletedCount,
      deactivated: deactivatedCount,
      noCaseUsers: noCaseUsers.length,
      withCaseUsers: withCaseUsers.length,
      BATCH_LIMIT,
      INACTIVE_NO_CASES_DAYS,
      INACTIVE_WITH_CASES_DAYS,
    });

    return NextResponse.json({
      success: true,
      data: {
        processed: toHardDeleteIds.length + toSoftDeactivateIds.length,
        deleted: deletedCount,
        deactivated: deactivatedCount,
        noCaseUsers: noCaseUsers.length,
        withCaseUsers: withCaseUsers.length,
      },
    });
  } catch (error) {
    logger.error('Cron user cleanup failed', error);
    return NextResponse.json({ success: false, error: 'Cleanup failed' }, { status: 500 });
  }
}
