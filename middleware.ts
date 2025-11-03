import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_req: NextRequest) {
  // Allow-through middleware. Add auth/redirect logic later if needed.
  return NextResponse.next();
}

// Exclude public and framework assets from any middleware logic
export const config = {
  matcher: [
    // Run on everything except these paths
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|images/|robots.txt|sitemap.xml|opengraph-image|icon|apple-icon|api/public|login).*)',
  ],
};
