import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get pathname
  const pathname = request.nextUrl.pathname;

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

  return NextResponse.next();
}

export const config = {
  matcher: '/auth',
}
