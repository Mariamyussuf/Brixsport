// Logger API Middleware
// Specialized middleware for logger API routes

import { NextRequest } from 'next/server';
import { withLoggerRoleCheck } from './loggerMiddleware';

/**
 * Logger API middleware function
 * @param request - The incoming request
 * @returns Promise<Response> - The response or null if no action is needed
 */
export async function loggerApiMiddleware(request: NextRequest) {
  // Only apply to logger API routes
  if (request.nextUrl.pathname.startsWith('/api/logger') || 
      request.nextUrl.pathname.startsWith('/api/admin/loggers')) {
    return await withLoggerRoleCheck(request);
  }
  
  // For all other routes, continue without interference
  return null;
}

export default loggerApiMiddleware;