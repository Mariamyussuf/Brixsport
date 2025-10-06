"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { adminService, ensureLoggerType } from '@/lib/adminService';
import { Logger } from '@/lib/adminService';
import { useAuth } from '@/hooks/useAuth';
import type { AdminUser } from '@/types/admin';
import { useRouter } from 'next/navigation';

// Import logger types for admin to perform logger functions
import type { LoggerMatch, LoggerCompetition } from '@/lib/adminService';

// Admin context state
interface AdminState {
  loggers: Logger[];
  selectedLogger: Logger | null;
  loading: {
    loggers: boolean;
    logger: boolean;
  };
  error: string | null;
  adminUser: AdminUser | null;
  // Logger functionality for admins
  competitions: LoggerCompetition[];
  matches: LoggerMatch[];
  selectedCompetition: LoggerCompetition | null;
  selectedMatch: LoggerMatch | null;
}

// Admin context actions
type AdminAction =
  | { type: 'SET_LOGGERS'; payload: Logger[] }
  | { type: 'SET_SELECTED_LOGGER'; payload: Logger | null }
  | { type: 'SET_LOADING'; payload: { key: keyof AdminState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_ADMIN_USER'; payload: AdminUser | null }
  | { type: 'RESET' }
  // Logger actions for admins
  | { type: 'SET_COMPETITIONS'; payload: LoggerCompetition[] }
  | { type: 'SET_MATCHES'; payload: LoggerMatch[] }
  | { type: 'SET_SELECTED_COMPETITION'; payload: LoggerCompetition | null }
  | { type: 'SET_SELECTED_MATCH'; payload: LoggerMatch | null };

// Initial state
const initialState: AdminState = {
  loggers: [],
  selectedLogger: null,
  loading: {
    loggers: false,
    logger: false
  },
  error: null,
  adminUser: null,
  // Logger functionality for admins
  competitions: [],
  matches: [],
  selectedCompetition: null,
  selectedMatch: null
};

// Admin reducer
function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'SET_LOGGERS':
      return { ...state, loggers: action.payload };
    
    case 'SET_SELECTED_LOGGER':
      return { ...state, selectedLogger: action.payload };
    
    case 'SET_LOADING':
      return { 
        ...state, 
        loading: { ...state.loading, [action.payload.key]: action.payload.value } 
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'SET_ADMIN_USER':
      return { ...state, adminUser: action.payload };
    
    case 'RESET':
      return initialState;
    
    // Logger actions for admins
    case 'SET_COMPETITIONS':
      return { ...state, competitions: action.payload };
    
    case 'SET_MATCHES':
      return { ...state, matches: action.payload };
    
    case 'SET_SELECTED_COMPETITION':
      return { ...state, selectedCompetition: action.payload };
    
    case 'SET_SELECTED_MATCH':
      return { ...state, selectedMatch: action.payload };
    
    default:
      return state;
  }
}

// Admin context
interface AdminContextType extends AdminState {
  loadLoggers: () => Promise<void>;
  selectLogger: (logger: Logger | null) => void;
  createLogger: (loggerData: Omit<Logger, 'id' | 'createdAt' | 'lastActive'>) => Promise<void>;
  updateLogger: (loggerId: string, updates: Partial<Logger>) => Promise<void>;
  deleteLogger: (loggerId: string) => Promise<void>;
  suspendLogger: (loggerId: string) => Promise<void>;
  activateLogger: (loggerId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
  setAdminUser: (user: AdminUser | null) => void;
  logout: () => void;
  // Logger functionality for admins
  loadLoggerCompetitions: () => Promise<void>;
  loadLoggerMatches: () => Promise<void>;
  createLoggerMatch: (matchData: Omit<LoggerMatch, 'id' | 'events' | 'loggerId' | 'lastUpdated'>) => Promise<void>;
  updateLoggerMatch: (matchId: string, updates: Partial<LoggerMatch>) => Promise<void>;
  addLoggerEvent: (matchId: string, event: any) => Promise<void>;
  generateLoggerReport: (matchId: string) => Promise<void>;
  selectCompetition: (competition: LoggerCompetition | null) => void;
  selectMatch: (match: LoggerMatch | null) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Admin provider props
interface AdminProviderProps {
  children: ReactNode;
  currentAdmin?: AdminUser | null;
}

// Admin provider component
export const AdminProvider: React.FC<AdminProviderProps> = ({ children, currentAdmin = null }) => {
  const [state, dispatch] = useReducer(adminReducer, { ...initialState, adminUser: currentAdmin });
  const { user, isAuthenticated, logout: authLogout } = useAuth();
  const router = useRouter();
  
  // Set auth token in admin service
  useEffect(() => {
    if (user && user.role === 'admin') {
      // In a real app, you would get the token from auth context
      // adminService.setAuthToken(token);
    } else {
      adminService.setAuthToken(null);
    }
  }, [user]);

  // Load loggers when admin is authenticated
  useEffect(() => {
    if (state.adminUser) {
      loadLoggers();
    } else {
      // Reset state when user logs out or is not admin
      dispatch({ type: 'RESET' });
    }
  }, [state.adminUser]);
  
  // Load loggers
  const loadLoggers = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'loggers', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Call the adminService to fetch real data
      const response = await adminService.getLoggers();
      if (response.success && response.data) {
        // Ensure all logger data is properly typed
        const typedLoggers = response.data.map(ensureLoggerType);
        dispatch({ type: 'SET_LOGGERS', payload: typedLoggers });
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to load loggers');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load loggers';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'loggers', value: false } });
    }
  };
  
  // Select logger
  const selectLogger = (logger: Logger | null): void => {
    dispatch({ type: 'SET_SELECTED_LOGGER', payload: logger });
  };
  
  // Create logger
  const createLogger = async (loggerData: Omit<Logger, 'id' | 'createdAt' | 'lastActive'>): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Call the adminService to create a logger
      const response = await adminService.createLogger(loggerData);
      if (response.success && response.data) {
        // Add new logger to the list
        dispatch({ type: 'SET_LOGGERS', payload: [...state.loggers, response.data] });
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to create logger');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create logger';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: false } });
    }
  };
  
  // Update logger
  const updateLogger = async (loggerId: string, updates: Partial<Logger>): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Call the adminService to update a logger
      const response = await adminService.updateLogger(loggerId, updates);
      if (response.success && response.data) {
        // Update logger in the list
        const updatedLoggers = state.loggers.map(logger => 
          logger.id === loggerId ? { ...logger, ...response.data } : logger
        );
        dispatch({ type: 'SET_LOGGERS', payload: updatedLoggers });
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to update logger');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update logger';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: false } });
    }
  };
  
  // Delete logger
  const deleteLogger = async (loggerId: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Call the adminService to delete a logger
      const response = await adminService.deleteLogger(loggerId);
      if (response.success) {
        // Remove logger from the list
        const updatedLoggers = state.loggers.filter(logger => logger.id !== loggerId);
        dispatch({ type: 'SET_LOGGERS', payload: updatedLoggers });
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to delete logger');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete logger';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: false } });
    }
  };
  
  // Suspend logger
  const suspendLogger = async (loggerId: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Call the adminService to suspend a logger
      const response = await adminService.suspendLogger(loggerId);
      if (response.success && response.data) {
        // Update logger status in the list
        const updatedLoggers = state.loggers.map(logger => 
          logger.id === loggerId ? { ...logger, status: 'suspended' as const } : logger
        );
        dispatch({ type: 'SET_LOGGERS', payload: updatedLoggers });
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to suspend logger');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to suspend logger';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: false } });
    }
  };
  
  // Activate logger
  const activateLogger = async (loggerId: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Call the adminService to activate a logger
      const response = await adminService.activateLogger(loggerId);
      if (response.success && response.data) {
        // Update logger status in the list
        const updatedLoggers = state.loggers.map(logger => 
          logger.id === loggerId ? { ...logger, status: 'active' as const } : logger
        );
        dispatch({ type: 'SET_LOGGERS', payload: updatedLoggers });
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to activate logger');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to activate logger';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: false } });
    }
  };
  
  // Logger functionality for admins
  
  // Load competitions
  const loadLoggerCompetitions = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Call the adminService to fetch competitions
      const response = await adminService.getLoggerCompetitions();
      if (response.success && response.data) {
        dispatch({ type: 'SET_COMPETITIONS', payload: response.data });
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to load competitions');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load competitions';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: false } });
    }
  };
  
  // Load matches
  const loadLoggerMatches = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Call the adminService to fetch matches
      const response = await adminService.getLoggerMatches();
      if (response.success && response.data) {
        dispatch({ type: 'SET_MATCHES', payload: response.data });
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to load matches');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load matches';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: false } });
    }
  };
  
  // Create match
  const createLoggerMatch = async (matchData: Omit<LoggerMatch, 'id' | 'events' | 'loggerId' | 'lastUpdated'>): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Call the adminService to create a match
      const response = await adminService.createLoggerMatch(matchData);
      if (response.success && response.data) {
        // Add new match to the list
        dispatch({ type: 'SET_MATCHES', payload: [...state.matches, response.data] });
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to create match');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create match';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: false } });
    }
  };
  
  // Update match
  const updateLoggerMatch = async (matchId: string, updates: Partial<LoggerMatch>): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Call the adminService to update a match
      const response = await adminService.updateLoggerMatch(matchId, updates);
      if (response.success && response.data) {
        // Update match in the list
        const updatedMatches = state.matches.map(match => 
          match.id === matchId ? { ...match, ...response.data } : match
        );
        dispatch({ type: 'SET_MATCHES', payload: updatedMatches });
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to update match');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update match';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: false } });
    }
  };
  
  // Add event to match
  const addLoggerEvent = async (matchId: string, event: any): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Call the adminService to add an event
      const response = await adminService.addLoggerEvent(matchId, event);
      if (response.success && response.data) {
        // Update match in the list
        const updatedMatches = state.matches.map(match => 
          match.id === matchId ? response.data : match
        );
        dispatch({ type: 'SET_MATCHES', payload: updatedMatches });
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to add event');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add event';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: false } });
    }
  };
  
  // Generate report
  const generateLoggerReport = async (matchId: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Call the adminService to generate a report
      const response = await adminService.generateLoggerReport(matchId);
      if (response.success && response.data) {
        // Report generated successfully
        // You might want to do something with the report data here
      } else {
        throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to generate report');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate report';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: false } });
    }
  };
  
  // Select competition
  const selectCompetition = (competition: LoggerCompetition | null): void => {
    dispatch({ type: 'SET_SELECTED_COMPETITION', payload: competition });
  };
  
  // Select match
  const selectMatch = (match: LoggerMatch | null): void => {
    dispatch({ type: 'SET_SELECTED_MATCH', payload: match });
  };
  
  // Clear error
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };
  
  // Reset state
  const reset = (): void => {
    dispatch({ type: 'RESET' });
  };
  
  // Context value
  const value: AdminContextType = {
    ...state,
    loadLoggers,
    selectLogger,
    createLogger,
    updateLogger,
    deleteLogger,
    suspendLogger,
    activateLogger,
    clearError,
    reset,
    setAdminUser: (user: AdminUser | null) => dispatch({ type: 'SET_ADMIN_USER', payload: user }),
    logout: () => {
      authLogout();
      dispatch({ type: 'RESET' });
      // Redirect to admin login page on the same domain
      if (typeof window !== 'undefined') {
        const currentHost = window.location.hostname;
        // For localhost development, stay on the same host
        if (currentHost.startsWith('localhost') || currentHost.includes('vercel.app')) {
          router.push('/admin/login');
        } else {
          // For production, redirect to the admin subdomain
          window.location.href = 'https://admin.brixsports.com/admin/login';
        }
      } else {
        router.push('/admin/login');
      }
    },
    // Logger functionality for admins
    loadLoggerCompetitions,
    loadLoggerMatches,
    createLoggerMatch,
    updateLoggerMatch,
    addLoggerEvent,
    generateLoggerReport,
    selectCompetition,
    selectMatch
  };
  
  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

// Custom hook to use admin context
export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export default AdminContext;