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
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'logger' | 'senior-logger' | 'logger-admin' | 'admin' | 'super-admin';
  image?: string;
  assignedCompetitions?: string[]; // Logger-specific field
  permissions?: string[]; // Logger-specific field
  // Admin-specific fields
  managedLoggers?: string[]; // Admin can manage these loggers
  adminLevel?: 'basic' | 'super'; // Admin level for permission granularity
}

// Define the AuthContextType interface
interface AuthContextType {
  user: User | null;
  loading: LoadingStates;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}

// Define error types for better error handling
interface AuthError {
  type: 'NETWORK' | 'UNAUTHORIZED' | 'VALIDATION' | 'TOKEN_EXPIRED' | 'RATE_LIMITED' | 'UNKNOWN';
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

// Rate limiting interface
interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  isLocked: boolean;
  lockUntil: number;
}

// Auth Service for API calls
class AuthService {
  private static readonly API_BASE: string = '/api/auth';
  private static readonly MAX_ATTEMPTS: number = 5;
  private static readonly LOCKOUT_DURATION: number = 15 * 60 * 1000; // 15 minutes

  // Rate limiting storage key
  private static readonly RATE_LIMIT_KEY: string = 'auth_rate_limit';

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
    // Check rate limiting before attempting login
    if (this.isRateLimited()) {
      throw new Error('RATE_LIMITED');
    }

    const response = await fetch(`${this.API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    // Update rate limiting after attempt
    this.updateRateLimit(response.status === 401 || response.status === 422);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      if (response.status === 422) {
        throw new Error('VALIDATION');
      }
      if (response.status === 429) {
        throw new Error('RATE_LIMITED');
      }
      throw new Error('NETWORK');
    }

    // Reset rate limiting on successful login
    this.resetRateLimit();

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

  // Rate limiting methods
  private static getRateLimitState(): RateLimitState {
    if (typeof window === 'undefined') return { attempts: 0, lastAttempt: 0, isLocked: false, lockUntil: 0 };
    
    const stored = localStorage.getItem(this.RATE_LIMIT_KEY);
    if (stored) {
      const state = JSON.parse(stored) as RateLimitState;
      // Check if lockout has expired
      if (state.isLocked && Date.now() > state.lockUntil) {
        this.resetRateLimit();
        return { attempts: 0, lastAttempt: 0, isLocked: false, lockUntil: 0 };
      }
      return state;
    }
    return { attempts: 0, lastAttempt: 0, isLocked: false, lockUntil: 0 };
  }

  private static saveRateLimitState(state: RateLimitState): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify(state));
  }

  private static isRateLimited(): boolean {
    const state = this.getRateLimitState();
    return state.isLocked;
  }

  private static updateRateLimit(failedAttempt: boolean): void {
    const state = this.getRateLimitState();
    
    if (failedAttempt) {
      const now = Date.now();
      state.attempts += 1;
      state.lastAttempt = now;
      
      if (state.attempts >= this.MAX_ATTEMPTS) {
        state.isLocked = true;
        state.lockUntil = now + this.LOCKOUT_DURATION;
      }
    }
    
    this.saveRateLimitState(state);
  }

  private static resetRateLimit(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.RATE_LIMIT_KEY);
  }

  // Get remaining lockout time in minutes
  static getLockoutTime(): number {
    const state = this.getRateLimitState();
    if (!state.isLocked) return 0;
    return Math.ceil((state.lockUntil - Date.now()) / 60000);
  }

  // Get remaining attempts
  static getRemainingAttempts(): number {
    const state = this.getRateLimitState();
    if (state.isLocked) return 0;
    return Math.max(0, this.MAX_ATTEMPTS - state.attempts);
  }
}

// Token management utilities
export class TokenManager {
  private static readonly TOKEN_KEY: string = 'authToken';
  private static readonly REFRESH_TOKEN_KEY: string = 'refreshToken';
  private static readonly TOKEN_EXPIRY_KEY: string = 'tokenExpiry';

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
    
    // Store tokens
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    
    // Store token expiry time
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiry.toString());
    } catch {
      // If we can't parse the token, remove the expiry time
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    }
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  static isTokenExpiringSoon(): boolean {
    if (typeof window === 'undefined') return false;
    
    const expiryStr = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiryStr) return true; // If we don't have expiry info, assume it's expiring
    
    const expiry = parseInt(expiryStr, 10);
    const now = Date.now();
    
    // Consider token expiring soon if it expires in less than 10 minutes
    return (expiry - now) < 10 * 60 * 1000;
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
        
        // Refresh 5 minutes before expiration or immediately if expiring soon
        const refreshTime: number = TokenManager.isTokenExpiringSoon() 
          ? 0 
          : Math.max(timeUntilExpiration - 5 * 60 * 1000, 0);

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
            // Call the authentication API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }

      const { user, token, refreshToken } = await response.json();
      
      // Store tokens and user data
      TokenManager.setTokens(token, refreshToken);
      setUser(user);
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
          case 'RATE_LIMITED':
            errorType = 'RATE_LIMITED';
            errorMessage = `Too many failed attempts. Please try again in ${AuthService.getLockoutTime()} minutes.`;
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

  // Demo login function
  const demoLogin = async (): Promise<void> => {
    updateLoading('loggingIn', true);
    setError(null);

    try {
      // For demo purposes, we'll create a mock user and token
      // Check if we want to demo as admin
      const urlParams = new URLSearchParams(window.location.search);
      const isDemoAdmin = urlParams.get('admin') === 'true';
      const isDemoLogger = urlParams.get('logger') === 'true' || !isDemoAdmin;
      
      // Allow role override from URL params for more flexible testing
      const roleFromParams = urlParams.get('role') as User['role'] | null;
      const demoRole = roleFromParams || (isDemoAdmin ? 'admin' : (isDemoLogger ? 'logger' : 'user'));

      const demoUser: User = {
        id: `demo-${demoRole}-id`,
        name: `Demo ${demoRole.charAt(0).toUpperCase() + demoRole.slice(1)}`,
        email: `${demoRole}@demo.com`,
        role: demoRole, // Set role based on URL param
        image: isDemoAdmin 
          ? `https://i.pravatar.cc/300?u=${process.env.NEXT_PUBLIC_ADMIN_DEFAULT_EMAIL || 'admin@demo.com'}` 
          : (isDemoLogger ? `https://i.pravatar.cc/300?u=${process.env.NEXT_PUBLIC_LOGGER_DEFAULT_EMAIL || 'logger@demo.com'}` : 'https://i.pravatar.cc/300?u=demo@example.com'),
        managedLoggers: isDemoAdmin ? ['demo-logger-1', 'demo-logger-2'] : undefined,
        adminLevel: isDemoAdmin ? 'basic' : undefined,
        assignedCompetitions: isDemoLogger ? ['demo-competition-1', 'demo-competition-2'] : undefined,
        permissions: isDemoLogger ? ['log_matches', 'log_events', 'view_stats'] : (isDemoAdmin ? ['manage_loggers', 'view_reports', 'manage_competitions'] : [])
      };
    
      // Create a mock token (in a real app, this would come from the server)
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ 
        sub: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        role: demoUser.role,
        managedLoggers: isDemoAdmin ? ['demo-logger-1', 'demo-logger-2'] : undefined,
        adminLevel: isDemoAdmin ? 'basic' : undefined,
        assignedCompetitions: isDemoLogger ? ['demo-competition-1', 'demo-competition-2'] : undefined,
        permissions: isDemoLogger ? ['log_matches', 'log_events', 'view_stats'] : (isDemoAdmin ? ['manage_loggers', 'view_reports', 'manage_competitions'] : []),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000)
      }));
      const signature = 'demo-signature';
      const demoToken = `${header}.${payload}.${signature}`;
    
      const demoRefreshToken = 'demo-refresh-token';
    
      TokenManager.setTokens(demoToken, demoRefreshToken);
      setUser(demoUser);
    } catch (err) {
      let errorMessage = 'Failed to log in with demo account.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(createError('UNKNOWN', errorMessage));
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
    demoLogin,
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

// Hook to check if user needs onboarding
export const useRequireOnboarding = (): { 
  user: User | null; 
  isAuthenticated: boolean; 
  hasCompletedOnboarding: boolean;
  isLoading: boolean 
} => {
  const { user, loading, isAuthenticated } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('hasCompletedOnboarding') === 'true';
      setHasCompletedOnboarding(completed);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);
  
  return { 
    user, 
    isAuthenticated, 
    hasCompletedOnboarding,
    isLoading: loading.initializing || isLoading
  };
};

// Logger-specific authentication hook
export const useLoggerAuth = (): { 
  user: User | null; 
  isAuthenticated: boolean; 
  isLogger: boolean;
  isLoading: boolean;
  hasLoggerPermissions: boolean;
} => {
  const { user, loading } = useAuth();
  
  // Check if user has logger permissions
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
