"use client";

import React, { 
  createContext, 
  useState, 
  useContext, 
  ReactNode, 
  useEffect, 
  useCallback 
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';


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
export interface AuthContextType {
  user: User | null;
  loading: LoadingStates;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<void>;
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
        // Get current Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        if (session?.user) {
          // Transform Supabase user to our User type
          const transformedUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: session.user.user_metadata?.role || 'user',
            image: session.user.user_metadata?.avatar_url,
            assignedCompetitions: session.user.user_metadata?.assignedCompetitions,
            permissions: session.user.user_metadata?.permissions,
            managedLoggers: session.user.user_metadata?.managedLoggers,
            adminLevel: session.user.user_metadata?.adminLevel,
          };

          if (isMounted) {
            setUser(transformedUser);
            TokenManager.setTokens(session.access_token, session.refresh_token);
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const transformedUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: session.user.user_metadata?.role || 'user',
            image: session.user.user_metadata?.avatar_url,
            assignedCompetitions: session.user.user_metadata?.assignedCompetitions,
            permissions: session.user.user_metadata?.permissions,
            managedLoggers: session.user.user_metadata?.managedLoggers,
            adminLevel: session.user.user_metadata?.adminLevel,
          };
          setUser(transformedUser);
          TokenManager.setTokens(session.access_token, session.refresh_token);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          TokenManager.clearTokens();
        }
      }
    );

    // Cleanup function
    return (): void => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [createError, updateLoading]);

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
  const login = async (credentials: { email: string; password: string }): Promise<void> => {
    updateLoading('loggingIn', true);
    setError(null);

    try {
      // Use the real login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      // Sign in with Supabase using the token from our backend
      const { data: supabaseData, error: supabaseError } = await supabase.auth.setSession({
        access_token: data.data.token,
        refresh_token: data.data.refreshToken,
      });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (supabaseData.session?.user) {
        // Transform Supabase user to our User type
        const transformedUser: User = {
          id: supabaseData.session.user.id,
          name: supabaseData.session.user.user_metadata?.name || supabaseData.session.user.email?.split('@')[0] || 'User',
          email: supabaseData.session.user.email || '',
          role: supabaseData.session.user.user_metadata?.role || 'user',
          image: supabaseData.session.user.user_metadata?.avatar_url,
          assignedCompetitions: supabaseData.session.user.user_metadata?.assignedCompetitions,
          permissions: supabaseData.session.user.user_metadata?.permissions,
          managedLoggers: supabaseData.session.user.user_metadata?.managedLoggers,
          adminLevel: supabaseData.session.user.user_metadata?.adminLevel,
        };
        setUser(transformedUser);
        TokenManager.setTokens(data.data.token, data.data.refreshToken);
      }
    } catch (err) {
      let errorMessage = 'Failed to log in.';
      
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
  const logout = useCallback(async (): Promise<void> => {
    try {
      // Call backend logout endpoint
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TokenManager.getToken()}`
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
      
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      TokenManager.clearTokens();
      setUser(null);
      setError(null);
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