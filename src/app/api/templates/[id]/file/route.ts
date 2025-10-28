import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/templates/[id]/file - Download template file
const getHandler = asyncHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;

  if (!id) {
    throw new ApiError('Template ID is required', HttpStatus.BAD_REQUEST);
  }

  const template = await prisma.documentTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    throw new ApiError('Template not found', HttpStatus.NOT_FOUND);
  }

  if (!template.isActive) {
    throw new ApiError('Template is not available', HttpStatus.FORBIDDEN);
  }

  // Increment download count
  await prisma.documentTemplate.update({
    where: { id },
    data: {
      downloadCount: {
        increment: 1,
      },
    },
  });

  logger.info('Template file downloaded', { templateId: id, name: template.name });

  // Redirect to the actual file URL
  return NextResponse.redirect(template.fileUrl);
});

export const GET = withCorsMiddleware(withRateLimit(getHandler, RateLimitPresets.STANDARD));
