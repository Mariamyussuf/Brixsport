import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log(`[Middleware] Running for path: ${pathname}`);

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

  return NextResponse.next();
}

export const config = {
  matcher: ['/auth', '/profile'],
}
