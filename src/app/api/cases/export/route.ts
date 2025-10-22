// Cases Export API - GET (export filtered cases to CSV/XLSX)
// Available for ADMIN and AGENT users

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { ERROR_MESSAGES } from '@/lib/constants';
import { logger } from '@/lib/utils/logger';
import { asyncHandler, ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { withCorsMiddleware } from '@/lib/middleware/cors';
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit';
import { authenticateToken, AuthenticatedRequest } from '@/lib/auth/middleware';

// Helper function to convert cases to CSV
function convertToCsv(cases: any[]): string {
  if (cases.length === 0) return '';

  // CSV Headers
  const headers = [
    'Reference Number',
    'Customer Name',
    'Customer Email',
    'Service Type',
    'Status',
    'Priority',
    'Submission Date',
    'Last Updated',
    'Assigned Agent',
    'Documents Count',
  ];

  // Build CSV rows
  const rows = cases.map((c) => {
    const customerName = c.client ? `${c.client.firstName} ${c.client.lastName}`.trim() : 'N/A';
    const customerEmail = c.client?.email || 'N/A';
    const assignedAgent = c.assignedAgent
      ? `${c.assignedAgent.firstName} ${c.assignedAgent.lastName}`.trim()
      : 'Unassigned';
    const documentsCount = c.documents?.length || 0;

    return [
      c.referenceNumber,
      `"${customerName}"`, // Quoted in case of commas in name
      customerEmail,
      c.serviceType,
      c.status,
      c.priority,
      new Date(c.submissionDate).toLocaleDateString(),
      new Date(c.lastUpdated).toLocaleDateString(),
      `"${assignedAgent}"`,
      documentsCount,
    ];
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

  return csvContent;
}

// Helper function to convert cases to XLSX (TSV format for simplicity)
function convertToXlsx(cases: any[]): string {
  if (cases.length === 0) return '';

  // TSV Headers
  const headers = [
    'Reference Number',
    'Customer Name',
    'Customer Email',
    'Service Type',
    'Status',
    'Priority',
    'Submission Date',
    'Last Updated',
    'Assigned Agent',
    'Documents Count',
    'Internal Notes',
  ];

  // Build TSV rows
  const rows = cases.map((c) => {
    const customerName = c.client ? `${c.client.firstName} ${c.client.lastName}`.trim() : 'N/A';
    const customerEmail = c.client?.email || 'N/A';
    const assignedAgent = c.assignedAgent
      ? `${c.assignedAgent.firstName} ${c.assignedAgent.lastName}`.trim()
      : 'Unassigned';
    const documentsCount = c.documents?.length || 0;
    const notes = c.internalNotes?.replace(/[\t\n\r]/g, ' ') || '';

    return [
      c.referenceNumber,
      customerName,
      customerEmail,
      c.serviceType,
      c.status,
      c.priority,
      new Date(c.submissionDate).toLocaleDateString(),
      new Date(c.lastUpdated).toLocaleDateString(),
      assignedAgent,
      documentsCount,
      notes,
    ];
  });

  // Combine headers and rows with tab separator
  const tsvContent = [headers, ...rows].map((row) => row.join('\t')).join('\n');

  return tsvContent;
}

// GET /api/cases/export - Export filtered cases
const getHandler = asyncHandler(async (request: NextRequest) => {
  const req = request as AuthenticatedRequest;

  // Only ADMIN and AGENT users can export
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'AGENT')) {
    throw new ApiError(ERROR_MESSAGES.FORBIDDEN, HttpStatus.FORBIDDEN);
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv'; // csv or xlsx
  const status = searchParams.get('status');
  const serviceType = searchParams.get('serviceType');
  const assignedAgentId = searchParams.get('assignedAgentId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const search = searchParams.get('search');

  // Validate format
  if (!['csv', 'xlsx'].includes(format)) {
    throw new ApiError('Invalid format. Use csv or xlsx', HttpStatus.BAD_REQUEST);
  }

  // Build filter based on user role and query params
  const where: any = {};

  // AGENT users can only export their assigned cases
  if (req.user.role === 'AGENT') {
    where.assignedAgentId = req.user.userId;
  }

  // Apply filters
  if (status) {
    where.status = status;
  }

  if (serviceType) {
    where.serviceType = serviceType;
  }

  if (assignedAgentId && req.user.role === 'ADMIN') {
    where.assignedAgentId = assignedAgentId;
  }

  // Date range filter
  if (startDate || endDate) {
    where.submissionDate = {};
    if (startDate) {
      where.submissionDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.submissionDate.lte = new Date(endDate);
    }
  }

  // Search filter (reference number or customer name)
  if (search) {
    where.OR = [
      { referenceNumber: { contains: search, mode: 'insensitive' } },
      {
        client: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  // Fetch cases with relations
  const cases = await prisma.case.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      assignedAgent: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      documents: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { submissionDate: 'desc' },
    // Limit to prevent excessive data export
    take: 1000,
  });

  logger.info('Cases exported', {
    userId: req.user.userId,
    role: req.user.role,
    format,
    count: cases.length,
  });

  // Convert to requested format
  let content: string;
  let contentType: string;
  let filename: string;

  if (format === 'csv') {
    content = convertToCsv(cases);
    contentType = 'text/csv';
    filename = `cases-export-${new Date().toISOString().split('T')[0]}.csv`;
  } else {
    content = convertToXlsx(cases);
    contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    filename = `cases-export-${new Date().toISOString().split('T')[0]}.xlsx`;
  }

  // Return file download response
  return new NextResponse(content, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    },
  });
});

// Apply middleware and authentication
export const GET = withCorsMiddleware(
  withRateLimit(authenticateToken(getHandler), RateLimitPresets.STANDARD)
);
