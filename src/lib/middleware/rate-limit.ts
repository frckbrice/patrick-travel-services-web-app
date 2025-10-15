/**
 * Rate Limiting Middleware for Next.js API Routes
 * Prevents API abuse and protects against DDoS attacks
 */

import { NextRequest, NextResponse } from "next/server";
import { ApiError, HttpStatus, ErrorMessages } from "../utils/error-handler";

/**
 * Rate Limit Configuration
 */
interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
    message?: string; // Custom error message
    skipSuccessfulRequests?: boolean; // Don't count successful requests
    skipFailedRequests?: boolean; // Don't count failed requests
}

/**
 * In-memory store for rate limiting
 * In production, use Redis or similar for distributed systems
 */
class RateLimitStore {
    private store: Map<string, { count: number; resetTime: number }>;

    constructor() {
        this.store = new Map();
    }

    increment(key: string, windowMs: number): { count: number; resetTime: number } {
        const now = Date.now();
        const existing = this.store.get(key);

        if (existing && existing.resetTime > now) {
            // Within the current window
            existing.count++;
            return existing;
        }

        // New window
        const resetTime = now + windowMs;
        const entry = { count: 1, resetTime };
        this.store.set(key, entry);

        // Clean up old entries
        this.cleanup(now);

        return entry;
    }

    reset(key: string): void {
        this.store.delete(key);
    }

    private cleanup(now: number): void {
        // Remove expired entries (runs periodically)
        if (Math.random() > 0.9) {
            // 10% chance to cleanup
            for (const [key, value] of this.store.entries()) {
                if (value.resetTime <= now) {
                    this.store.delete(key);
                }
            }
        }
    }
}

const rateLimitStore = new RateLimitStore();

/**
 * Get client identifier (IP address or user ID)
 */
function getClientIdentifier(req: NextRequest): string {
    // Try to get user ID from auth (if authenticated)
    const userId = req.headers.get("x-user-id");
    if (userId) return `user:${userId}`;

    // Get IP address from headers
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "unknown";

    return `ip:${ip}`;
}

/**
 * Rate Limit Presets
 */
export const RateLimitPresets = {
    // Strict - for sensitive endpoints like authentication
    STRICT: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        message: "Too many attempts. Please try again in 15 minutes.",
    },

    // Auth - for login/register endpoints
    AUTH: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 10,
        message: "Too many authentication attempts. Please try again later.",
    },

    // Standard - for regular API endpoints
    STANDARD: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 60,
    },

    // Generous - for high-frequency endpoints
    GENEROUS: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 120,
    },

    // Upload - for file upload endpoints
    UPLOAD: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
        message: "Upload limit reached. Please wait before uploading again.",
    },
} as const;

/**
 * Rate Limiter Middleware
 */
export function rateLimit(config: RateLimitConfig) {
    const {
        windowMs,
        maxRequests,
        message = ErrorMessages[429],
        skipSuccessfulRequests = false,
        skipFailedRequests = false,
    } = config;

    return async (
        handler: (req: NextRequest) => Promise<NextResponse>
    ): Promise<(req: NextRequest) => Promise<NextResponse>> => {
        return async (req: NextRequest): Promise<NextResponse> => {
            const clientId = getClientIdentifier(req);
            const key = `${req.nextUrl.pathname}:${clientId}`;

            // Check rate limit
            const { count, resetTime } = rateLimitStore.increment(key, windowMs);

            // Add rate limit headers
            const remaining = Math.max(0, maxRequests - count);
            const resetDate = new Date(resetTime);

            // Execute handler
            const response = await handler(req);

            // Optionally skip counting based on response
            if (
                (skipSuccessfulRequests && response.status < 400) ||
                (skipFailedRequests && response.status >= 400)
            ) {
                rateLimitStore.reset(key);
            }

            // Add rate limit headers to response
            response.headers.set("X-RateLimit-Limit", maxRequests.toString());
            response.headers.set("X-RateLimit-Remaining", remaining.toString());
            response.headers.set("X-RateLimit-Reset", resetDate.toISOString());

            // Check if limit exceeded
            if (count > maxRequests) {
                const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

                return NextResponse.json(
                    {
                        success: false,
                        error: message,
                        meta: {
                            timestamp: new Date().toISOString(),
                            retryAfter,
                        },
                    },
                    {
                        status: HttpStatus.TOO_MANY_REQUESTS,
                        headers: {
                            "Retry-After": retryAfter.toString(),
                            "X-RateLimit-Limit": maxRequests.toString(),
                            "X-RateLimit-Remaining": "0",
                            "X-RateLimit-Reset": resetDate.toISOString(),
                        },
                    }
                );
            }

            return response;
        };
    };
}

/**
 * Convenience function to create a rate-limited handler
 */
export function withRateLimit(
    handler: (req: NextRequest) => Promise<NextResponse>,
    config: RateLimitConfig = RateLimitPresets.STANDARD
): (req: NextRequest) => Promise<NextResponse> {
    const limiter = rateLimit(config);
    return async (req: NextRequest) => {
        const limitedHandler = await limiter(handler);
        return limitedHandler(req);
    };
}

