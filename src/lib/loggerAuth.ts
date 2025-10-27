// Logger Authentication Utilities
// Specialized authentication functions for the logger system

import { UnifiedUser, generateUnifiedToken, verifyUnifiedToken, hasPermission, canAccessCompetition, RBAC } from './authService';

// Logger-specific user roles
export type LoggerRole = 'logger';

// Extended user interface for loggers (now using UnifiedUser)
export interface LoggerUser extends UnifiedUser {
  role: LoggerRole;
  assignedCompetitions?: string[];
  permissions?: string[];
  lastLogin?: string;
  sessionTimeout?: number; // Session timeout in minutes
}

// Session management interface
export interface SessionConfig {
  timeout: number; // in minutes
  warnBefore: number; // warn user before timeout in minutes
  autoRefresh: boolean;
}

/**
 * Generate a JWT token for a logger user
 * @param user - The logger user object
 * @returns Promise<string> - The JWT token
 */
export async function generateLoggerToken(user: LoggerUser): Promise<string> {
  return generateUnifiedToken(user);
}

/**
 * Verify a logger JWT token
 * @param token - The JWT token to verify
 * @returns Promise<LoggerUser | null> - The verified user or null if invalid
 */
export async function verifyLoggerToken(token: string): Promise<LoggerUser | null> {
  const user = await verifyUnifiedToken(token);
  
  if (user && user.role === 'logger') {
    return user as LoggerUser;
  }
  
  return null;
}

/**
 * Check if a user has specific logger permissions
 * @param user - The logger user
 * @param permission - The permission to check
 * @returns boolean - Whether the user has the permission
 */
export function hasLoggerPermission(user: UnifiedUser, permission: string): boolean {
  return hasPermission(user, permission);
}

/**
 * Check if a logger can access a specific competition
 * @param user - The logger user
 * @param competitionId - The competition ID to check
 * @returns boolean - Whether the logger can access the competition
 */
export function canAccessCompetitionForLogger(user: UnifiedUser, competitionId: string): boolean {
  return canAccessCompetition(user, competitionId);
}

/**
 * Logger rate limiting configuration
 */
export interface LoggerRateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutDurationMs: number;
}

/**
 * Default rate limiting for loggers (stricter than regular users)
 */
export const DEFAULT_LOGGER_RATE_LIMIT: LoggerRateLimitConfig = {
  maxAttempts: 3, // Only 3 attempts
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockoutDurationMs: 60 * 60 * 1000 // 1 hour lockout
};

/**
 * Session management utilities
 */
export class LoggerSessionManager {
  static readonly DEFAULT_SESSION_CONFIG: SessionConfig = {
    timeout: 60, // 60 minutes
    warnBefore: 5, // Warn 5 minutes before timeout
    autoRefresh: true
  };

  /**
   * Check if session is about to expire
   * @param user - The logger user
   * @param warnMinutes - Minutes before expiration to warn
   * @returns boolean - Whether session is about to expire
   */
  static isSessionExpiring(user: UnifiedUser, warnMinutes: number = 5): boolean {
    if (!user.lastLogin) return false;
    
    const lastLoginTime = new Date(user.lastLogin).getTime();
    const currentTime = Date.now();
    const sessionTimeout = (user.sessionTimeout || this.DEFAULT_SESSION_CONFIG.timeout) * 60 * 1000;
    const warnTime = warnMinutes * 60 * 1000;
    
    return (currentTime - lastLoginTime) > (sessionTimeout - warnTime);
  }

  /**
   * Get remaining session time in minutes
   * @param user - The logger user
   * @returns number - Remaining session time in minutes
   */
  static getRemainingSessionTime(user: UnifiedUser): number {
    if (!user.lastLogin) return 0;
    
    const lastLoginTime = new Date(user.lastLogin).getTime();
    const currentTime = Date.now();
    const sessionTimeout = (user.sessionTimeout || this.DEFAULT_SESSION_CONFIG.timeout) * 60 * 1000;
    const elapsed = currentTime - lastLoginTime;
    
    return Math.max(0, Math.floor((sessionTimeout - elapsed) / 60000));
  }

  /**
   * Check if session has expired
   * @param user - The logger user
   * @returns boolean - Whether session has expired
   */
  static isSessionExpired(user: UnifiedUser): boolean {
    if (!user.lastLogin) return false;
    
    const lastLoginTime = new Date(user.lastLogin).getTime();
    const currentTime = Date.now();
    const sessionTimeout = (user.sessionTimeout || this.DEFAULT_SESSION_CONFIG.timeout) * 60 * 1000;
    
    return (currentTime - lastLoginTime) > sessionTimeout;
  }
}

// Export RBAC helpers for logger-specific checks
export const LoggerRBAC = {
  isLogger: RBAC.isLogger,
  canLogEvents: RBAC.canLogEvents,
  canManageLoggers: RBAC.canManageLoggers,
  hasAdminPrivileges: RBAC.hasAdminPrivileges
};

export default {
  generateLoggerToken,
  verifyLoggerToken,
  hasLoggerPermission,
  canAccessCompetitionForLogger,
  LoggerSessionManager,
  DEFAULT_LOGGER_RATE_LIMIT,
  LoggerRBAC
};