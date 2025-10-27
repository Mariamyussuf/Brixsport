// Logger Middleware
// Separate middleware for logger API routes

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getLoggerAuth } from '@/lib/loggerAuthService';

// Define logger role types
export type LoggerRole = 'logger' | 'senior-logger' | 'logger-admin';

// Define endpoint access structure for logger routes
type LoggerEndpointAccess = {
  path: string;
  method: string;
  roles: LoggerRole[];
};

// Define access levels for logger API endpoints
const LOGGER_API_ACCESS_MAP: LoggerEndpointAccess[] = [
  // Logger matches
  { path: '/logger/matches', method: 'GET', roles: ['logger', 'senior-logger', 'logger-admin'] },
  { path: '/logger/matches/:id', method: 'GET', roles: ['logger', 'senior-logger', 'logger-admin'] },
  { path: '/logger/matches', method: 'POST', roles: ['senior-logger', 'logger-admin'] },
  { path: '/logger/matches/:id', method: 'PUT', roles: ['senior-logger', 'logger-admin'] },
  { path: '/logger/matches/:id', method: 'DELETE', roles: ['logger-admin'] },
  
  // Logger events
  { path: '/logger/matches/:id/events', method: 'POST', roles: ['logger', 'senior-logger', 'logger-admin'] },
  { path: '/logger/matches/:id/events/:eventId', method: 'PUT', roles: ['senior-logger', 'logger-admin'] },
  { path: '/logger/matches/:id/events/:eventId', method: 'DELETE', roles: ['logger-admin'] },
  
  // Logger competitions
  { path: '/logger/competitions', method: 'GET', roles: ['logger', 'senior-logger', 'logger-admin'] },
  { path: '/logger/competitions/:id', method: 'GET', roles: ['logger', 'senior-logger', 'logger-admin'] },
  
  // Logger teams
  { path: '/logger/teams', method: 'GET', roles: ['logger', 'senior-logger', 'logger-admin'] },
  { path: '/logger/teams/:id', method: 'GET', roles: ['logger', 'senior-logger', 'logger-admin'] },
  
  // Logger players
  { path: '/logger/players', method: 'GET', roles: ['logger', 'senior-logger', 'logger-admin'] },
  { path: '/logger/players/:id', method: 'GET', roles: ['logger', 'senior-logger', 'logger-admin'] },
  
  // Logger reports
  { path: '/logger/reports', method: 'GET', roles: ['logger', 'senior-logger', 'logger-admin'] },
  { path: '/logger/reports/:id', method: 'POST', roles: ['logger', 'senior-logger', 'logger-admin'] },
  
  // Admin specific endpoints
  { path: '/admin/loggers', method: 'GET', roles: ['logger-admin'] },
  { path: '/admin/loggers/:id', method: 'GET', roles: ['logger-admin'] },
  { path: '/admin/loggers', method: 'POST', roles: ['logger-admin'] },
  { path: '/admin/loggers/:id', method: 'PUT', roles: ['logger-admin'] },
  { path: '/admin/loggers/:id', method: 'DELETE', roles: ['logger-admin'] },
  { path: '/admin/loggers/:id/activate', method: 'POST', roles: ['logger-admin'] },
  { path: '/admin/loggers/:id/suspend', method: 'POST', roles: ['logger-admin'] },
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

// Core role check function for logger roles
export function isLoggerAllowed(role: LoggerRole, allowedRoles: LoggerRole[]): boolean {
  return allowedRoles.includes(role) || 
         (role === 'logger-admin' && (allowedRoles.includes('senior-logger') || allowedRoles.includes('logger'))); // Admin has all privileges
}

// Get logger role from request
export async function getLoggerRole(request: NextRequest): Promise<LoggerRole | null> {
  const session = await getLoggerAuth(request);
  if (!session || !session.user || !session.user.role) return null;
  
  return session.user.role as LoggerRole;
}

// Check access for specific logger API endpoint
export function checkLoggerEndpointAccess(path: string, method: string, role: LoggerRole): boolean {
  const endpoint = LOGGER_API_ACCESS_MAP.find(e => 
    matchPath(e.path, path) && e.method === method
  );

  if (!endpoint) return false;
  return isLoggerAllowed(role, endpoint.roles);
}

// Logger-specific role check middleware
export async function withLoggerRoleCheck(request: NextRequest) {
  const loggerRole = await getLoggerRole(request);
  if (!loggerRole) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only check access for /api/logger routes
  if (request.nextUrl.pathname.startsWith('/api/logger') || 
      request.nextUrl.pathname.startsWith('/api/admin')) {
    const path = request.nextUrl.pathname.replace('/api', '');
    const method = request.method;

    if (!checkLoggerEndpointAccess(path, method, loggerRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export default withLoggerRoleCheck;