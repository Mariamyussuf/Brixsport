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
    const response = await fetch(`${this.API_BASE}`, {
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

    const data = await response.json();
    return data.data.user;
  }

  static async login(credentials: LoginCredentials): Promise<{ token: string; user: LoggerUser }> {
    const response = await fetch(`${this.API_BASE}`, {
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
    return {
      token: data.data.token,
      user: data.data.user
    };
  }

  static async refreshToken(refreshToken: string): Promise<{ token: string }> {
    // Logger system doesn't currently implement refresh tokens
    // Instead of throwing an error, we'll implement a basic refresh mechanism
    try {
      // For logger system, we'll validate the current token and if it's still valid, extend it
      // In a real implementation, this would call an API endpoint to get a new token
      const userData = await LoggerAuthService.validateToken(refreshToken);
      if (userData) {
        // Token is still valid, we can "refresh" by returning the same token
        return { token: refreshToken };
      } else {
        throw new Error('Token validation failed');
      }
    } catch (error) {
      throw new Error('Failed to refresh token');
    }
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
    // Logger system doesn't currently implement refresh tokens
    // Instead of throwing an error, we'll implement a basic refresh mechanism
    try {
      const currentToken = TokenManager.getToken();
      if (!currentToken) {
        throw new Error('No token available for refresh');
      }

      // For logger system, we'll validate the current token and if it's still valid, extend it
      // In a real implementation, this would call an API endpoint to get a new token
      const userData = await LoggerAuthService.validateToken(currentToken);
      if (userData) {
        // Token is still valid, we can "refresh" by re-setting it
        TokenManager.setTokens(currentToken, ''); // Logger system doesn't use refresh tokens
        setUser(userData);
      } else {
        throw new Error('Token validation failed');
      }
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
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { token, user } = await LoggerAuthService.login(credentials);
      TokenManager.setTokens(token, ''); // Logger system doesn't use refresh tokens
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
      // Clear tokens
      TokenManager.clearTokens();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Error logging out:', error);
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