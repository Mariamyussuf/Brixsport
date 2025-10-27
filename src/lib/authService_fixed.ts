import { jwtVerify, SignJWT } from 'jose';

// Secret keys for JWT verification - in production, use environment variables
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default_secret_key_for_development'
);

const LOGGER_JWT_SECRET = new TextEncoder().encode(
  process.env.LOGGER_JWT_SECRET || process.env.JWT_SECRET || 'logger_secret_key_for_development'
);

// Define clear role types
export type UserRole = 'user' | 'logger' | 'admin' | 'super-admin';

// Extended user interface for different user types
export interface UnifiedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  // Logger-specific fields
  assignedCompetitions?: string[];
  permissions?: string[];
  lastLogin?: string;
  sessionTimeout?: number;
}

// Session management interface
export interface SessionConfig {
  timeout: number; // in minutes
  warnBefore: number; // warn user before timeout in minutes
  autoRefresh: boolean;
}

/**
 * Generate a unified JWT token based on user role
 * @param user - The user object
 * @returns Promise<string> - The JWT token
 */
export async function generateUnifiedToken(user: UnifiedUser): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60; // 1 hour expiration

  return new SignJWT({ 
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    assignedCompetitions: user.assignedCompetitions,
    permissions: user.permissions,
    lastLogin: user.lastLogin,
    sessionTimeout: user.sessionTimeout
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(user.role === 'logger' ? LOGGER_JWT_SECRET : JWT_SECRET);
}

/**
 * Verify a unified JWT token
 * @param token - The JWT token to verify
 * @returns Promise<UnifiedUser | null> - The verified user or null if invalid
 */
export async function verifyUnifiedToken(token: string): Promise<UnifiedUser | null> {
  try {
    // Try verifying with logger secret first for logger users
    if (token) {
      try {
        const { payload } = await jwtVerify(token, LOGGER_JWT_SECRET);
        
        // Check if this is a logger user
        const role = payload.role as string;
        if (role && role === 'logger') {
          const user: UnifiedUser = {
            id: payload.id as string,
            name: payload.name as string,
            email: payload.email as string,
            role: 'logger',
            assignedCompetitions: payload.assignedCompetitions as string[] | undefined,
            permissions: payload.permissions as string[] | undefined,
            lastLogin: payload.lastLogin as string | undefined,
            sessionTimeout: payload.sessionTimeout as number | undefined
          };
          
          return user;
        }
      } catch (loggerError) {
        // Logger verification failed, continue to general verification
      }
    }
    
    // Try verifying with general secret
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Validate role is one of our defined roles
    const role = payload.role as string;
    if (!['user', 'admin', 'super-admin'].includes(role)) {
      return null; // Invalid role
    }
    
    const user: UnifiedUser = {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: role as UserRole,
      assignedCompetitions: payload.assignedCompetitions as string[] | undefined,
      permissions: payload.permissions as string[] | undefined,
      lastLogin: payload.lastLogin as string | undefined,
      sessionTimeout: payload.sessionTimeout as number | undefined
    };
    
    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Check if a user has specific permissions
 * @param user - The user
 * @param permission - The permission to check
 * @returns boolean - Whether the user has the permission
 */
export function hasPermission(user: UnifiedUser, permission: string): boolean {
  // Super admins have all permissions
  if (user.role === 'super-admin') {
    return true;
  }
  
  // Admins have most permissions
  if (user.role === 'admin') {
    // Define admin permissions
    const adminPermissions = [
      'manage_users',
      'manage_loggers',
      'view_reports',
      'manage_system'
    ];
    return adminPermissions.includes(permission);
  }
  
  // Loggers have logger-specific permissions
  if (user.role === 'logger') {
    // Define logger permissions
    const loggerPermissions = [
      'log_matches',
      'log_events',
      'view_assigned_competitions'
    ];
    return user.permissions ? 
      user.permissions.includes(permission) && loggerPermissions.includes(permission) : 
      loggerPermissions.includes(permission);
  }
  
  // Regular users have basic permissions
  if (user.role === 'user') {
    const userPermissions = [
      'view_matches',
      'view_competitions',
      'add_favorites'
    ];
    return userPermissions.includes(permission);
  }
  
  return false;
}

/**
 * Check if a user can access a specific competition
 * @param user - The user
 * @param competitionId - The competition ID to check
 * @returns boolean - Whether the user can access the competition
 */
export function canAccessCompetition(user: UnifiedUser, competitionId: string): boolean {
  // Super admins can access all competitions
  if (user.role === 'super-admin') {
    return true;
  }
  
  // Admins can access all competitions
  if (user.role === 'admin') {
    return true;
  }
  
  // Loggers can access only their assigned competitions
  if (user.role === 'logger') {
    if (user.assignedCompetitions && user.assignedCompetitions.length > 0) {
      return user.assignedCompetitions.includes(competitionId);
    }
    // If no specific competitions are assigned, deny access
    return false;
  }
  
  // Regular users can view competitions (but not log events)
  if (user.role === 'user') {
    return true;
  }
  
  return false;
}

/**
 * Get authentication middleware for API routes
 * @returns Function that can be used as middleware
 */
export function getAuthMiddleware() {
  return async function authMiddleware(request: Request) {
    try {
      // First, try to get the token from the Authorization header
      const authHeader = request.headers.get('authorization');
      
      if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (token) {
          // Verify the JWT token
          const user = await verifyUnifiedToken(token);
          
          if (user) {
            return user;
          }
        }
      }
      
      // If no authorization header, check for a session cookie
      // Note: This would require additional implementation for cookie parsing
      
      return null;
    } catch (error) {
      // If verification fails, return null
      console.error('Authentication error:', error);
      return null;
    }
  };
}

// Role-based access control helpers
export const RBAC = {
  // Check if user is a regular user
  isUser: (user: UnifiedUser | null): boolean => {
    return user !== null && user.role === 'user';
  },
  
  // Check if user is a logger
  isLogger: (user: UnifiedUser | null): boolean => {
    return user !== null && user.role === 'logger';
  },
  
  // Check if user is an admin
  isAdmin: (user: UnifiedUser | null): boolean => {
    return user !== null && user.role === 'admin';
  },
  
  // Check if user is a super admin
  isSuperAdmin: (user: UnifiedUser | null): boolean => {
    return user !== null && user.role === 'super-admin';
  },
  
  // Check if user has admin privileges (admin or super-admin)
  hasAdminPrivileges: (user: UnifiedUser | null): boolean => {
    return user !== null && (user.role === 'admin' || user.role === 'super-admin');
  },
  
  // Check if user can manage loggers
  canManageLoggers: (user: UnifiedUser | null): boolean => {
    return user !== null && (user.role === 'admin' || user.role === 'super-admin');
  },
  
  // Check if user can log match events
  canLogEvents: (user: UnifiedUser | null): boolean => {
    return user !== null && (user.role === 'logger' || user.role === 'admin' || user.role === 'super-admin');
  }
};

export default {
  generateUnifiedToken,
  verifyUnifiedToken,
  hasPermission,
  canAccessCompetition,
  getAuthMiddleware,
  RBAC
};