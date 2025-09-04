import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get('host');
  
  console.log(`[Middleware] Running for path: ${pathname} on host: ${host}`);

  // Handle domain-based routing
  if (host === 'logger.brixsports.com') {
    // Route logger subdomain requests
    console.log(`[Middleware] Routing logger request: ${pathname}`);
    
    // If the request is not for the logger section, redirect to logger
    if (!pathname.startsWith('/logger')) {
      // But allow API routes and static assets
      if (!pathname.startsWith('/api') && !pathname.startsWith('/_next') && pathname !== '/favicon.ico') {
        return NextResponse.redirect(new URL(`/logger${pathname === '/' ? '' : pathname}`, request.url));
      }
    }
    
    return NextResponse.next();
  } else if (host === 'brixsports.com' || host === 'www.brixsports.com' || host?.endsWith('vercel.app')) {
    // Route main domain requests
    console.log(`[Middleware] Routing main site request: ${pathname}`);
    
    // Prevent access to logger routes from main domain
    if (pathname.startsWith('/logger')) {
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

    // Handle profile route - make sure it's accessible
    if (pathname === '/profile') {
      // For simplicity, we're not checking auth token here
      // Just ensuring the route is properly handled
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

export const config = {
  matcher: ['/((?!_next|api|static|favicon.ico).*)'],
}