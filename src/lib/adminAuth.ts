// Admin auth helpers (minimal stubs) used by server routes and the admin context.
// This module intentionally uses the canonical `AdminUser` type from `src/types/admin.ts`.
// Replace these stubs with real implementations that validate tokens and return real users.

// Re-export the canonical AdminUser type so callers that import it from
// `@/lib/adminAuth` continue to work.
export type { AdminUser } from '@/types/admin';
import type { AdminUser as _AdminUser } from '@/types/admin';
import { API_BASE_URL } from '@/lib/apiConfig';

// Helper function to make API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export interface AdminAuthAPIType {
  login: (email: string, password: string) => Promise<{ success: boolean; user?: _AdminUser; error?: string }>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<_AdminUser | null>;
}

export const AdminAuthAPI: AdminAuthAPIType = {
  async login(email: string, password: string) {
    try {
      const response = await apiCall('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Check if user has admin role
        if (user.role !== 'admin' && user.role !== 'super-admin') {
          return { success: false, error: 'User does not have admin permissions' };
        }
        
        // Store token in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', token);
        }
        
        // Create proper admin user object
        const adminUser: _AdminUser = {
          id: user.id,
          name: user.name || 'Admin User',
          email: user.email,
          role: user.role,
          adminLevel: user.role === 'super-admin' ? 'super' : 'basic',
          permissions: user.permissions || []
        };
        
        return { success: true, user: adminUser };
      }
      
      return { success: false, error: response.error?.message || 'Login failed' };
    } catch (error: any) {
      console.error('Admin login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  },
  async logout() {
    try {
      // Call logout endpoint
      await apiCall('/v1/auth/logout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Admin logout error:', error);
    } finally {
      // Always clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
      }
    }
  },
  async getCurrentUser() {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      
      if (!token) {
        return null;
      }
      
      // Decode token to get user info (simplified - in a real app you'd verify with the server)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Create admin user object
      const user: _AdminUser = {
        id: payload.userId,
        name: payload.name || 'Admin User',
        email: payload.email,
        role: payload.role,
        adminLevel: payload.role === 'super-admin' ? 'super' : 'basic',
        permissions: []
      };
      
      // Check if user still has admin role
      if (user.role !== 'admin' && user.role !== 'super-admin') {
        // Clear token if user no longer has admin permissions
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token');
        }
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
      }
      return null;
    }
  }
};

export default AdminAuthAPI;

// Verify an admin token from a request — checks if token is valid and user has admin permissions
export async function verifyAdminToken(request: Request | any): Promise<_AdminUser | null> {
  try {
    // Extract token from headers
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) {
      return null;
    }
    
    // In a real implementation, we would verify the token with the auth service
    // For now, we'll decode it to get user info
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Create admin user object
    const user: _AdminUser = {
      id: payload.userId,
      name: payload.name || 'Admin User',
      email: payload.email,
      role: payload.role,
      adminLevel: payload.role === 'super-admin' ? 'super' : 'basic',
      permissions: []
    };
    
    // Check if user has admin permissions
    if (user.role !== 'admin' && user.role !== 'super-admin') {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Verify admin token error:', error);
    return null;
  }
}

export function hasAdminPermission(user: _AdminUser | null, permission?: string): boolean {
  if (!user) return false;
  if (!permission) return user.role === 'admin' || user.role === 'super-admin' || user.adminLevel === 'super';
  return !!user.permissions?.includes(permission) || user.role === 'super-admin' || user.adminLevel === 'super';
}

export function canManageLogger(user: _AdminUser | null, loggerId?: string): boolean {
  if (!user) return false;
  // Allow super admins to manage all loggers. For regular admins, optionally check logger membership.
  if (user.adminLevel === 'super' || user.role === 'super-admin') return true;
  // Placeholder: you can extend this to check assigned logger ids in the user shape.
  return false;
}