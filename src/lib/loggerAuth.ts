// Logger Authentication Utilities
// Specialized authentication functions for the logger system

import { jwtVerify, SignJWT } from 'jose';
import { User } from './auth';

// Secret key for JWT verification - in production, use environment variables
const JWT_SECRET = new TextEncoder().encode(
  process.env.LOGGER_JWT_SECRET || process.env.JWT_SECRET || 'logger_secret_key_for_development'
);

// Logger-specific user roles
export type LoggerRole = 'logger' | 'senior-logger' | 'logger-admin' | 'admin' | 'super-admin';

// Extended user interface for loggers
export interface LoggerUser extends User {
  role: LoggerRole;
  assignedCompetitions?: string[];
  permissions: string[];
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
    .sign(JWT_SECRET);
}

/**
 * Verify a logger JWT token
 * @param token - The JWT token to verify
 * @returns Promise<LoggerUser | null> - The verified user or null if invalid
 */
export async function verifyLoggerToken(token: string): Promise<LoggerUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Check if this is a logger user or admin
    const role = payload.role as string;
    if (!role || (!role.startsWith('logger') && role !== 'admin' && role !== 'super-admin')) {
      return null;
    }
    
    const user: LoggerUser = {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: role as LoggerRole,
      assignedCompetitions: payload.assignedCompetitions as string[] | undefined,
      permissions: payload.permissions as string[],
      lastLogin: payload.lastLogin as string | undefined,
      sessionTimeout: payload.sessionTimeout as number | undefined
    };
    
    return user;
  } catch (error) {
    console.error('Logger token verification error:', error);
    return null;
  }
}

/**
 * Check if a user has specific logger permissions
 * @param user - The logger user
 * @param permission - The permission to check
 * @returns boolean - Whether the user has the permission
 */
export function hasLoggerPermission(user: LoggerUser, permission: string): boolean {
  return user.permissions.includes(permission);
}

/**
 * Check if a logger can access a specific competition
 * @param user - The logger user
 * @param competitionId - The competition ID to check
 * @returns boolean - Whether the logger can access the competition
 */
export function canAccessCompetition(user: LoggerUser, competitionId: string): boolean {
  // Admins and super-admins can access all competitions
  if (user.role === 'admin' || user.role === 'super-admin' || user.role === 'logger-admin') {
    return true;
  }
  
  // If user has specific competitions assigned, check if this one is in the list
  if (user.assignedCompetitions && user.assignedCompetitions.length > 0) {
    return user.assignedCompetitions.includes(competitionId);
  }
  
  // If no specific competitions are assigned, allow access to all (for regular loggers)
  return user.role === 'logger' || user.role === 'senior-logger';
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
  static isSessionExpiring(user: LoggerUser, warnMinutes: number = 5): boolean {
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
  static getRemainingSessionTime(user: LoggerUser): number {
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
  static isSessionExpired(user: LoggerUser): boolean {
    if (!user.lastLogin) return false;
    
    const lastLoginTime = new Date(user.lastLogin).getTime();
    const currentTime = Date.now();
    const sessionTimeout = (user.sessionTimeout || this.DEFAULT_SESSION_CONFIG.timeout) * 60 * 1000;
    
    return (currentTime - lastLoginTime) > sessionTimeout;
  }
}

export default {
  generateLoggerToken,
  verifyLoggerToken,
  hasLoggerPermission,
  canAccessCompetition,
  LoggerSessionManager,
  DEFAULT_LOGGER_RATE_LIMIT
};