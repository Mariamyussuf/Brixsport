import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/adminAuthService';
import type { AdminUser, AdminPermission } from '@/types/admin';

/**
 * Admin Authentication Middleware
 * Verifies JWT tokens and extracts admin information
 */
export async function authenticateAdmin(req: Request): Promise<{
  authenticated: boolean;
  admin?: AdminUser;
  error?: string;
}> {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        authenticated: false,
        error: 'No authentication token provided',
      };
    }
    
    const token = authHeader.substring(7);
    const payload = await adminAuthService.verifyToken(token);
    
    if (!payload || !payload.id) {
      return {
        authenticated: false,
        error: 'Invalid or expired token',
      };
    }
    
    // Construct admin user from payload
    const admin: AdminUser = {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as 'admin' | 'super-admin',
      adminLevel: payload.adminLevel as 'basic' | 'super',
      permissions: payload.permissions as string[],
    };
    
    return {
      authenticated: true,
      admin,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Check if admin has specific permission
 */
export function hasPermission(admin: AdminUser, permission: AdminPermission): boolean {
  // Super admin has all permissions
  if (admin.permissions.includes('*')) {
    return true;
  }
  
  return admin.permissions.includes(permission);
}

/**
 * Check if admin has any of the specified permissions
 */
export function hasAnyPermission(admin: AdminUser, permissions: AdminPermission[]): boolean {
  if (admin.permissions.includes('*')) {
    return true;
  }
  
  return permissions.some(permission => admin.permissions.includes(permission));
}

/**
 * Check if admin has all of the specified permissions
 */
export function hasAllPermissions(admin: AdminUser, permissions: AdminPermission[]): boolean {
  if (admin.permissions.includes('*')) {
    return true;
  }
  
  return permissions.every(permission => admin.permissions.includes(permission));
}

/**
 * Middleware factory for permission-based route protection
 */
export function requirePermissions(permissions: AdminPermission[]) {
  return async (req: Request) => {
    const authResult = await authenticateAdmin(req);
    
    if (!authResult.authenticated || !authResult.admin) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (!hasAnyPermission(authResult.admin, permissions)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    return null; // Continue to route handler
  };
}

/**
 * Middleware to require super admin access
 */
export async function requireSuperAdmin(req: Request) {
  const authResult = await authenticateAdmin(req);
  
  if (!authResult.authenticated || !authResult.admin) {
    return NextResponse.json(
      { success: false, error: authResult.error || 'Unauthorized' },
      { status: 401 }
    );
  }
  
  if (authResult.admin.role !== 'super-admin' && authResult.admin.adminLevel !== 'super') {
    return NextResponse.json(
      { success: false, error: 'Super admin access required' },
      { status: 403 }
    );
  }
  
  return null; // Continue to route handler
}

/**
 * Helper to add admin to request
 * Note: This is a workaround since Next.js doesn't allow modifying Request object
 * In actual usage, you'll call authenticateAdmin in each route and use the returned admin
 */
export interface AuthenticatedRequest extends Request {
  admin?: AdminUser;
}
