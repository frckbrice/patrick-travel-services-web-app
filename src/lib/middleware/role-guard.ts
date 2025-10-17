// Role-based route protection middleware

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { prisma } from '@/lib/db/prisma';
import { ApiError, HttpStatus } from '@/lib/utils/error-handler';
import { UserRole } from '@/lib/utils/role-permissions';

export async function withRoleGuard(
    handler: (request: NextRequest, userId: string, userRole: UserRole) => Promise<NextResponse>,
    allowedRoles?: UserRole[]
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        try {
            // Get authorization header
            const authHeader = request.headers.get('authorization');

            if (!authHeader?.startsWith('Bearer ')) {
                return NextResponse.json(
                    { success: false, error: 'Unauthorized' },
                    { status: HttpStatus.UNAUTHORIZED }
                );
            }

            if (!adminAuth) {
                return NextResponse.json(
                    { success: false, error: 'Authentication service unavailable' },
                    { status: HttpStatus.SERVICE_UNAVAILABLE }
                );
            }

            // Verify Firebase token
            const token = authHeader.split('Bearer ')[1];
            const decodedToken = await adminAuth.verifyIdToken(token);

            // Get user from database
            const user = await prisma.user.findUnique({
                where: { id: decodedToken.uid },
                select: { id: true, role: true, isActive: true },
            });

            if (!user) {
                return NextResponse.json(
                    { success: false, error: 'User not found' },
                    { status: HttpStatus.NOT_FOUND }
                );
            }

            if (!user.isActive) {
                return NextResponse.json(
                    { success: false, error: 'Account has been deactivated' },
                    { status: HttpStatus.FORBIDDEN }
                );
            }

            // Check role permissions
            if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
                return NextResponse.json(
                    { success: false, error: 'Insufficient permissions' },
                    { status: HttpStatus.FORBIDDEN }
                );
            }

            // Call the handler with user info
            return await handler(request, user.id, user.role as UserRole);
        } catch (error) {
            // console.error('Role guard error:', error);
            // return NextResponse.json(
            //     { success: false, error: 'Authentication failed' },
            //     { status: HttpStatus.UNAUTHORIZED }
            // );
            // Firebase auth errors should return UNAUTHORIZED
            if (error instanceof Error && error.message.includes('auth')) {
                return NextResponse.json(
                    { success: false, error: 'Authentication failed' },
                    { status: HttpStatus.UNAUTHORIZED }
            );
            }

            // Other errors are server errors
            return NextResponse.json(
                { success: false, error: 'Internal server error' },
                { status: HttpStatus.INTERNAL_SERVER_ERROR }
            );
        }
    };
}

// Specific role guards
export const withAdminGuard = (
    handler: (request: NextRequest, userId: string, userRole: UserRole) => Promise<NextResponse>
) => withRoleGuard(handler, ['ADMIN']);

export const withAgentGuard = (
    handler: (request: NextRequest, userId: string, userRole: UserRole) => Promise<NextResponse>
) => withRoleGuard(handler, ['AGENT', 'ADMIN']);

export const withClientGuard = (
    handler: (request: NextRequest, userId: string, userRole: UserRole) => Promise<NextResponse>
) => withRoleGuard(handler, ['CLIENT']);

