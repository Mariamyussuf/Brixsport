// Logger Authentication Service
// Separate authentication system for logger users

import { jwtVerify, SignJWT } from 'jose';
import { LoggerUser } from './loggerAuth';

// Secret key for logger JWT verification - in production, use environment variables
const LOGGER_JWT_SECRET = new TextEncoder().encode(
  process.env.LOGGER_JWT_SECRET || process.env.JWT_SECRET || 'logger_secret_key_for_development'
);

// Logger session interface
export interface LoggerSession {
  user: LoggerUser;
  expires: string;
}

/**
 * Generate a JWT token for logger users
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
    .sign(LOGGER_JWT_SECRET);
}

/**
 * Verify a logger JWT token
 * @param token - The JWT token to verify
 * @returns Promise<LoggerUser | null> - The verified logger user or null if invalid
 */
export async function verifyLoggerToken(token: string): Promise<LoggerUser | null> {
  try {
    const { payload } = await jwtVerify(token, LOGGER_JWT_SECRET);
    
    // Validate that this is a logger user
    const role = payload.role as string;
    if (role && role === 'logger') {
      const user: LoggerUser = {
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
    
    return null;
  } catch (error) {
    console.error('Logger token verification error:', error);
    return null;
  }
}

/**
 * Get the logger authentication session from the request
 * @param request - The NextRequest object
 * @returns Promise<LoggerSession | null>
 */
export async function getLoggerAuth(request: Request): Promise<LoggerSession | null> {
  try {
    // First, try to get the token from the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (authHeader) {
      const token = authHeader.split(' ')[1]; // Bearer TOKEN
      
      if (token) {
        // Verify the JWT token
        const user = await verifyLoggerToken(token);
        
        if (user) {
          // Create and return the session object
          const session: LoggerSession = {
            user,
            expires: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
          };
          
          return session;
        }
      }
    }
    
    // If no authorization header, check for a logger session cookie
    // Note: This would require additional implementation for cookie parsing
    
    // No valid authentication found
    return null;
  } catch (error) {
    // If verification fails, return null
    console.error('Logger authentication error:', error);
    return null;
  }
}

// Logger role checking utilities
export const LoggerAuthRoles = {
  isLogger: (user: LoggerUser | null): boolean => {
    return user !== null && user.role === 'logger';
  },
  
  isSeniorLogger: (user: LoggerUser | null): boolean => {
    return false; // Senior logger role not supported in this implementation
  },
  
  isLoggerAdmin: (user: LoggerUser | null): boolean => {
    return false; // Logger admin role not supported in this implementation
  },
  
  hasAdminPrivileges: (user: LoggerUser | null): boolean => {
    return false; // Logger admin role not supported in this implementation
  }
};

export default {
  generateLoggerToken,
  verifyLoggerToken,
  getLoggerAuth,
  LoggerAuthRoles
};