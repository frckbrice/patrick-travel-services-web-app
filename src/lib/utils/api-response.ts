/**
 * Unified API Response Format
 * Consistent response structure for both web and mobile clients
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    timestamp: string;
    requestId?: string;
    [key: string]: unknown;
  };
}

/**
 * Success Response
 * Returns a standardized success response
 */
export function successResponse<T>(
  data?: T,
  message?: string,
  status: number = 200,
  meta?: Record<string, unknown>
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status }
  );
}

/**
 * Error Response
 * Returns a standardized error response
 */
export function errorResponse(
  error: string,
  status: number = 400,
  errors?: Record<string, string[]>
): NextResponse<ApiResponse> {
  logger.error('API Error Response', { error, status, errors });

  return NextResponse.json(
    {
      success: false,
      error,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Validation Error Response
 * Returns a standardized validation error response
 */
export function validationErrorResponse(
  errors: Record<string, string[]>,
  message: string = 'Validation failed'
): NextResponse<ApiResponse> {
  return errorResponse(message, 422, errors);
}

/**
 * Unauthorized Response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse<ApiResponse> {
  return errorResponse(message, 401);
}

/**
 * Forbidden Response
 */
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse<ApiResponse> {
  return errorResponse(message, 403);
}

/**
 * Not Found Response
 */
export function notFoundResponse(
  message: string = 'Resource not found'
): NextResponse<ApiResponse> {
  return errorResponse(message, 404);
}

/**
 * Server Error Response
 */
export function serverErrorResponse(
  message: string = 'Internal server error'
): NextResponse<ApiResponse> {
  return errorResponse(message, 500);
}
