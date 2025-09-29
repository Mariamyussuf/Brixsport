import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth';

export type UserRole = 'user' | 'logger' | 'admin';
type EndpointAccess = {
  path: string;
  method: string;
  roles: UserRole[];
};

// Define access levels for API endpoints
const API_ACCESS_MAP: EndpointAccess[] = [
  // Competitions
  { path: '/competitions', method: 'GET', roles: ['user', 'logger', 'admin'] },
  { path: '/competitions/:id', method: 'GET', roles: ['user', 'logger', 'admin'] },
  { path: '/competitions', method: 'POST', roles: ['admin'] },
  
  // Favorites
  { path: '/favorites', method: 'GET', roles: ['user'] },
  { path: '/favorites', method: 'POST', roles: ['user'] },
  { path: '/favorites', method: 'DELETE', roles: ['user'] },
  
  // Home
  { path: '/home', method: 'GET', roles: ['user'] },
  { path: '/home/matches/:sport', method: 'GET', roles: ['user', 'logger', 'admin'] },
  
  // Live Updates
  { path: '/live/matches', method: 'GET', roles: ['user', 'logger', 'admin'] },
  { path: '/live/matches/:id/score', method: 'PATCH', roles: ['logger', 'admin'] },
  { path: '/live/events', method: 'POST', roles: ['logger', 'admin'] },
  
  // Matches
  { path: '/matches', method: 'GET', roles: ['user', 'logger', 'admin'] },
  { path: '/matches/:id', method: 'GET', roles: ['user', 'logger', 'admin'] },
  { path: '/matches', method: 'POST', roles: ['logger', 'admin'] },
  
  // Teams
  { path: '/teams', method: 'GET', roles: ['user', 'logger', 'admin'] },
  { path: '/teams/:id', method: 'GET', roles: ['user', 'logger', 'admin'] },
  { path: '/teams', method: 'POST', roles: ['admin'] },
  
  // Track Events
  { path: '/track/fixtures', method: 'GET', roles: ['user', 'logger', 'admin'] },
  { path: '/track/events', method: 'POST', roles: ['logger', 'admin'] },
  { path: '/track/events/:id/status', method: 'PATCH', roles: ['logger', 'admin'] },
];

function matchPath(pattern: string, path: string): boolean {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  
  if (patternParts.length !== pathParts.length) return false;
  
  return patternParts.every((part, i) => {
    if (part.startsWith(':')) return true;
    return part === pathParts[i];
  });
}

function getEndpointAccess(path: string, method: string): EndpointAccess | undefined {
  return API_ACCESS_MAP.find(endpoint => 
    matchPath(endpoint.path, path) && endpoint.method === method
  );
}

export async function withRoleCheck(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/^\/api/, '');
  const method = request.method;
  
  const endpointAccess = getEndpointAccess(path, method);
  if (!endpointAccess) {
    return NextResponse.json(
      { success: false, error: { message: 'Endpoint not found' } },
      { status: 404 }
    );
  }

  // Get auth session using existing auth system
  const session = await getAuth(request);
  if (!session?.user?.role || !endpointAccess.roles.includes(session.user.role as UserRole)) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized' } },
      { status: 403 }
    );
  }

  return NextResponse.next();
}