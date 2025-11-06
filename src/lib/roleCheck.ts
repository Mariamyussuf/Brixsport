import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from '@/lib/auth';

// Core type definitions
export type UserRole = 'user' | 'logger' | 'senior-logger' | 'logger-admin' | 'admin' | 'super-admin';
export type AccessLevel = UserRole | 'all';

// Define endpoint access structure
type EndpointAccess = {
  path: string;
  method: string;
  roles: UserRole[];
};

// API endpoint access mapping
export const API_ACCESS_MAP: EndpointAccess[] = [
  // Competitions
  { path: '/competitions', method: 'GET', roles: ['user', 'logger', 'admin', 'super-admin'] },
  { path: '/competitions/:id', method: 'GET', roles: ['user', 'logger', 'admin', 'super-admin'] },
  { path: '/competitions', method: 'POST', roles: ['admin', 'super-admin'] },
  
  // Favorites
  { path: '/favorites', method: 'GET', roles: ['user'] },
  { path: '/favorites', method: 'POST', roles: ['user'] },
  { path: '/favorites', method: 'DELETE', roles: ['user'] },
  
  // Home
  { path: '/home', method: 'GET', roles: ['user'] },
  { path: '/home/matches/:sport', method: 'GET', roles: ['user', 'logger', 'admin', 'super-admin'] },
  
  // Live Updates
  { path: '/live/matches', method: 'GET', roles: ['user', 'logger', 'admin', 'super-admin'] },
  { path: '/live/matches/:id/score', method: 'PATCH', roles: ['logger', 'admin', 'super-admin'] },
  { path: '/live/events', method: 'POST', roles: ['logger', 'admin', 'super-admin'] },
  
  // Matches
  { path: '/matches', method: 'GET', roles: ['user', 'logger', 'admin', 'super-admin'] },
  { path: '/matches/:id', method: 'GET', roles: ['user', 'logger', 'admin', 'super-admin'] },
  { path: '/matches', method: 'POST', roles: ['logger', 'admin', 'super-admin'] },
  
  // Teams
  { path: '/teams', method: 'GET', roles: ['user', 'logger', 'admin', 'super-admin'] },
  { path: '/teams/:id', method: 'GET', roles: ['user', 'logger', 'admin', 'super-admin'] },
  { path: '/teams', method: 'POST', roles: ['admin', 'super-admin'] },
  
  // Track Events
  { path: '/track/fixtures', method: 'GET', roles: ['user', 'logger', 'admin', 'super-admin'] },
  { path: '/track/events', method: 'POST', roles: ['logger', 'admin', 'super-admin'] },
  { path: '/track/events/:id/status', method: 'PATCH', roles: ['logger', 'admin', 'super-admin'] },
  
  // Basketball Schedule
  { path: '/basketball-schedule', method: 'GET', roles: ['user', 'logger', 'admin', 'super-admin'] },
  { path: '/basketball-schedule', method: 'POST', roles: ['admin', 'super-admin'] },
  { path: '/basketball-schedule/update', method: 'PUT', roles: ['admin', 'super-admin'] },
  { path: '/basketball-schedule/update', method: 'PATCH', roles: ['admin', 'super-admin'] },
  
  // Admin specific endpoints
  { path: '/admin/loggers', method: 'GET', roles: ['admin', 'super-admin'] },
  { path: '/admin/loggers/:id', method: 'GET', roles: ['admin', 'super-admin'] },
  { path: '/admin/loggers', method: 'POST', roles: ['admin', 'super-admin'] },
  { path: '/admin/loggers/:id', method: 'PUT', roles: ['admin', 'super-admin'] },
  { path: '/admin/loggers/:id', method: 'DELETE', roles: ['admin', 'super-admin'] },
  { path: '/admin/loggers/:id/activate', method: 'POST', roles: ['admin', 'super-admin'] },
  { path: '/admin/loggers/:id/suspend', method: 'POST', roles: ['admin', 'super-admin'] },
  { path: '/admin/competitions', method: 'GET', roles: ['admin', 'super-admin'] },
  { path: '/admin/competitions/:id', method: 'GET', roles: ['admin', 'super-admin'] },
  { path: '/admin/competitions', method: 'POST', roles: ['admin', 'super-admin'] },
  { path: '/admin/competitions/:id', method: 'PUT', roles: ['admin', 'super-admin'] },
  { path: '/admin/competitions/:id', method: 'DELETE', roles: ['admin', 'super-admin'] },
  { path: '/admin/matches', method: 'GET', roles: ['admin', 'super-admin'] },
  { path: '/admin/matches/:id', method: 'GET', roles: ['admin', 'super-admin'] },
  { path: '/admin/matches', method: 'POST', roles: ['admin', 'super-admin'] },
  { path: '/admin/matches/:id', method: 'PUT', roles: ['admin', 'super-admin'] },
  { path: '/admin/matches/:id', method: 'DELETE', roles: ['admin', 'super-admin'] },
  { path: '/admin/reports', method: 'GET', roles: ['admin', 'super-admin'] },
  
  // Logger specific endpoints
  { path: '/logger/matches', method: 'GET', roles: ['logger', 'senior-logger', 'logger-admin', 'admin', 'super-admin'] },
  { path: '/logger/matches/:id', method: 'GET', roles: ['logger', 'senior-logger', 'logger-admin', 'admin', 'super-admin'] },
  { path: '/logger/matches', method: 'POST', roles: ['logger', 'senior-logger', 'logger-admin', 'admin', 'super-admin'] },
  { path: '/logger/matches/:id', method: 'PUT', roles: ['logger', 'senior-logger', 'logger-admin', 'admin', 'super-admin'] },
];

// Helper function to match URL patterns with parameters
function matchPath(pattern: string, path: string): boolean {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  if (patternParts.length !== pathParts.length) return false;

  return patternParts.every((part, i) => {
    if (part.startsWith(':')) return true; // Parameter matches anything
    return part === pathParts[i];
  });
}

// Core role check function
export function isAllowed(role: UserRole, allowedRoles: AccessLevel[]): boolean {
  if (allowedRoles.includes('all')) return true;
  
  return allowedRoles.includes(role) || 
         (role === 'admin' && allowedRoles.includes('logger')) || // Admin has logger privileges
         (role === 'super-admin' && (allowedRoles.includes('admin') || allowedRoles.includes('logger'))); // Super admin has all privileges
}

// Get user role from request
export async function getUserRole(request: NextRequest): Promise<UserRole | null> {
  const session = await getAuth(request);
  if (!session || !session.user || !session.user.role) return null;
  
  return session.user.role as UserRole;
}

// Check access for specific API endpoint
export function checkEndpointAccess(path: string, method: string, role: UserRole): boolean {
  const endpoint = API_ACCESS_MAP.find(e => 
    matchPath(e.path, path) && e.method === method
  );

  if (!endpoint) return false;
  return isAllowed(role, endpoint.roles);
}

// Generic role check middleware for any route
export function withRoleCheck(allowedRoles: AccessLevel[]) {
  return async function roleCheckMiddleware(request: NextRequest) {
    const userRole = await getUserRole(request);
    
    if (!userRole || !isAllowed(userRole, allowedRoles)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  };
}

// API-specific role check middleware
export async function withApiRoleCheck(request: NextRequest) {
  const userRole = await getUserRole(request);
  if (!userRole) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const path = request.nextUrl.pathname.replace('/api', '');
  const method = request.method;

  if (!checkEndpointAccess(path, method, userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.next();
}