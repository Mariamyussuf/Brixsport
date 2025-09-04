import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Define the structure of our user object
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
}

// Define the structure of our session object
export interface Session {
  user: User;
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
        // Verify the JWT token
        const { payload } = await jwtVerify(token, JWT_SECRET);
        
        // Create and return the session object
        const session: Session = {
          user: {
            id: payload.id as string,
            name: payload.name as string,
            email: payload.email as string,
            role: payload.role as string,
            image: payload.image as string | undefined
          },
          expires: new Date(payload.exp! * 1000).toISOString()
        };
        
        return session;
      }
    }
    
    // If no authorization header, check for a session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (sessionCookie?.value) {
      // Verify the JWT token from cookie
      const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);
      
      // Create and return the session object
      const session: Session = {
        user: {
          id: payload.id as string,
          name: payload.name as string,
          email: payload.email as string,
          role: payload.role as string,
          image: payload.image as string | undefined
        },
        expires: new Date(payload.exp! * 1000).toISOString()
      };
      
      return session;
    }
    
    // No valid authentication found
    return null;
  } catch (error) {
    // If verification fails, return null
    console.error('Authentication error:', error);
    return null;
  }
}