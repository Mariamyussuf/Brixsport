import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Role types
export type UserRole = 'user' | 'logger' | 'admin';

// Access level types that match our API requirements
export type AccessLevel = {
  path: string;
  method: string;
  roles: UserRole[];
};

// Define access levels for all API endpoints
export const ACCESS_LEVELS: AccessLevel[] = [
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

// Helper to match path patterns with URL
function matchPathPattern(pattern: string, path: string): boolean {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  
  if (patternParts.length !== pathParts.length) return false;
  
  return patternParts.every((part, i) => {
    if (part.startsWith(':')) return true; // Match any value for parameters
    return part === pathParts[i];
  });
}

// Helper to get access level for a request
function getAccessLevel(request: NextRequest): AccessLevel | undefined {
  const path = request.nextUrl.pathname.replace(/^\/api/, '');
  const method = request.method;
  
  return ACCESS_LEVELS.find(level => 
    matchPathPattern(level.path, path) && level.method === method
  );
}

// Helper to get user role from request
function getUserRole(request: NextRequest): UserRole | null {
  // Get auth token from request headers or cookies
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split(' ')[1] : null;
  
  // For demo purposes, we're checking tokens directly
  // In production, you should verify the JWT token and extract the role
  if (token) {
    if (token.startsWith('admin_')) return 'admin';
    if (token.startsWith('logger_')) return 'logger';
    if (token.startsWith('user_')) return 'user';
  }

  return null;
}

// Main middleware function
export function withRoleCheck(
  request: NextRequest
) {
  const accessLevel = getAccessLevel(request);
  if (!accessLevel) {
    return NextResponse.json(
      { error: 'Route not found' },
      { status: 404 }
    );
  }

  const userRole = getUserRole(request);
  if (!userRole || !accessLevel.roles.includes(userRole)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  // Role check passed, continue to the API route handler
  return NextResponse.next();
}