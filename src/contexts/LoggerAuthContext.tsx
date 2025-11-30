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

// Logger-specific Token Manager (separate from main auth)
class LoggerTokenManager {
  private static readonly TOKEN_KEY: string = 'loggerAuthToken';
  private static readonly REFRESH_TOKEN_KEY: string = 'loggerRefreshToken';
  private static readonly TOKEN_EXPIRY_KEY: string = 'loggerTokenExpiry';
  private static readonly USER_KEY: string = 'loggerAuthUser';

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static getUser(): LoggerUser | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static setTokens(token: string, refreshToken: string, user: LoggerUser): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiry.toString());
    } catch {
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    }
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static isTokenExpiringSoon(): boolean {
    if (typeof window === 'undefined') return false;

    const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryStr) return true;

    const expiry = parseInt(expiryStr, 10);
    const now = Date.now();

    return (expiry - now) < 10 * 60 * 1000;
  }
}

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
  private static readonly API_BASE: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  static async validateToken(token: string): Promise<LoggerUser> {
    const response = await fetch(`${this.API_BASE}/api/v1/auth/sessions`, {
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

    return this.getUserFromToken(token);
  }

  static async getUserFromToken(token: string): Promise<LoggerUser> {
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

  static async login(credentials: LoginCredentials): Promise<{
    accessToken: string;
    refreshToken: string;
    user: LoggerUser;
  }> {
    const response = await fetch(`${this.API_BASE}/api/v1/auth/login`, {
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
      accessToken: data.data.token,
      refreshToken: data.data.refreshToken,
      user: data.data.user,
    };
  }

  static async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const response = await fetch(`${this.API_BASE}/api/v1/auth/refresh-tokens`, {
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

    return {
      accessToken: data.data.token,
      refreshToken: data.data.refreshToken,
    };
  }

  static async logout(token: string, refreshToken: string): Promise<void> {
    await fetch(`${this.API_BASE}/api/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ refreshToken }),
    });
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
      const refreshTokenValue = LoggerTokenManager.getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token available for refresh');
      }

      const { accessToken, refreshToken: newRefreshToken } = await LoggerAuthService.refreshToken(refreshTokenValue);

      // Get user data from the new access token
      const userData = await LoggerAuthService.getUserFromToken(accessToken);

      // Store tokens with user data
      LoggerTokenManager.setTokens(accessToken, newRefreshToken, userData);
      setUser(userData);
    } catch (error) {
      LoggerTokenManager.clearTokens();
      setUser(null);
      throw error;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async (): Promise<void> => {
      try {
        const token = LoggerTokenManager.getToken();
        const storedUser = LoggerTokenManager.getUser();

        if (token && storedUser) {
          if (LoggerAuthService.isTokenExpired(token)) {
            // Token is expired, try to refresh
            try {
              await refreshToken();
            } catch (refreshError) {
              // If refresh fails, clear tokens
              LoggerTokenManager.clearTokens();
              if (isMounted) {
                setError('Session expired. Please log in again.');
              }
            }
          } else {
            // Validate token with backend
            try {
              const userData = await LoggerAuthService.validateToken(token);
              if (isMounted) {
                setUser(userData);
                // Update stored user data
                LoggerTokenManager.setTokens(
                  token,
                  LoggerTokenManager.getRefreshToken()!,
                  userData
                );
              }
            } catch {
              if (isMounted) {
                LoggerTokenManager.clearTokens();
              }
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          LoggerTokenManager.clearTokens();
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

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!user) return;

    const token = LoggerTokenManager.getToken();
    if (!token) return;

    let timeoutId: NodeJS.Timeout;

    const scheduleRefresh = (): void => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime: number = payload.exp * 1000;
        const currentTime: number = Date.now();
        const timeUntilExpiration: number = expirationTime - currentTime;

        const refreshTime: number = LoggerTokenManager.isTokenExpiringSoon()
          ? 0
          : Math.max(timeUntilExpiration - 5 * 60 * 1000, 0);

        timeoutId = setTimeout(async () => {
          try {
            await refreshToken();
            scheduleRefresh();
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
    setLoading(true);
    setError(null);

    try {
      const { accessToken, refreshToken, user: userData } = await LoggerAuthService.login(credentials);

      // Store tokens with user data - FIXED: Now passing all 3 arguments
      LoggerTokenManager.setTokens(accessToken, refreshToken, userData);
      setUser(userData);
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
      const token = LoggerTokenManager.getToken();
      const refreshToken = LoggerTokenManager.getRefreshToken();

      if (token && refreshToken) {
        await LoggerAuthService.logout(token, refreshToken);
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      // Always clear tokens locally
      LoggerTokenManager.clearTokens();
      setUser(null);
      setError(null);
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