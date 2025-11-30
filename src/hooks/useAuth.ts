"use client";

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback
} from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'logger' | 'senior-logger' | 'logger-admin' | 'admin' | 'super-admin';
  image?: string;
  assignedCompetitions?: string[];
  permissions?: string[];
  managedLoggers?: string[];
  adminLevel?: 'basic' | 'super';
}

export interface AuthContextType {
  user: User | null;
  loading: LoadingStates;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (userData: SignupCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}

interface AuthError {
  type: 'NETWORK' | 'UNAUTHORIZED' | 'VALIDATION' | 'TOKEN_EXPIRED' | 'RATE_LIMITED' | 'UNKNOWN';
  message: string;
  code?: string;
}

interface LoadingStates {
  initializing: boolean;
  loggingIn: boolean;
  signingUp: boolean;
  refreshing: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupCredentials {
  name: string;
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

interface SignupResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

interface RefreshResponse {
  token: string;
  refreshToken: string;
}

// Auth Service for API calls
class AuthService {
  private static readonly API_BASE: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  static async validateToken(token: string): Promise<User> {
    const response = await fetch(`${this.API_BASE}/api/v1/auth/me`, {
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

  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${this.API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      if (response.status === 422) {
        throw new Error('VALIDATION');
      }
      if (response.status === 429) {
        throw new Error('RATE_LIMITED');
      }
      throw new Error(errorData.error?.message || 'NETWORK');
    }

    const data = await response.json();
    return {
      token: data.data.token,
      refreshToken: data.data.refreshToken,
      user: data.data.user
    };
  }

  static async signup(userData: SignupCredentials): Promise<SignupResponse> {
    const response = await fetch(`${this.API_BASE}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 409) {
        throw new Error('USER_EXISTS');
      }
      if (response.status === 422) {
        throw new Error('VALIDATION');
      }
      if (response.status === 429) {
        throw new Error('RATE_LIMITED');
      }
      if (response.status === 500) {
        throw new Error('SERVER_ERROR');
      }
      throw new Error(errorData.error?.message || 'NETWORK');
    }

    return response.json();
  }

  static async refreshToken(refreshToken: string): Promise<RefreshResponse> {
    const response = await fetch(`${this.API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('UNAUTHORIZED');
    }

    const data = await response.json();
    return {
      token: data.data.token,
      refreshToken: data.data.refreshToken
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

// Token management utilities
export class TokenManager {
  private static readonly TOKEN_KEY: string = 'authToken';
  private static readonly REFRESH_TOKEN_KEY: string = 'refreshToken';
  private static readonly TOKEN_EXPIRY_KEY: string = 'tokenExpiry';
  private static readonly USER_KEY: string = 'authUser';

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static setTokens(token: string, refreshToken: string, user: User): void {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<LoadingStates>({
    initializing: true,
    loggingIn: false,
    signingUp: false,
    refreshing: false,
  });
  const [error, setError] = useState<AuthError | null>(null);

  const createError = useCallback((
    type: AuthError['type'],
    message: string,
    code?: string
  ): AuthError => ({
    type,
    message,
    code,
  }), []);

  const updateLoading = useCallback((key: keyof LoadingStates, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const refreshToken = useCallback(async (): Promise<void> => {
    const refreshTokenValue = TokenManager.getRefreshToken();
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    updateLoading('refreshing', true);
    try {
      const { token: newToken, refreshToken: newRefreshToken } = await AuthService.refreshToken(refreshTokenValue);

      const userData = await AuthService.validateToken(newToken);
      TokenManager.setTokens(newToken, newRefreshToken, userData);
      setUser(userData);
      setError(null);
    } catch (err) {
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
        const storedUser = TokenManager.getUser();

        if (token && storedUser) {
          // Check if token is expired
          if (AuthService.isTokenExpired(token)) {
            // Try to refresh
            try {
              await refreshToken();
            } catch {
              TokenManager.clearTokens();
            }
          } else {
            // Validate token with backend
            try {
              const userData = await AuthService.validateToken(token);
              if (isMounted) {
                setUser(userData);
                TokenManager.setTokens(token, TokenManager.getRefreshToken()!, userData);
              }
            } catch {
              if (isMounted) {
                TokenManager.clearTokens();
              }
            }
          }
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

    return (): void => {
      isMounted = false;
    };
  }, [createError, updateLoading, refreshToken]);

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

        const refreshTime: number = TokenManager.isTokenExpiringSoon()
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

  const login = async (credentials: LoginCredentials): Promise<void> => {
    updateLoading('loggingIn', true);
    setError(null);

    try {
      const { token, refreshToken, user: userData } = await AuthService.login(credentials);

      TokenManager.setTokens(token, refreshToken, userData);
      setUser(userData);
    } catch (err) {
      let errorMessage = 'Failed to log in.';

      if (err instanceof Error) {
        if (err.message === 'UNAUTHORIZED') {
          errorMessage = 'Invalid email or password.';
        } else if (err.message === 'RATE_LIMITED') {
          errorMessage = 'Too many login attempts. Please try again later.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(createError('UNKNOWN', errorMessage));
      throw new Error(errorMessage);
    } finally {
      updateLoading('loggingIn', false);
    }
  };

  const signup = async (userData: SignupCredentials): Promise<void> => {
    updateLoading('signingUp', true);
    setError(null);

    try {
      const response = await AuthService.signup(userData);

      if (!response.success) {
        throw new Error(response.message || 'Signup failed');
      }

      // After successful signup, automatically log the user in
      await login({ email: userData.email, password: userData.password });
    } catch (err) {
      let errorMessage = 'Failed to sign up.';

      if (err instanceof Error) {
        if (err.message.includes('USER_EXISTS')) {
          errorMessage = 'An account with this email already exists.';
          setError(createError('VALIDATION', errorMessage, 'USER_EXISTS'));
        } else if (err.message.includes('VALIDATION')) {
          errorMessage = 'Please check your input and try again.';
          setError(createError('VALIDATION', errorMessage, 'VALIDATION_ERROR'));
        } else if (err.message.includes('RATE_LIMITED')) {
          errorMessage = 'Too many signup attempts. Please try again later.';
          setError(createError('RATE_LIMITED', errorMessage, 'RATE_LIMITED'));
        } else {
          errorMessage = err.message;
          setError(createError('UNKNOWN', errorMessage));
        }
      }

      throw new Error(errorMessage);
    } finally {
      updateLoading('signingUp', false);
    }
  };

  const logout = useCallback(async (): Promise<void> => {
    try {
      const token = TokenManager.getToken();
      const refreshToken = TokenManager.getRefreshToken();

      if (token && refreshToken) {
        await AuthService.logout(token, refreshToken);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      TokenManager.clearTokens();
      setUser(null);
      setError(null);
    }
  }, []);

  const isAuthenticated: boolean = user !== null;

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    signup,
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

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

export const useRequireAuth = (): {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean
} => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading.initializing && !user) {
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

export const useLoggerAuth = (): {
  user: User | null;
  isAuthenticated: boolean;
  isLogger: boolean;
  isLoading: boolean;
  hasLoggerPermissions: boolean;
} => {
  const { user, loading } = useAuth();

  const isLogger = user?.role?.startsWith('logger') || false;
  const hasLoggerPermissions = user !== null && (
    user.role.startsWith('logger') ||
    user.role === 'admin' ||
    user.role === 'super-admin'
  );

  return {
    user,
    isAuthenticated: user !== null,
    isLogger,
    hasLoggerPermissions,
    isLoading: loading.initializing
  };
};