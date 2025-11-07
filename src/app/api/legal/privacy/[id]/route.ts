// // PUT /api/legal/privacy/[id] - Update Privacy (admin only)
// DELETE /api/legal/privacy/[id] - Delete Privacy (admin only)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';

async function verifyAdmin(request: NextRequest) {
  if (!adminAuth) {
    throw new ApiError('Authentication service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
  }
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }
  const token = authHeader.split('Bearer ')[1];
  const decoded = await adminAuth.verifyIdToken(token);
  if (decoded.role !== 'ADMIN') {
    throw new ApiError('Forbidden - Admin access required', HttpStatus.FORBIDDEN);
  }
}

const putHandler = asyncHandler(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    await verifyAdmin(request);
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.legalDocument.findUnique({ where: { id } });
    if (!existing || existing.type !== 'PRIVACY') {
      throw new ApiError('Privacy document not found', HttpStatus.NOT_FOUND);
    }

    const { title, slug, version, content, isActive, publishedAt, language } = body ?? {};

    // Validate language if provided
    if (language !== undefined && !['en', 'fr'].includes(language)) {
      throw new ApiError('Invalid language code. Supported: en, fr', HttpStatus.BAD_REQUEST);
    }

    const updated = await prisma.legalDocument.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(slug !== undefined && { slug: String(slug).trim() }),
        ...(version !== undefined && { version: version ? String(version).trim() : null }),
        ...(content !== undefined && { content: String(content) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(publishedAt !== undefined && {
          publishedAt: publishedAt ? new Date(publishedAt) : null,
        }),
        ...(language !== undefined && { language: String(language).trim() }),
      },
    });

    return successResponse({ document: updated }, 'Privacy document updated');
  }
);

const deleteHandler = asyncHandler(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    await verifyAdmin(request);
    const { id } = await context.params;

    const existing = await prisma.legalDocument.findUnique({ where: { id } });
    if (!existing || existing.type !== 'PRIVACY') {
      throw new ApiError('Privacy document not found', HttpStatus.NOT_FOUND);
    }

    await prisma.legalDocument.delete({ where: { id } });
    return successResponse({ id }, 'Privacy document deleted');
  }
);

export const PUT = withCorsMiddleware(withRateLimit(putHandler, RateLimitPresets.STANDARD));
export const DELETE = withCorsMiddleware(withRateLimit(deleteHandler, RateLimitPresets.STANDARD));
