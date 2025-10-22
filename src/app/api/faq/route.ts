// GET /api/faq - Get all active FAQs (public endpoint)
// POST /api/faq - Create new FAQ (admin only)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { logger } from '@/lib/utils/logger';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { revalidatePath } from 'next/cache';

// GET /api/faq - Public endpoint for fetching active FAQs
const getHandler = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const includeInactive = searchParams.get('includeInactive') === 'true';

  // Build query filters
  const where: any = {};

  // Only include inactive FAQs if explicitly requested (admin view)
  if (!includeInactive) {
    where.isActive = true;
  }

  if (category) {
    where.category = category;
  }

  // Fetch FAQs ordered by category and order
  const faqs = await prisma.fAQ.findMany({
    where,
    orderBy: [{ category: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      question: true,
      answer: true,
      category: true,
      order: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Group FAQs by category
  const faqsByCategory = faqs.reduce((acc: any, faq: any) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {});

  return successResponse({
    faqs,
    faqsByCategory,
    categories: Object.keys(faqsByCategory),
    total: faqs.length,
  });
});

// POST /api/faq - Create new FAQ (admin only)
const postHandler = asyncHandler(async (request: NextRequest) => {
  // Verify admin authentication
  if (!adminAuth) {
    throw new ApiError('Authentication service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  const token = authHeader.split('Bearer ')[1];
  let decodedToken;

  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch (error) {
    throw new ApiError('Invalid authentication token', HttpStatus.UNAUTHORIZED);
  }

  // Check if user is ADMIN
  if (decodedToken.role !== 'ADMIN') {
    throw new ApiError('Forbidden - Admin access required', HttpStatus.FORBIDDEN);
  }

  const body = await request.json();
  const { question, answer, category, order, isActive } = body;

  // Validation
  if (!question || !answer || !category) {
    throw new ApiError('Question, answer, and category are required', HttpStatus.BAD_REQUEST);
  }

  // Create FAQ
  const faq = await prisma.fAQ.create({
    data: {
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim(),
      order: order ?? 0,
      isActive: isActive ?? true,
    },
  });

  // Revalidate the FAQ pages to update static content
  try {
    revalidatePath('/', 'page');
    revalidatePath('/faq', 'page');
  } catch (error) {
    logger.warn('Failed to revalidate FAQ pages', { error });
  }

  logger.info('FAQ created', { faqId: faq.id, category: faq.category });

  return successResponse({ faq }, 'FAQ created successfully', 201);
});

// Apply middleware and export handlers
export const GET = withCorsMiddleware(withRateLimit(getHandler, RateLimitPresets.GENEROUS));

export const POST = withCorsMiddleware(withRateLimit(postHandler, RateLimitPresets.STANDARD));
