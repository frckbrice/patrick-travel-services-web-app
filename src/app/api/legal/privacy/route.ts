// GET /api/legal/privacy - Get Privacy docs (public; active by default)
// POST /api/legal/privacy - Create Privacy doc (admin only)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';

const getHandler = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';
  const latestOnly = searchParams.get('latest') === 'true';
  const language = searchParams.get('language') || 'en'; // Default to 'en'

  const where: any = {
    type: 'PRIVACY',
    language: language,
    ...(includeInactive ? {} : { isActive: true }),
  };

  if (latestOnly) {
    const latest = await prisma.legalDocument.findFirst({
      where,
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
    });
    return successResponse({ document: latest });
  }

  const docs = await prisma.legalDocument.findMany({
    where,
    orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
    select: {
      id: true,
      type: true,
      language: true,
      title: true,
      slug: true,
      version: true,
      content: true,
      isActive: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return successResponse({ documents: docs, total: docs.length });
});

const postHandler = asyncHandler(async (request: NextRequest) => {
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

  const body = await request.json();
  const { title, slug, version, content, isActive, publishedAt, language } = body ?? {};

  if (!title || !slug || !content || !language) {
    throw new ApiError('title, slug, content, and language are required', HttpStatus.BAD_REQUEST);
  }

  // Validate language code
  if (!['en', 'fr'].includes(language)) {
    throw new ApiError('Invalid language code. Supported: en, fr', HttpStatus.BAD_REQUEST);
  }

  const created = await prisma.legalDocument.create({
    data: {
      type: 'PRIVACY',
      language: String(language).trim(),
      title: String(title).trim(),
      slug: String(slug).trim(),
      version: version ? String(version).trim() : null,
      content: String(content),
      isActive: isActive ?? true,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
    },
  });

  return successResponse({ document: created }, 'Privacy document created', 201);
});

export const GET = withCorsMiddleware(withRateLimit(getHandler, RateLimitPresets.GENEROUS));
export const POST = withCorsMiddleware(withRateLimit(postHandler, RateLimitPresets.STANDARD));
