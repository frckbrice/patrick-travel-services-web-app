// PUT /api/faq/[id] - Update FAQ (admin only)
// DELETE /api/faq/[id] - Delete FAQ (admin only)

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { logger } from '@/lib/utils/logger';
import { successResponse } from '@/lib/utils/api-response';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { revalidatePath } from 'next/cache';

// Verify admin authentication helper
async function verifyAdmin(request: NextRequest) {
  if (!adminAuth) {
    throw new ApiError('Authentication service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError('Unauthorized', HttpStatus.UNAUTHORIZED);
  }

  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await adminAuth.verifyIdToken(token);

  if (decodedToken.role !== 'ADMIN') {
    throw new ApiError('Forbidden - Admin access required', HttpStatus.FORBIDDEN);
  }

  return decodedToken;
}

// PUT /api/faq/[id] - Update FAQ
const putHandler = asyncHandler(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    await verifyAdmin(request);

    const { id } = await context.params;
    const body = await request.json();
    const { question, answer, category, order, isActive } = body;

    // Check if FAQ exists
    const existingFaq = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!existingFaq) {
      throw new ApiError('FAQ not found', HttpStatus.NOT_FOUND);
    }

    // Update FAQ
    const faq = await prisma.fAQ.update({
      where: { id },
      data: {
        ...(question !== undefined && { question: question.trim() }),
        ...(answer !== undefined && { answer: answer.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Revalidate the FAQ pages
    try {
      revalidatePath('/', 'page');
      revalidatePath('/faq', 'page');
    } catch (error) {
      logger.warn('Failed to revalidate FAQ pages', { error });
    }

    logger.info('FAQ updated', { faqId: faq.id, category: faq.category });

    return successResponse({ faq }, 'FAQ updated successfully');
  }
);

// DELETE /api/faq/[id] - Delete FAQ
const deleteHandler = asyncHandler(
  async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    await verifyAdmin(request);

    const { id } = await context.params;
    if (!id) {
      throw new ApiError('Invalid FAQ ID', HttpStatus.BAD_REQUEST);
    }

    // Check if FAQ exists
    const existingFaq = await prisma.fAQ.findUnique({
      where: { id },
    });

    if (!existingFaq) {
      throw new ApiError('FAQ not found', HttpStatus.NOT_FOUND);
    }

    // Delete FAQ
    await prisma.fAQ.delete({
      where: { id },
    });

    // Revalidate the FAQ pages
    try {
      revalidatePath('/', 'page');
      revalidatePath('/faq', 'page');
    } catch (error) {
      logger.warn('Failed to revalidate FAQ pages', { error });
    }

    logger.info('FAQ deleted', { faqId: id });

    return successResponse({ id }, 'FAQ deleted successfully');
  }
);

// Apply middleware and export handlers
export const PUT = withCorsMiddleware(withRateLimit(putHandler, RateLimitPresets.STANDARD));

export const DELETE = withCorsMiddleware(withRateLimit(deleteHandler, RateLimitPresets.STANDARD));
