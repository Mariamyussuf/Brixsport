// Admin auth helpers (minimal stubs) used by server routes and the admin context.
// This module intentionally uses the canonical `AdminUser` type from `src/types/admin.ts`.
// Replace these stubs with real implementations that validate tokens and return real users.

// Re-export the canonical AdminUser type so callers that import it from
// `@/lib/adminAuth` continue to work.
export type { AdminUser } from '@/types/admin';
import type { AdminUser as _AdminUser } from '@/types/admin';

export interface AdminAuthAPIType {
  login: (email: string, password: string) => Promise<{ success: boolean; user?: _AdminUser; error?: string }>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<_AdminUser | null>;
}

export const AdminAuthAPI: AdminAuthAPIType = {
  async login(email: string, password: string) {
    // TODO: wire to real API
    if (email && password) {
      const user: _AdminUser = { id: 'admin-1', name: 'Admin', email, role: 'admin', adminLevel: 'basic', permissions: [] };
      return { success: true, user };
    }
    return { success: false, error: 'Invalid credentials' };
  },
  async logout() {
    return Promise.resolve();
  },
  async getCurrentUser() {
    return Promise.resolve(null);
  }
};

export default AdminAuthAPI;

// Verify an admin token from a request — stubbed to always return null.
export async function verifyAdminToken(request: Request | any): Promise<_AdminUser | null> {
  // In a real implementation, extract token from headers/cookies and verify it.
  return null;
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
