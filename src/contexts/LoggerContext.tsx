"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { loggerService } from '@/lib/loggerService';
import { LoggerCompetition, LoggerMatch } from '@/lib/loggerService';
import { useLoggerAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/components/shared/NotificationsContext';
import { hasPermission } from '@/lib/loggerPermissions';

// Logger context state
interface LoggerState {
  competitions: LoggerCompetition[];
  selectedCompetition: LoggerCompetition | null;
  matches: LoggerMatch[];
  selectedMatch: LoggerMatch | null;
  loading: {
    competitions: boolean;
    matches: boolean;
    match: boolean;
  };
  error: string | null;
}

// Logger context actions
type LoggerAction =
  | { type: 'SET_COMPETITIONS'; payload: LoggerCompetition[] }
  | { type: 'SET_SELECTED_COMPETITION'; payload: LoggerCompetition | null }
  | { type: 'SET_MATCHES'; payload: LoggerMatch[] }
  | { type: 'SET_SELECTED_MATCH'; payload: LoggerMatch | null }
  | { type: 'SET_LOADING'; payload: { key: keyof LoggerState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

// Initial state
const initialState: LoggerState = {
  competitions: [],
  selectedCompetition: null,
  matches: [],
  selectedMatch: null,
  loading: {
    competitions: false,
    matches: false,
    match: false
  },
  error: null
};

// Logger reducer
function loggerReducer(state: LoggerState, action: LoggerAction): LoggerState {
  switch (action.type) {
    case 'SET_COMPETITIONS':
      return { ...state, competitions: action.payload };
    
    case 'SET_SELECTED_COMPETITION':
      return { ...state, selectedCompetition: action.payload };
    
    case 'SET_MATCHES':
      return { ...state, matches: action.payload };
    
    case 'SET_SELECTED_MATCH':
      return { ...state, selectedMatch: action.payload };
    
    case 'SET_LOADING':
      return { 
        ...state, 
        loading: { ...state.loading, [action.payload.key]: action.payload.value } 
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

// Logger context
interface LoggerContextType extends LoggerState {
  loadCompetitions: () => Promise<void>;
  loadMatches: (competitionId: string) => Promise<void>;
  selectCompetition: (competition: LoggerCompetition | null) => void;
  selectMatch: (match: LoggerMatch | null) => void;
  clearError: () => void;
  reset: () => void;
  // Permission checking methods
  canLogMatches: boolean;
  canEditMatches: boolean;
  canDeleteMatches: boolean;
  canViewAllMatches: boolean;
  canLogEvents: boolean;
  canEditEvents: boolean;
  canDeleteEvents: boolean;
  canViewAllEvents: boolean;
  canManagePlayers: boolean;
  canEditPlayers: boolean;
  canViewPlayers: boolean;
  canManageCompetitions: boolean;
  canAssignCompetitions: boolean;
  canViewCompetitions: boolean;
  canManageTeams: boolean;
  canEditTeams: boolean;
  canViewTeams: boolean;
  canViewReports: boolean;
  canExportReports: boolean;
  canGenerateReports: boolean;
  canViewSystemLogs: boolean;
  canManageSettings: boolean;
  canViewAuditTrail: boolean;
}

const LoggerContext = createContext<LoggerContextType | undefined>(undefined);

// Logger provider props
interface LoggerProviderProps {
  children: ReactNode;
}

// Logger provider component
export const LoggerProvider: React.FC<LoggerProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(loggerReducer, initialState);
  const { user, isAuthenticated } = useLoggerAuth();
  const { addNotification } = useNotifications();
  const canLogMatches = user ? hasPermission(user.role, 'log_matches') : false;
  const canEditMatches = user ? hasPermission(user.role, 'edit_matches') : false;
  const canDeleteMatches = user ? hasPermission(user.role, 'delete_matches') : false;
  const canViewAllMatches = user ? hasPermission(user.role, 'view_all_matches') : false;
  const canLogEvents = user ? hasPermission(user.role, 'log_events') : false;
  const canEditEvents = user ? hasPermission(user.role, 'edit_events') : false;
  const canDeleteEvents = user ? hasPermission(user.role, 'delete_events') : false;
  const canViewAllEvents = user ? hasPermission(user.role, 'view_all_events') : false;
  const canManagePlayers = user ? hasPermission(user.role, 'manage_players') : false;
  const canEditPlayers = user ? hasPermission(user.role, 'edit_players') : false;
  const canViewPlayers = user ? hasPermission(user.role, 'view_players') : false;
  const canManageCompetitions = user ? hasPermission(user.role, 'manage_competitions') : false;
  const canAssignCompetitions = user ? hasPermission(user.role, 'assign_competitions') : false;
  const canViewCompetitions = user ? hasPermission(user.role, 'view_competitions') : false;
  const canManageTeams = user ? hasPermission(user.role, 'manage_teams') : false;
  const canEditTeams = user ? hasPermission(user.role, 'edit_teams') : false;
  const canViewTeams = user ? hasPermission(user.role, 'view_teams') : false;
  const canViewReports = user ? hasPermission(user.role, 'view_reports') : false;
  const canExportReports = user ? hasPermission(user.role, 'export_reports') : false;
  const canGenerateReports = user ? hasPermission(user.role, 'generate_reports') : false;
  const canViewSystemLogs = user ? hasPermission(user.role, 'view_system_logs') : false;
  const canManageSettings = user ? hasPermission(user.role, 'manage_settings') : false;
  const canViewAuditTrail = user ? hasPermission(user.role, 'view_audit_trail') : false;
  
  // Load competitions when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCompetitions();
    } else {
      // Reset state when user logs out
      dispatch({ type: 'RESET' });
    }
  }, [isAuthenticated, user]);
  
  // Set auth token in logger service
  useEffect(() => {
    if (user) {
      // In a real app, you would get the token from auth context
      // loggerService.setAuthToken(token);
    } else {
      loggerService.setAuthToken(null);
    }
  }, [user]);
  
  // Load competitions
  const loadCompetitions = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'competitions', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Always call the loggerService to fetch real data
      const response = await loggerService.getCompetitions();
      if (response.success && response.data) {
        dispatch({ type: 'SET_COMPETITIONS', payload: response.data });
        
        // Send notification for assigned competitions
        response.data.forEach(competition => {
          if (competition.assignedLoggers.includes(user?.id || '')) {
            addNotification({
              title: 'New Competition Assigned',
              message: `You have been assigned to log events for ${competition.name}`,
              type: 'SYSTEM_ALERT',
              category: 'match',
              priority: 'NORMAL',
              source: 'SYSTEM',
              userId: user?.id || '',
            } as any);
          }
        });
      } else {
        throw new Error(response.error || 'Failed to load competitions');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load competitions';
      dispatch({ type: 'SET_ERROR', payload: message });
      addNotification({
        title: 'Sync Failed',
        message: `Failed to load competitions: ${message}.`,
        type: 'SYSTEM_ALERT',
        category: 'match',
        priority: 'HIGH',
        source: 'SYSTEM',
        userId: user?.id || '',
      } as any);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'competitions', value: false } });
    }
  };
  
  // Load matches for a competition
  const loadMatches = async (competitionId: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'matches', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // Always call the loggerService to fetch real data
      const response = await loggerService.getMatches(competitionId);
      if (response.success && response.data) {
        dispatch({ type: 'SET_MATCHES', payload: response.data });
      } else {
        throw new Error(response.error || 'Failed to load matches');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load matches';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'matches', value: false } });
    }
  };
  
  // Select competition
  const selectCompetition = (competition: LoggerCompetition | null): void => {
    dispatch({ type: 'SET_SELECTED_COMPETITION', payload: competition });
    
    // If selecting a competition, load its matches
    if (competition) {
      loadMatches(competition.id);
    } else {
      // Clear matches when deselecting competition
      dispatch({ type: 'SET_MATCHES', payload: [] });
    }
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
  const value: LoggerContextType = {
    ...state,
    loadCompetitions,
    loadMatches,
    selectCompetition,
    selectMatch,
    clearError,
    reset,
    // Permission checking methods
    canLogMatches,
    canEditMatches,
    canDeleteMatches,
    canViewAllMatches,
    canLogEvents,
    canEditEvents,
    canDeleteEvents,
    canViewAllEvents,
    canManagePlayers,
    canEditPlayers,
    canViewPlayers,
    canManageCompetitions,
    canAssignCompetitions,
    canViewCompetitions,
    canManageTeams,
    canEditTeams,
    canViewTeams,
    canViewReports,
    canExportReports,
    canGenerateReports,
    canViewSystemLogs,
    canManageSettings,
    canViewAuditTrail
  };
  
  return (
    <LoggerContext.Provider value={value}>
      {children}
    </LoggerContext.Provider>
  );
};

// Custom hook to use logger context
export const useLogger = (): LoggerContextType => {
  const context = useContext(LoggerContext);
  if (context === undefined) {
    throw new Error('useLogger must be used within a LoggerProvider');
  }
  return context;
};

export default LoggerContext;