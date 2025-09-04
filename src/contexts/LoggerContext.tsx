"use client";


import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { loggerService } from '@/lib/loggerService';
import { LoggerCompetition, LoggerMatch } from '@/lib/loggerService';
import { useLoggerAuth } from '@/hooks/useAuth';
import { useLoggerNotifications } from '@/hooks/useLoggerNotifications';

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
  const {
    sendMatchStartNotification,
    sendMatchFinishNotification,
    sendEventAddedNotification,
    sendSyncSuccessNotification,
    sendSyncErrorNotification,
    sendOfflineStatusNotification,
    sendOnlineStatusNotification,
    sendCompetitionAssignedNotification
  } = useLoggerNotifications();
  
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
      // In a real app, this would call the loggerService
      // const response = await loggerService.getCompetitions();
      // if (response.success && response.data) {
      //   dispatch({ type: 'SET_COMPETITIONS', payload: response.data });
      // } else {
      //   throw new Error(response.error || 'Failed to load competitions');
      // }
      
      // Mock data for now
      const mockCompetitions: LoggerCompetition[] = [
        {
          id: '1',
          name: 'Premier League 2023',
          sport: 'Football',
          startDate: '2023-08-01',
          endDate: '2024-05-31',
          status: 'active',
          assignedLoggers: ['logger-1', 'logger-2']
        },
        {
          id: '2',
          name: 'NBA Season 2023',
          sport: 'Basketball',
          startDate: '2023-10-01',
          endDate: '2024-06-30',
          status: 'active',
          assignedLoggers: ['logger-1']
        }
      ];
      
      dispatch({ type: 'SET_COMPETITIONS', payload: mockCompetitions });
      
      // Send notification for assigned competitions
      mockCompetitions.forEach(competition => {
        if (competition.assignedLoggers.includes('logger-1')) {
          sendCompetitionAssignedNotification(competition.name);
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load competitions';
      dispatch({ type: 'SET_ERROR', payload: message });
      sendSyncErrorNotification(message);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'competitions', value: false } });
    }
  };
  
  // Load matches for a competition
  const loadMatches = async (competitionId: string): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'matches', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // In a real app, this would call the loggerService
      // const response = await loggerService.getMatches(competitionId);
      // if (response.success && response.data) {
      //   dispatch({ type: 'SET_MATCHES', payload: response.data });
      // } else {
      //   throw new Error(response.error || 'Failed to load matches');
      // }
      
      // Mock data for now
      const mockMatches: LoggerMatch[] = [
        {
          id: '1',
          competitionId: '1',
          homeTeamId: 'team-1',
          awayTeamId: 'team-2',
          startTime: '2023-10-15T15:00:00Z',
          status: 'scheduled',
          events: [],
          loggerId: 'logger-1',
          lastUpdated: new Date().toISOString()
        }
      ];
      
      dispatch({ type: 'SET_MATCHES', payload: mockMatches });
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
    reset
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