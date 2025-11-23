"use client";

import React, { 
  createContext, 
  useState, 
  useContext, 
  ReactNode, 
  useEffect, 
  useCallback 
} from 'react';
import { LoggerUser } from '@/lib/loggerAuth';
import { TokenManager } from '@/hooks/useAuth';

// Define the LoggerAuthContextType interface
export interface LoggerAuthContextType {
  user: LoggerUser | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}

// Login credentials interface
interface LoginCredentials {
  email: string;
  password: string;
}

// Logger Auth Service for API calls
class LoggerAuthService {
  private static readonly API_BASE: string = '/api/logger/auth';

  static async validateToken(token: string): Promise<LoggerUser> {
    // Get the backend API URL from environment variables
    const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // Forward the request to the backend API
    const response = await fetch(`${backendApiUrl}/api/v1/auth/sessions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error('NETWORK');
    }

    // If we get a successful response, the token is valid
    // We'll decode the token to get user information
    return this.getUserFromToken(token);
  }

  static async getUserFromToken(token: string): Promise<LoggerUser> {
    // Decode the JWT token to get user information
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.userId || payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role || 'logger',
        assignedCompetitions: payload.assignedCompetitions,
        permissions: payload.permissions,
        lastLogin: payload.lastLogin,
        sessionTimeout: payload.sessionTimeout
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static async login(credentials: LoginCredentials): Promise<{ accessToken: string; refreshToken: string; user: LoggerUser; accessTokenExpiry: string; refreshTokenExpiry: string }> {
    // Get the backend API URL from environment variables
    const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // Forward the request to the backend API
    const response = await fetch(`${backendApiUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid credentials');
      }
      throw new Error('Network error');
    }

    const data = await response.json();
    
    // Calculate expiry times (1 hour for access token, 7 days for refresh token)
    const accessTokenExpiry = new Date();
    accessTokenExpiry.setHours(accessTokenExpiry.getHours() + 1);
    
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
    
    return {
      accessToken: data.data.token,
      refreshToken: data.data.refreshToken,
      user: data.data.user,
      accessTokenExpiry: accessTokenExpiry.toISOString(),
      refreshTokenExpiry: refreshTokenExpiry.toISOString()
    };
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; accessTokenExpiry: string; refreshTokenExpiry: string }> {
    // Get the backend API URL from environment variables
    const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // Forward the request to the backend API
    const response = await fetch(`${backendApiUrl}/api/v1/auth/refresh-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    
    // Calculate expiry times (1 hour for access token, 7 days for refresh token)
    const accessTokenExpiry = new Date();
    accessTokenExpiry.setHours(accessTokenExpiry.getHours() + 1);
    
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);
    
    return {
      accessToken: data.data.token,
      refreshToken: data.data.refreshToken,
      accessTokenExpiry: accessTokenExpiry.toISOString(),
      refreshTokenExpiry: refreshTokenExpiry.toISOString()
    };
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= (payload.exp * 1000);
    } catch {
      return true;
    }
  }
}

// Create the context with a default undefined value
const LoggerAuthContext = createContext<LoggerAuthContextType | undefined>(undefined);

// LoggerAuthProvider Props interface
interface LoggerAuthProviderProps {
  children: ReactNode;
}

// Create the LoggerAuthProvider component
export const LoggerAuthProvider: React.FC<LoggerAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<LoggerUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to clear error
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const refreshTokenValue = TokenManager.getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token available for refresh');
      }

      const { accessToken, refreshToken: newRefreshToken } = await LoggerAuthService.refreshToken(refreshTokenValue);
      TokenManager.setTokens(accessToken, newRefreshToken);
      
      // Fetch updated user data
      const userData = await LoggerAuthService.validateToken(accessToken);
      setUser(userData);
    } catch (error) {
      TokenManager.clearTokens();
      setUser(null);
      throw error;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async (): Promise<void> => {
      try {
        const token = TokenManager.getToken();
        if (token && !LoggerAuthService.isTokenExpired(token)) {
          const userData = await LoggerAuthService.validateToken(token);
          if (isMounted) {
            setUser(userData);
          }
        } else if (token) {
          // Token is expired, try to refresh
          try {
            await refreshToken();
          } catch (refreshError) {
            // If refresh fails, clear tokens and show error
            TokenManager.clearTokens();
            if (isMounted && refreshError instanceof Error) {
              setError('Session expired. Please log in again.');
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          TokenManager.clearTokens();
          if (err instanceof Error) {
            setError('Session expired. Please log in again.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return (): void => {
      isMounted = false;
    };
  }, [refreshToken]);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { accessToken, refreshToken, user } = await LoggerAuthService.login(credentials);
      TokenManager.setTokens(accessToken, refreshToken);
      setUser(user);
    } catch (err) {
      let errorMessage = 'Failed to log in.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      // Call backend logout endpoint to invalidate refresh token
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        await fetch(`/api/logger/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
      
      // Clear tokens
      TokenManager.clearTokens();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Error logging out:', error);
      // Still clear tokens locally even if backend call fails
      TokenManager.clearTokens();
      setUser(null);
    }
  }, []);

  // Computed property for authentication status
  const isAuthenticated: boolean = user !== null;

  const value: LoggerAuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    refreshToken,
    clearError,
    isAuthenticated,
  };

  return React.createElement(
    LoggerAuthContext.Provider,
    { value },
    children
  );
};

// Create the useLoggerAuth hook for easy consumption
export const useLoggerAuth = (): LoggerAuthContextType => {
  const context = useContext(LoggerAuthContext);
  if (context === undefined) {
    throw new Error('useLoggerAuth must be used within a LoggerAuthProvider');
  }
  return context;
};

export default LoggerAuthContext;