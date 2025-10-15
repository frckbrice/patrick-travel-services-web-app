/**
 * Comprehensive Error Handling for Next.js API Routes
 * Provides consistent error responses with proper status codes
 * Compatible with both web and mobile clients
 */

import { NextResponse } from "next/server";
import { logger } from "./logger";
import { ApiResponse } from "./api-response";

/**
 * HTTP Status Codes
 */
export const HttpStatus = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Error Messages Mapping
 */
export const ErrorMessages = {
    // 400 - Bad Request
    400: "Invalid request. Please check your input.",
    
    // 401 - Unauthorized
    401: "Authentication failed. Please login again.",
    
    // 403 - Forbidden
    403: "You do not have permission to perform this action.",
    
    // 404 - Not Found
    404: "The requested resource was not found.",
    
    // 409 - Conflict
    409: "This action conflicts with existing data.",
    
    // 422 - Unprocessable Entity
    422: "The provided data is invalid.",
    
    // 429 - Too Many Requests
    429: "Too many requests. Please try again later.",
    
    // 500-504 - Server Errors
    500: "Service temporarily unavailable. Please try again later.",
    502: "Service temporarily unavailable. Please try again later.",
    503: "Service temporarily unavailable. Please try again later.",
    504: "Service temporarily unavailable. Please try again later.",
    
    // Network/Timeout
    NETWORK_ERROR: "Request timed out. Please check your connection.",
} as const;

/**
 * Custom API Error Class
 */
export class ApiError extends Error {
    public statusCode: number;
    public details?: unknown;
    public code?: string;

    constructor(
        message: string,
        statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
        details?: unknown,
        code?: string
    ) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        this.details = details;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Firebase Error Code Mapping
 */
const FirebaseErrorMap: Record<string, { status: number; message: string }> = {
    "auth/email-already-exists": {
        status: HttpStatus.CONFLICT,
        message: "Email address is already in use.",
    },
    "auth/invalid-email": {
        status: HttpStatus.BAD_REQUEST,
        message: "Invalid email address format.",
    },
    "auth/user-not-found": {
        status: HttpStatus.NOT_FOUND,
        message: "User account not found.",
    },
    "auth/wrong-password": {
        status: HttpStatus.UNAUTHORIZED,
        message: "Incorrect password.",
    },
    "auth/user-disabled": {
        status: HttpStatus.FORBIDDEN,
        message: "User account has been disabled.",
    },
    "auth/too-many-requests": {
        status: HttpStatus.TOO_MANY_REQUESTS,
        message: "Too many failed login attempts. Please try again later.",
    },
    "auth/weak-password": {
        status: HttpStatus.BAD_REQUEST,
        message: "Password is too weak. Must be at least 6 characters.",
    },
    "auth/invalid-credential": {
        status: HttpStatus.UNAUTHORIZED,
        message: "Invalid credentials provided.",
    },
    "auth/id-token-expired": {
        status: HttpStatus.UNAUTHORIZED,
        message: "Session expired. Please login again.",
    },
    "auth/id-token-revoked": {
        status: HttpStatus.UNAUTHORIZED,
        message: "Session has been revoked. Please login again.",
    },
};

/**
 * Parse Firebase Error
 */
export function parseFirebaseError(error: unknown): {
    status: number;
    message: string;
} {
    const errorCode = (error as { code?: string }).code;
    
    if (errorCode && FirebaseErrorMap[errorCode]) {
        return FirebaseErrorMap[errorCode];
    }

    return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: ErrorMessages[500],
    };
}

/**
 * Handle API Error
 * Centralized error handler for all API routes
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
    // Log the error
    logger.error("API Error:", error);

    // Handle ApiError instances
    if (error instanceof ApiError) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                code: error.code,
                ...(error.details && { errors: error.details }),
                meta: {
                    timestamp: new Date().toISOString(),
                },
            },
            { status: error.statusCode }
        );
    }

    // Handle Firebase errors
    if ((error as { code?: string }).code?.startsWith("auth/")) {
        const { status, message } = parseFirebaseError(error);
        return NextResponse.json(
            {
                success: false,
                error: message,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            },
            { status }
        );
    }

    // Handle Prisma errors
    if ((error as { code?: string }).code?.startsWith("P")) {
        const prismaError = error as { code: string; meta?: { target?: string[] } };
        
        if (prismaError.code === "P2002") {
            return NextResponse.json(
                {
                    success: false,
                    error: ErrorMessages[409],
                    details: `Duplicate value for field: ${prismaError.meta?.target?.join(", ")}`,
                    meta: {
                        timestamp: new Date().toISOString(),
                    },
                },
                { status: HttpStatus.CONFLICT }
            );
        }

        if (prismaError.code === "P2025") {
            return NextResponse.json(
                {
                    success: false,
                    error: ErrorMessages[404],
                    meta: {
                        timestamp: new Date().toISOString(),
                    },
                },
                { status: HttpStatus.NOT_FOUND }
            );
        }
    }

    // Handle network/timeout errors
    if (
        error instanceof Error &&
        (error.message.includes("timeout") ||
            error.message.includes("network") ||
            error.message.includes("ECONNREFUSED"))
    ) {
        return NextResponse.json(
            {
                success: false,
                error: ErrorMessages.NETWORK_ERROR,
                meta: {
                    timestamp: new Date().toISOString(),
                },
            },
            { status: HttpStatus.GATEWAY_TIMEOUT }
        );
    }

    // Handle generic Error instances
    if (error instanceof Error) {
        return NextResponse.json(
            {
                success: false,
                error: error.message || ErrorMessages[500],
                meta: {
                    timestamp: new Date().toISOString(),
                },
            },
            { status: HttpStatus.INTERNAL_SERVER_ERROR }
        );
    }

    // Handle unknown errors
    return NextResponse.json(
        {
            success: false,
            error: ErrorMessages[500],
            meta: {
                timestamp: new Date().toISOString(),
            },
        },
        { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
}

/**
 * Async Error Handler Wrapper
 * Wraps async route handlers to catch errors automatically
 */
export function asyncHandler<T>(
    handler: (req: Request, context?: T) => Promise<NextResponse>
) {
    return async (req: Request, context?: T): Promise<NextResponse> => {
        try {
            return await handler(req, context);
        } catch (error) {
            return handleApiError(error);
        }
    };
}

