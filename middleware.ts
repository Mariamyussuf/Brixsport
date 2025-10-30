import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withApiRoleCheck } from './src/lib/roleCheck';
import { getAuth } from './src/lib/auth';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get('host');
  const referer = request.headers.get('referer');

  // API role-based access control
  if (pathname.startsWith('/api')) {
    return withApiRoleCheck(request);
  }

  // Handle admin/logger subdomain routing
  if (host === 'admin.brixsports.com' || host === 'admin.brixsport.vercel.app' ||
      (host?.startsWith('localhost') && pathname.startsWith('/admin'))) {
    // Route admin/logger subdomain requests
    console.log(`[Middleware] Routing admin/logger request: ${pathname}`);

    // Specific handling for admin routes
    if (pathname === '/admin/login') {
      // Don't redirect /admin/login - this is the login page
      return NextResponse.next();
    } else if (pathname === '/admin') {
      // Redirect /admin to /admin/login
      return NextResponse.redirect(new URL('/admin/login', request.url));
    } else if (!pathname.startsWith('/admin')) {
      // If the request is not for the admin section, redirect to admin
      // But allow API routes and static assets
      if (!pathname.startsWith('/api') && !pathname.startsWith('/_next') && pathname !== '/favicon.ico') {
        return NextResponse.redirect(new URL(`/admin${pathname === '/' ? '' : pathname}`, request.url));
      }
    }

    return NextResponse.next();
  } else if (host === 'brixsports.com' || host === 'www.brixsports.com' || host?.endsWith('vercel.app') || host === 'brixsport.vercel.app' || host?.startsWith('localhost')) {
    // Route main domain requests (including localhost for development)
    console.log(`[Middleware] Routing main site request: ${pathname}`);

    // Prevent admin routes on main domain, but allow logger routes
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

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
      // For now, we'll let the client-side handle authentication
      // TODO: Implement proper server-side authentication check
      // This is a temporary solution - authentication should be enforced server-side
      return NextResponse.next();
    }

    // Handle root route - check if user needs onboarding
    if (pathname === '/') {
      // We'll let the client-side handle redirection based on auth status and onboarding completion
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