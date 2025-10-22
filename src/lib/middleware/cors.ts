/**
 * CORS Middleware for Mobile App Compatibility
 * Allows requests from mobile applications during development and production
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Allowed origins based on environment
 */
const getAllowedOrigins = (): string[] => {
  const origins = [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'];

  // Add mobile app origins in development
  if (process.env.NODE_ENV === 'development') {
    origins.push(
      'http://localhost:8081', // Expo development server
      'exp://localhost:8081', // Expo development
      'http://192.168.*.*:8081' // Local network for mobile testing
    );
  }

  // Add production mobile app origins from environment
  if (process.env.MOBILE_APP_URLS) {
    const mobileUrls = process.env.MOBILE_APP_URLS.split(',');
    origins.push(...mobileUrls);
  }

  return origins;
};

/**
 * Check if origin is allowed
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Allow requests without origin (like mobile apps)

  const allowedOrigins = getAllowedOrigins();

  // Check exact matches
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Check wildcard patterns for local network
  if (
    process.env.NODE_ENV === 'development' &&
    /^https?:\/\/(localhost|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):/.test(origin)
  ) {
    return true;
  }

  return false;
}

/**
 * CORS Headers
 */
export const corsHeaders = (origin: string | null = null) => {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    'Access-Control-Max-Age': '86400', // 24 hours
    'Access-Control-Allow-Credentials': 'true',
  };

  // Set origin based on request or wildcard in development
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (process.env.NODE_ENV === 'development') {
    headers['Access-Control-Allow-Origin'] = '*';
  } else {
    headers['Access-Control-Allow-Origin'] =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  return headers;
};

/**
 * Apply CORS headers to response
 */
export function withCors(response: NextResponse, origin: string | null = null): NextResponse {
  const headers = corsHeaders(origin);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Handle CORS preflight requests (OPTIONS)
 */
export function handleCorsPreFlight(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');

  const response = NextResponse.json({ message: 'OK' }, { status: 200 });

  return withCors(response, origin);
}

/**
 * CORS Middleware Wrapper
 * Wraps API handlers to automatically handle CORS
 */
// Overload for routes with required context (dynamic routes)
export function withCorsMiddleware<T>(
  handler: (req: NextRequest, context: T) => Promise<NextResponse>
): (req: NextRequest, context: T) => Promise<NextResponse>;

// Overload for routes with optional context (static routes)
export function withCorsMiddleware<T = any>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
): (req: NextRequest, context?: T) => Promise<NextResponse>;

// Implementation
export function withCorsMiddleware<T = any>(
  handler: (req: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: T): Promise<NextResponse> => {
    const origin = req.headers.get('origin');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return handleCorsPreFlight(req);
    }

    // Execute handler and add CORS headers
    const response = await handler(req, context);
    return withCors(response, origin);
  };
}
