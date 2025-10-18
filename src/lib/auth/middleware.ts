// Authentication middleware for Patrick Travel Services

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '../firebase/firebase-admin';
import { Role } from '../types';
import { ERROR_MESSAGES } from '../constants';
import { logger } from '../utils/logger';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface FirebaseUser {
  uid: string;
  email: string;
  role: Role;
  userId: string; // Database user ID
}

export interface AuthenticatedRequest extends NextRequest {
  user?: FirebaseUser;
  firebaseToken?: DecodedIdToken;
}

// Overload for routes with context (dynamic routes)
export function authenticateToken<T>(
  handler: (req: AuthenticatedRequest, context: T) => Promise<NextResponse>
): (req: NextRequest, context: T) => Promise<NextResponse>;

// Overload for routes without context (static routes)
export function authenticateToken(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse>;

// Implementation
export function authenticateToken<T = never>(
  handler: (req: AuthenticatedRequest, context?: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      // Check if Firebase Admin is initialized
      if (!adminAuth) {
        logger.error('Firebase Admin not initialized');
        return NextResponse.json(
          { success: false, error: 'Authentication service unavailable' },
          { status: 503 }
        );
      }

      const authHeader = req.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

      if (!token) {
        return NextResponse.json(
          { success: false, error: ERROR_MESSAGES.UNAUTHORIZED },
          { status: 401 }
        );
      }

      // Verify Firebase ID token
      const decodedToken = await adminAuth.verifyIdToken(token);

      if (!decodedToken) {
        return NextResponse.json(
          { success: false, error: ERROR_MESSAGES.INVALID_TOKEN },
          { status: 401 }
        );
      }

      // Extract custom claims or use defaults
      const role = (decodedToken.role as Role) || Role.CLIENT;
      const userId = (decodedToken.userId as string) || decodedToken.uid;

      // Add user to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        role,
        userId,
      };
      authenticatedReq.firebaseToken = decodedToken;

      // Call handler with or without context based on what was provided
      if (context !== undefined) {
        return handler(authenticatedReq, context);
      } else {
        return handler(authenticatedReq);
      }
    } catch (error) {
      logger.error('Authentication error', error);
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }
  };
}

export const authorizeRoles = (allowedRoles: Role[]) => {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return async (req: AuthenticatedRequest): Promise<NextResponse> => {
      try {
        if (!req.user) {
          return NextResponse.json(
            { success: false, error: ERROR_MESSAGES.UNAUTHORIZED },
            { status: 401 }
          );
        }

        if (!allowedRoles.includes(req.user.role)) {
          return NextResponse.json(
            { success: false, error: ERROR_MESSAGES.FORBIDDEN },
            { status: 403 }
          );
        }

        return handler(req);
      } catch (error) {
        logger.error('Authorization error', error);
        return NextResponse.json(
          { success: false, error: ERROR_MESSAGES.FORBIDDEN },
          { status: 403 }
        );
      }
    };
  };
};
