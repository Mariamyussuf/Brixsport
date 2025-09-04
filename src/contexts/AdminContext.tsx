"use client";


import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { adminService } from '@/lib/adminService';
import { Logger } from '@/lib/adminService';
import { useAuth } from '@/hooks/useAuth';
import type { AdminUser } from '@/lib/adminAuth';

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
}

// Admin context actions
type AdminAction =
  | { type: 'SET_LOGGERS'; payload: Logger[] }
  | { type: 'SET_SELECTED_LOGGER'; payload: Logger | null }
  | { type: 'SET_LOADING'; payload: { key: keyof AdminState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_ADMIN_USER'; payload: AdminUser | null }
  | { type: 'RESET' };

// Initial state
const initialState: AdminState = {
  loggers: [],
  selectedLogger: null,
  loading: {
    loggers: false,
    logger: false
  },
  error: null,
  adminUser: null
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
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Admin provider props
interface AdminProviderProps {
  children: ReactNode;
  currentAdmin?: AdminUser | null;
}

// Admin provider component
export const AdminProvider: React.FC<AdminProviderProps> = ({ children, currentAdmin = null }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  
  // Set auth token in admin service
  useEffect(() => {
    if (user && user.role === 'admin') {
      // In a real app, you would get the token from auth context
      // adminService.setAuthToken(token);
    } else {
      adminService.setAuthToken(null);
    }
  }, [user]);

  // Initialize verified admin user provided by server layout
  useEffect(() => {
    dispatch({ type: 'SET_ADMIN_USER', payload: currentAdmin });
  }, [currentAdmin]);
  
  // Load loggers when admin is authenticated
  useEffect(() => {
    if (isAuthenticated && user && user.role === 'admin') {
      loadLoggers();
    } else {
      // Reset state when user logs out or is not admin
      dispatch({ type: 'RESET' });
    }
  }, [isAuthenticated, user]);
  
  // Load loggers
  const loadLoggers = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: { key: 'loggers', value: true } });
    dispatch({ type: 'CLEAR_ERROR' });
    
    try {
      // In a real app, this would call the adminService
      // const response = await adminService.getLoggers();
      // if (response.success && response.data) {
      //   dispatch({ type: 'SET_LOGGERS', payload: response.data });
      // } else {
      //   throw new Error(response.error || 'Failed to load loggers');
      // }
      
      // Mock data for now
      const mockLoggers: Logger[] = [
        {
          id: '1',
          name: 'John Smith',
          email: 'john.smith@example.com',
          role: 'senior-logger',
          status: 'active',
          assignedCompetitions: ['1', '2'],
          createdAt: '2023-01-15T10:30:00Z',
          lastActive: '2023-10-15T14:22:00Z'
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          email: 'sarah.j@example.com',
          role: 'logger',
          status: 'active',
          assignedCompetitions: ['3'],
          createdAt: '2023-03-22T09:15:00Z',
          lastActive: '2023-10-15T12:45:00Z'
        },
        {
          id: '3',
          name: 'Mike Wilson',
          email: 'mike.w@example.com',
          role: 'logger',
          status: 'inactive',
          assignedCompetitions: [],
          createdAt: '2023-05-10T11:20:00Z',
          lastActive: '2023-09-28T16:30:00Z'
        }
      ];
      
      dispatch({ type: 'SET_LOGGERS', payload: mockLoggers });
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
      // In a real app, this would call the adminService
      // const response = await adminService.createLogger(loggerData);
      // if (response.success && response.data) {
      //   // Add new logger to the list
      //   dispatch({ type: 'SET_LOGGERS', payload: [...state.loggers, response.data] });
      // } else {
      //   throw new Error(response.error || 'Failed to create logger');
      // }
      
      // Mock implementation
      console.log('Creating logger:', loggerData);
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
      // In a real app, this would call the adminService
      // const response = await adminService.updateLogger(loggerId, updates);
      // if (response.success && response.data) {
      //   // Update logger in the list
      //   const updatedLoggers = state.loggers.map(logger => 
      //     logger.id === loggerId ? { ...logger, ...response.data } : logger
      //   );
      //   dispatch({ type: 'SET_LOGGERS', payload: updatedLoggers });
      // } else {
      //   throw new Error(response.error || 'Failed to update logger');
      // }
      
      // Mock implementation
      console.log('Updating logger:', loggerId, updates);
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
      // In a real app, this would call the adminService
      // const response = await adminService.deleteLogger(loggerId);
      // if (response.success) {
      //   // Remove logger from the list
      //   const updatedLoggers = state.loggers.filter(logger => logger.id !== loggerId);
      //   dispatch({ type: 'SET_LOGGERS', payload: updatedLoggers });
      // } else {
      //   throw new Error(response.error || 'Failed to delete logger');
      // }
      
      // Mock implementation
      console.log('Deleting logger:', loggerId);
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
      // In a real app, this would call the adminService
      // const response = await adminService.suspendLogger(loggerId);
      // if (response.success && response.data) {
      //   // Update logger status in the list
      //   const updatedLoggers = state.loggers.map(logger => 
      //     logger.id === loggerId ? { ...logger, status: 'suspended' } : logger
      //   );
      //   dispatch({ type: 'SET_LOGGERS', payload: updatedLoggers });
      // } else {
      //   throw new Error(response.error || 'Failed to suspend logger');
      // }
      
      // Mock implementation
      console.log('Suspending logger:', loggerId);
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
      // In a real app, this would call the adminService
      // const response = await adminService.activateLogger(loggerId);
      // if (response.success && response.data) {
      //   // Update logger status in the list
      //   const updatedLoggers = state.loggers.map(logger => 
      //     logger.id === loggerId ? { ...logger, status: 'active' } : logger
      //   );
      //   dispatch({ type: 'SET_LOGGERS', payload: updatedLoggers });
      // } else {
      //   throw new Error(response.error || 'Failed to activate logger');
      // }
      
      // Mock implementation
      console.log('Activating logger:', loggerId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to activate logger';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'logger', value: false } });
    }
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
    setAdminUser: (admin: AdminUser | null) => dispatch({ type: 'SET_ADMIN_USER', payload: admin })
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