"use client";

import React, { 
  createContext, 
  useState, 
  useContext, 
  ReactNode, 
  useEffect, 
  useCallback 
} from 'react';

// Define the shape of the user object
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
}

// Define error types for better error handling
interface AuthError {
  type: 'NETWORK' | 'UNAUTHORIZED' | 'VALIDATION' | 'TOKEN_EXPIRED' | 'UNKNOWN';
  message: string;
  code?: string;
}

// Define loading states for different operations
interface LoadingStates {
  initializing: boolean;
  loggingIn: boolean;
  refreshing: boolean;
}

// Login credentials interface
interface LoginCredentials {
  email: string;
  password: string;
}

// API Response interfaces
interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

interface RefreshResponse {
  token: string;
  refreshToken: string;
}

// Define the shape of the auth context state
interface AuthContextType {
  user: User | null;
  loading: LoadingStates;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}

// Auth Service for API calls
class AuthService {
  private static readonly API_BASE: string = '/api/auth';

  static async validateToken(token: string): Promise<User> {
    const response = await fetch(`${this.API_BASE}/me`, {
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

    return response.json() as Promise<User>;
  }

  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${this.API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      if (response.status === 422) {
        throw new Error('VALIDATION');
      }
      throw new Error('NETWORK');
    }

    return response.json() as Promise<LoginResponse>;
  }

  static async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    const response = await fetch(`${this.API_BASE}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('UNAUTHORIZED');
    }

    return response.json() as Promise<RefreshResponse>;
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

// Token management utilities
class TokenManager {
  private static readonly TOKEN_KEY: string = 'authToken';
  private static readonly REFRESH_TOKEN_KEY: string = 'refreshToken';

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setTokens(token: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}

// Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider Props interface
interface AuthProviderProps {
  children: ReactNode;
}

// Create the AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<LoadingStates>({
    initializing: true,
    loggingIn: false,
    refreshing: false,
  });
  const [error, setError] = useState<AuthError | null>(null);

  // Helper function to create error objects
  const createError = useCallback((
    type: AuthError['type'], 
    message: string, 
    code?: string
  ): AuthError => ({
    type,
    message,
    code,
  }), []);

  // Helper function to update loading states
  const updateLoading = useCallback((key: keyof LoadingStates, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear error function
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<void> => {
    const refreshTokenValue = TokenManager.getRefreshToken();
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    updateLoading('refreshing', true);
    try {
      const { token: newToken, refreshToken: newRefreshToken } = await AuthService.refreshToken(refreshTokenValue);
      TokenManager.setTokens(newToken, newRefreshToken);
      
      // Fetch updated user data
      const userData = await AuthService.validateToken(newToken);
      setUser(userData);
      setError(null);
    } catch (err) {
      // If refresh fails, logout the user
      TokenManager.clearTokens();
      setUser(null);
      throw err;
    } finally {
      updateLoading('refreshing', false);
    }
  }, [updateLoading]);

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async (): Promise<void> => {
      try {
        const token = TokenManager.getToken();
        if (!token) {
          return;
        }

        // Check if token is expired
        if (AuthService.isTokenExpired(token)) {
          // Try to refresh the token
          try {
            await refreshToken();
          } catch {
            // If refresh fails, clear tokens
            TokenManager.clearTokens();
          }
          return;
        }

        // Validate existing token
        const userData = await AuthService.validateToken(token);
        if (isMounted) {
          setUser(userData);
        }
      } catch (err) {
        if (isMounted) {
          TokenManager.clearTokens();
          if (err instanceof Error) {
            setError(createError('UNAUTHORIZED', 'Session expired. Please log in again.'));
          }
        }
      } finally {
        if (isMounted) {
          updateLoading('initializing', false);
        }
      }
    };

    initializeAuth();

    // Cleanup function
    return (): void => {
      isMounted = false;
    };
  }, [refreshToken, createError, updateLoading]);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!user) return;

    const token = TokenManager.getToken();
    if (!token) return;

    let timeoutId: NodeJS.Timeout;

    const scheduleRefresh = (): void => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime: number = payload.exp * 1000;
        const currentTime: number = Date.now();
        const timeUntilExpiration: number = expirationTime - currentTime;
        
        // Refresh 5 minutes before expiration
        const refreshTime: number = Math.max(timeUntilExpiration - 5 * 60 * 1000, 0);

        timeoutId = setTimeout(async () => {
          try {
            await refreshToken();
            scheduleRefresh(); // Schedule next refresh
          } catch {
            // If refresh fails, user will be logged out
          }
        }, refreshTime);
      } catch {
        // Invalid token format
      }
    };

    scheduleRefresh();

    return (): void => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [user, refreshToken]);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    updateLoading('loggingIn', true);
    setError(null);

    try {
      const { token, refreshToken: newRefreshToken, user: userData } = await AuthService.login(credentials);
      
      TokenManager.setTokens(token, newRefreshToken);
      setUser(userData);
    } catch (err) {
      let errorType: AuthError['type'] = 'UNKNOWN';
      let errorMessage = 'An unexpected error occurred.';

      if (err instanceof Error) {
        switch (err.message) {
          case 'UNAUTHORIZED':
            errorType = 'UNAUTHORIZED';
            errorMessage = 'Invalid email or password.';
            break;
          case 'VALIDATION':
            errorType = 'VALIDATION';
            errorMessage = 'Please check your input and try again.';
            break;
          case 'NETWORK':
            errorType = 'NETWORK';
            errorMessage = 'Network error. Please check your connection.';
            break;
          default:
            errorMessage = err.message;
        }
      }

      setError(createError(errorType, errorMessage));
      throw new Error(errorMessage);
    } finally {
      updateLoading('loggingIn', false);
    }
  };

  // Logout function
  const logout = useCallback((): void => {
    const currentToken = TokenManager.getToken();
    TokenManager.clearTokens();
    setUser(null);
    setError(null);
    
    // Optional: Call logout endpoint to invalidate token on server
    if (currentToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      }).catch(() => {
        // Ignore logout errors - user is already being logged out locally
      });
    }
  }, []);

  // Computed property for authentication status
  const isAuthenticated: boolean = user !== null;

  const value: AuthContextType = {
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
    AuthContext.Provider,
    { value },
    children
  );
};

// Create the useAuth hook for easy consumption
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Additional utility hooks for specific use cases
export const useAuthUser = (): User | null => {
  const { user } = useAuth();
  return user;
};

export const useAuthLoading = (): LoadingStates => {
  const { loading } = useAuth();
  return loading;
};

export const useAuthError = (): { error: AuthError | null; clearError: () => void } => {
  const { error, clearError } = useAuth();
  return { error, clearError };
};

// Protected route helper
export const useRequireAuth = (): { 
  user: User | null; 
  isAuthenticated: boolean; 
  isLoading: boolean 
} => {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading.initializing && !user) {
      // Redirect to login page or show login modal
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  }, [user, loading.initializing]);

  return { 
    user, 
    isAuthenticated: user !== null, 
    isLoading: loading.initializing 
  };
};