// Admin Authentication Utilities
// Specialized authentication functions for the admin system

import { jwtVerify, SignJWT } from 'jose';
import { User } from './auth';

// Secret key for JWT verification - in production, use environment variables
const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'admin_secret_key_for_development'
);

// Admin-specific user roles
export type AdminRole = 'admin' | 'super-admin';

// Extended user interface for admins
export interface AdminUser extends User {
  role: AdminRole;
  managedLoggers: string[];
  adminLevel: 'basic' | 'super';
  permissions: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Generate a JWT token for an admin user
 * @param user - The admin user object
 * @returns Promise<string> - The JWT token
 */
export async function generateAdminToken(user: AdminUser): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60; // 1 hour expiration

  return new SignJWT({ 
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    managedLoggers: user.managedLoggers,
    adminLevel: user.adminLevel,
    permissions: user.permissions
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(JWT_SECRET);
}

/**
 * Verify an admin JWT token
 * @param token - The JWT token to verify
 * @returns Promise<AdminUser | null> - The verified user or null if invalid
 */
export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Check if this is an admin user
    const role = payload.role as string;
    if (!role || (role !== 'admin' && role !== 'super-admin')) {
      return null;
    }
    
    const user: AdminUser = {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: role as AdminRole,
      managedLoggers: (payload.managedLoggers as string[]) || [],
      adminLevel: payload.adminLevel as 'basic' | 'super',
      permissions: (payload.permissions as string[]) || []
    };
    
    return user;
  } catch (error) {
    console.error('Admin token verification error:', error);
    return null;
  }
}

/**
 * Check if an admin user has specific permissions
 * @param user - The admin user
 * @param permission - The permission to check
 * @returns boolean - Whether the admin has the permission
 */
export function hasAdminPermission(user: AdminUser, permission: string): boolean {
  // Super admins have all permissions
  if (user.adminLevel === 'super') {
    return true;
  }
  
  // Check for wildcard permission
  if (user.permissions.includes('*')) {
    return true;
  }
  
  return user.permissions.includes(permission);
}

/**
 * Check if an admin can manage a specific logger
 * @param admin - The admin user
 * @param loggerId - The logger ID to check
 * @returns boolean - Whether the admin can manage the logger
 */
export function canManageLogger(admin: AdminUser, loggerId: string): boolean {
  // Super admins can manage all loggers
  if (admin.adminLevel === 'super') {
    return true;
  }
  
  // Check if the logger is in the admin's managed loggers list
  return admin.managedLoggers.includes(loggerId);
}

/**
 * Admin rate limiting configuration
 */
export interface AdminRateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutDurationMs: number;
}

/**
 * Default rate limiting for admins (less strict than loggers)
 */
export const DEFAULT_ADMIN_RATE_LIMIT: AdminRateLimitConfig = {
  maxAttempts: 10, // 10 attempts
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockoutDurationMs: 30 * 60 * 1000 // 30 minute lockout
};

// Admin API functions
export const AdminAuthAPI = {
  /**
   * Login as an admin
   * @param email - Admin email
   * @param password - Admin password
   * @returns Promise with login result
   */
  login: async (email: string, password: string): Promise<{ success: boolean; data?: AdminUser; token?: string; error?: string }> => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Admin login error:', error);
      return { 
        success: false, 
        error: 'Login failed' 
      };
    }
  },
  
  /**
   * Logout as an admin
   * @returns Promise with logout result
   */
  logout: async (): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Admin logout error:', error);
      return { 
        success: false, 
        error: 'Logout failed' 
      };
    }
  },
  
  /**
   * Get current admin profile
   * @returns Promise with admin profile
   */
  getProfile: async (): Promise<{ success: boolean; data?: AdminUser; error?: string }> => {
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Get admin profile error:', error);
      return { 
        success: false, 
        error: 'Failed to fetch profile' 
      };
    }
  },
  
  /**
   * Update admin profile
   * @param updates - Profile updates
   * @returns Promise with updated profile
   */
  updateProfile: async (updates: Partial<AdminUser>): Promise<{ success: boolean; data?: AdminUser; error?: string }> => {
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Update admin profile error:', error);
      return { 
        success: false, 
        error: 'Failed to update profile' 
      };
    }
  }
};

export default {
  generateAdminToken,
  verifyAdminToken,
  hasAdminPermission,
  canManageLogger,
  DEFAULT_ADMIN_RATE_LIMIT,
  AdminAuthAPI
};