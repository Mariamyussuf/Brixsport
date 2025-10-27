import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { UnifiedUser, verifyUnifiedToken } from './authService';

// Define the structure of our user object (using UnifiedUser)
export type { UnifiedUser as User };

// Define the structure of our session object
export interface Session {
  user: UnifiedUser;
  expires: string;
}

// Secret key for JWT verification - in production, use environment variables
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default_secret_key_for_development'
);

/**
 * Get the authentication session from the request
 * @param request - The NextRequest object
 * @returns Promise<Session | null>
 */
export async function getAuth(request: Request): Promise<Session | null> {
  try {
    // First, try to get the token from the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (authHeader) {
      const token = authHeader.split(' ')[1]; // Bearer TOKEN
      
      if (token) {
        // Verify the JWT token using our unified system
        const user = await verifyUnifiedToken(token);
        
        if (user) {
          // Create and return the session object
          const session: Session = {
            user,
            expires: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
          };
          
          return session;
        }
      }
    }
    
    // If no authorization header, check for a session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (sessionCookie?.value) {
      // Verify the JWT token from cookie using our unified system
      const user = await verifyUnifiedToken(sessionCookie.value);
      
      if (user) {
        // Create and return the session object
        const session: Session = {
          user,
          expires: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
        };
        
        return session;
      }
    }
    
    // No valid authentication found
    return null;
  } catch (error) {
    // If verification fails, return null
    console.error('Authentication error:', error);
    return null;
  }
}

// Role checking utilities
export const AuthRoles = {
  isUser: (user: UnifiedUser | null): boolean => {
    return user !== null && user.role === 'user';
  },
  
  isLogger: (user: UnifiedUser | null): boolean => {
    return user !== null && user.role === 'logger';
  },
  
  isAdmin: (user: UnifiedUser | null): boolean => {
    return user !== null && user.role === 'admin';
  },
  
  isSuperAdmin: (user: UnifiedUser | null): boolean => {
    return user !== null && user.role === 'super-admin';
  },
  
  hasAdminPrivileges: (user: UnifiedUser | null): boolean => {
    return user !== null && (user.role === 'admin' || user.role === 'super-admin');
  }
};