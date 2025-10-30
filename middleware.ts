import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withApiRoleCheck } from './src/lib/roleCheck';
import { getAuth } from './src/lib/auth';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get('host');
  const referer = request.headers.get('referer');

  // API role-based access control
  if (pathname.startsWith('/api')) {
    return withApiRoleCheck(request);
  }

  // Handle unified admin/logger routing on main domain
  if (host === 'brixsports.com' || host === 'www.brixsports.com' || host?.endsWith('vercel.app') || host === 'brixsport.vercel.app' || host?.startsWith('localhost')) {
    // Route main domain requests (including localhost for development)
    console.log(`[Middleware] Routing main site request: ${pathname}`);

    // Handle /auth route
    if (pathname === '/auth') {
      const searchParams = request.nextUrl.searchParams;
      const tab = searchParams.get('tab');

      // Redirect to appropriate auth page
      if (tab === 'login' || tab === 'signup') {
        return NextResponse.redirect(new URL(`/auth/${tab}`, request.url));
      }

      // Default to signup if no tab specified
      return NextResponse.redirect(new URL('/auth/signup', request.url));
    }

    // Handle profile route - REQUIRE AUTHENTICATION
    if (pathname === '/profile') {
      // Implement proper server-side authentication check
      const session = await getAuth(request);
      
      if (!session || !session.user) {
        // Redirect unauthenticated users to login page
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // User is authenticated, allow access
      return NextResponse.next();
    }

    // Handle root route - check if user needs onboarding
    if (pathname === '/') {
      // We'll let the client-side handle redirection based on auth status and onboarding completion
      return NextResponse.next();
    }

    // Allow access to login page
    if (pathname === '/login' || pathname.startsWith('/auth/login')) {
      return NextResponse.next();
    }

    // Allow access to admin and logger routes - role-based access will be handled client-side
    if (pathname.startsWith('/admin') || pathname.startsWith('/logger')) {
      return NextResponse.next();
    }

    return NextResponse.next();
  }

  // Default routing for other cases
  return NextResponse.next();
}

// Enhanced middleware config with more specific matching
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}