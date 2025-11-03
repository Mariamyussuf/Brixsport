// Backend API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const API_V1_URL = `${API_BASE_URL}/v1`;

// Logging utility
const logOperation = (operation: string, details: any = {}) => {
  if (typeof window !== 'undefined' && window.console) {
    console.log(`[DatabaseService] ${operation}`, details);
  }
};

// Custom error classes for better error handling
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string = 'DATABASE_ERROR',
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Import the JWT verification function
import { verifyUnifiedToken } from './authService';

// Helper function to make authenticated API calls with enhanced error handling
const apiCall = async (endpoint: string, options: RequestInit = {}, requiredRole?: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const startTime = Date.now();
  
  // Log the operation
  logOperation('API_CALL_START', { endpoint, method: options.method || 'GET', requiredRole });
  
  // Check authentication for non-public endpoints
  const requiresAuth = !endpoint.startsWith('/public');
  if (requiresAuth && !token) {
    logOperation('API_CALL_AUTH_ERROR', { endpoint, error: 'Authentication token is required' });
    throw new AuthenticationError('Authentication token is required for this operation');
  }
  
  // If a specific role is required, check it
  if (requiredRole && token) {
    try {
      // Decode the JWT token and check the user's role
      const user = await verifyUnifiedToken(token);
      if (!user) {
        logOperation('API_CALL_AUTH_ERROR', { endpoint, error: 'Invalid authentication token' });
        throw new AuthenticationError('Invalid authentication token');
      }
      
      // Check if user has the required role
      if (requiredRole === 'admin' && user.role !== 'admin' && user.role !== 'super-admin') {
        logOperation('API_CALL_AUTH_ERROR', { endpoint, error: 'Insufficient permissions' });
        throw new AuthenticationError('Insufficient permissions');
      } else if (requiredRole === 'logger' && user.role !== 'logger' && user.role !== 'admin' && user.role !== 'super-admin') {
        logOperation('API_CALL_AUTH_ERROR', { endpoint, error: 'Insufficient permissions' });
        throw new AuthenticationError('Insufficient permissions');
      }
    } catch (error) {
      logOperation('API_CALL_AUTH_ERROR', { endpoint, error: 'Invalid authentication token' });
      throw new AuthenticationError('Invalid authentication token');
    }
  }
  
  try {
    const response = await fetch(`${API_V1_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `API call failed: ${response.status} ${response.statusText}`;
      
      logOperation('API_CALL_ERROR', { 
        endpoint, 
        method: options.method || 'GET', 
        status: response.status, 
        duration,
        error: errorMessage 
      });
      
      // Map HTTP status codes to specific error types
      switch (response.status) {
        case 400:
          throw new ValidationError(errorMessage, 'request');
        case 401:
          throw new AuthenticationError(errorMessage);
        case 403:
          throw new DatabaseError(errorMessage, 'FORBIDDEN', 403);
        case 404:
          throw new DatabaseError(errorMessage, 'NOT_FOUND', 404);
        case 409:
          throw new DatabaseError(errorMessage, 'CONFLICT', 409);
        case 422:
          throw new ValidationError(errorMessage, 'validation');
        default:
          throw new DatabaseError(errorMessage, 'API_ERROR', response.status);
      }
    }
    
    const data = await response.json();
    
    logOperation('API_CALL_SUCCESS', { 
      endpoint, 
      method: options.method || 'GET', 
      status: response.status, 
      duration,
      dataSize: JSON.stringify(data).length 
    });

    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Re-throw our custom errors
    if (error instanceof DatabaseError || error instanceof ValidationError || error instanceof AuthenticationError) {
      logOperation('API_CALL_EXCEPTION', { 
        endpoint, 
        method: options.method || 'GET', 
        duration,
        error: error.name, 
        message: error.message 
      });
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      logOperation('API_CALL_NETWORK_ERROR', { 
        endpoint, 
        method: options.method || 'GET', 
        duration,
        error: error.message 
      });
      throw new DatabaseError('Network error: Unable to connect to the server', 'NETWORK_ERROR', 503);
    }
    
    // Handle unexpected errors
    logOperation('API_CALL_UNEXPECTED_ERROR', { 
      endpoint, 
      method: options.method || 'GET', 
      duration,
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw new DatabaseError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'UNEXPECTED_ERROR');
  }
};

// Enhanced validation utilities
const validate = {
  // Validate string fields
  string: (value: any, fieldName: string, options: { required?: boolean; minLength?: number; maxLength?: number; pattern?: RegExp } = {}): string => {
    const { required = true, minLength, maxLength, pattern } = options;
    
    // Check if required
    if (required && (value === undefined || value === null || value === '')) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    
    // Skip validation for optional empty values
    if (!required && (value === undefined || value === null || value === '')) {
      return value;
    }
    
    // Convert to string
    const strValue = String(value);
    
    // Check minimum length
    if (minLength !== undefined && strValue.length < minLength) {
      throw new ValidationError(`${fieldName} must be at least ${minLength} characters long`, fieldName);
    }
    
    // Check maximum length
    if (maxLength !== undefined && strValue.length > maxLength) {
      throw new ValidationError(`${fieldName} must be no more than ${maxLength} characters long`, fieldName);
    }
    
    // Check pattern
    if (pattern && !pattern.test(strValue)) {
      throw new ValidationError(`${fieldName} format is invalid`, fieldName);
    }
    
    return strValue;
  },
  
  // Validate email
  email: (email: any): string => {
    const emailStr = validate.string(email, 'Email', { required: true });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      throw new ValidationError('Invalid email format', 'email');
    }
    return emailStr;
  },
  
  // Validate numeric fields
  number: (value: any, fieldName: string, options: { required?: boolean; min?: number; max?: number; integer?: boolean } = {}): number => {
    const { required = true, min, max, integer = false } = options;
    
    // Check if required
    if (required && (value === undefined || value === null)) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    
    // Skip validation for optional undefined values
    if (!required && (value === undefined || value === null)) {
      return value;
    }
    
    // Convert to number
    const numValue = Number(value);
    
    // Check if it's a valid number
    if (isNaN(numValue)) {
      throw new ValidationError(`${fieldName} must be a valid number`, fieldName);
    }
    
    // Check if it should be an integer
    if (integer && !Number.isInteger(numValue)) {
      throw new ValidationError(`${fieldName} must be a whole number`, fieldName);
    }
    
    // Check minimum value
    if (min !== undefined && numValue < min) {
      throw new ValidationError(`${fieldName} must be at least ${min}`, fieldName);
    }
    
    // Check maximum value
    if (max !== undefined && numValue > max) {
      throw new ValidationError(`${fieldName} must be no more than ${max}`, fieldName);
    }
    
    return numValue;
  },
  
  // Validate array
  array: <T>(value: any, fieldName: string, options: { required?: boolean; minLength?: number; maxLength?: number } = {}): T[] => {
    const { required = true, minLength, maxLength } = options;
    
    // Check if required
    if (required && (!Array.isArray(value) || value.length === 0)) {
      throw new ValidationError(`${fieldName} is required and must be an array`, fieldName);
    }
    
    // Skip validation for optional empty values
    if (!required && (!Array.isArray(value) || value.length === 0)) {
      return [];
    }
    
    // Check if it's an array
    if (!Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an array`, fieldName);
    }
    
    // Check minimum length
    if (minLength !== undefined && value.length < minLength) {
      throw new ValidationError(`${fieldName} must contain at least ${minLength} items`, fieldName);
    }
    
    // Check maximum length
    if (maxLength !== undefined && value.length > maxLength) {
      throw new ValidationError(`${fieldName} must contain no more than ${maxLength} items`, fieldName);
    }
    
    return value;
  },
  
  // Validate object
  object: (value: any, fieldName: string, options: { required?: boolean } = {}): Record<string, any> => {
    const { required = true } = options;
    
    // Check if required
    if (required && (value === undefined || value === null || typeof value !== 'object' || Array.isArray(value))) {
      throw new ValidationError(`${fieldName} is required and must be an object`, fieldName);
    }
    
    // Skip validation for optional empty values
    if (!required && (value === undefined || value === null)) {
      return {};
    }
    
    // Check if it's an object
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new ValidationError(`${fieldName} must be an object`, fieldName);
    }
    
    return value;
  },
  
  // Validate ID
  id: (id: any, fieldName: string = 'ID'): string => {
    return validate.string(id, fieldName, { required: true, minLength: 1 });
  },
  
  // Validate positive integer ID
  positiveIntegerId: (id: any, fieldName: string = 'ID'): number => {
    return validate.number(id, fieldName, { required: true, min: 1, integer: true });
  }
};

// Types
interface Team {
  id: number;
  name: string;
  logo?: string;
}

interface Match {
  id: number;
  competition_id: number;
  home_team_id: number;
  away_team_id: number;
  match_date: string;
  venue: string | null;
  status: string; // scheduled, live, completed
  home_score: number;
  away_score: number;
  current_minute: number;
  period: string | null;
  // Optional properties that may be included in some responses
  home_team_name?: string;
  home_team_logo?: string;
  away_team_name?: string;
  away_team_logo?: string;
  competition_name?: string;
  created_at?: string;
  sport?: string;
}

interface Competition {
  id: number;
  name: string;
  type: string;
  category: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface FeaturedContent {
  title: string;
  description: string;
  image: string;
}

interface UserStats {
  favoriteTeams: number;
  followedCompetitions: number;
  upcomingMatches: number;
}

interface Logger {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  assignedCompetitions: string[];
  permissions: string[];
  createdAt: string;
  lastActive: string;
  updatedAt?: string;
}

interface LoggerMatch {
  id: string;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  startTime: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
  period?: string;
  timeRemaining?: string;
  events: any[];
  loggerId: string;
  lastUpdated: string;
}

export class DatabaseService {
  // Logger methods
  async getAllLoggers(): Promise<Logger[]> {
    logOperation('GET_ALL_LOGGERS_START');
    try {
      const response = await apiCall('/admin/loggers', {}, 'admin');
      logOperation('GET_ALL_LOGGERS_SUCCESS', { count: response.data?.length || 0 });
      return response.data || [];
    } catch (error) {
      logOperation('GET_ALL_LOGGERS_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getAllLoggers:', error);
      // Return empty array as fallback
      return [];
    }
  }

  async getLoggerById(id: string): Promise<Logger | null> {
    logOperation('GET_LOGGER_BY_ID_START', { id });
    try {
      // Validate input using enhanced validation
      validate.id(id, 'Logger ID');
      
      const response = await apiCall(`/admin/loggers/${id}`, {}, 'admin');
      logOperation('GET_LOGGER_BY_ID_SUCCESS', { id, found: !!response.data });
      return response.data || null;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_LOGGER_BY_ID_VALIDATION_ERROR', { id, error: error.message });
        console.error('Validation error in getLoggerById:', error.message);
        return null;
      }
      logOperation('GET_LOGGER_BY_ID_ERROR', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getLoggerById:', error);
      return null;
    }
  }

  async getLoggerByEmail(email: string): Promise<Logger | null> {
    logOperation('GET_LOGGER_BY_EMAIL_START', { email });
    try {
      // Validate input using enhanced validation
      validate.email(email);
      
      const response = await apiCall(`/admin/loggers?email=${encodeURIComponent(email)}`, {}, 'admin');
      const loggers = response.data || [];
      const foundLogger = loggers.find((logger: Logger) => logger.email === email) || null;
      logOperation('GET_LOGGER_BY_EMAIL_SUCCESS', { email, found: !!foundLogger });
      return foundLogger;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_LOGGER_BY_EMAIL_VALIDATION_ERROR', { email, error: error.message });
        console.error('Validation error in getLoggerByEmail:', error.message);
        return null;
      }
      logOperation('GET_LOGGER_BY_EMAIL_ERROR', { email, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getLoggerByEmail:', error);
      return null;
    }
  }

  async createLogger(loggerData: Omit<Logger, 'id' | 'createdAt' | 'lastActive'>): Promise<Logger> {
    logOperation('CREATE_LOGGER_START', { email: loggerData.email });
    try {
      // Validate required fields using enhanced validation
      validate.string(loggerData.name, 'Name', { required: true, minLength: 1, maxLength: 100 });
      validate.email(loggerData.email);
      
      // Validate optional fields if present
      if (loggerData.role !== undefined) {
        validate.string(loggerData.role, 'Role', { required: false, maxLength: 50 });
      }
      
      if (loggerData.status !== undefined) {
        validate.string(loggerData.status, 'Status', { required: false, maxLength: 50 });
      }
      
      // Additional validation for assignedCompetitions if present
      if (loggerData.assignedCompetitions !== undefined) {
        validate.array(loggerData.assignedCompetitions, 'Assigned Competitions', { required: false, maxLength: 100 });
        // Validate each competition ID in the array
        for (const competitionId of loggerData.assignedCompetitions) {
          validate.string(competitionId, 'Competition ID', { required: true, minLength: 1 });
        }
      }
      
      // Additional validation for permissions if present
      if (loggerData.permissions !== undefined) {
        validate.array(loggerData.permissions, 'Permissions', { required: false, maxLength: 100 });
        // Validate each permission in the array
        for (const permission of loggerData.permissions) {
          validate.string(permission, 'Permission', { required: true, minLength: 1 });
        }
      }
      
      const response = await apiCall('/admin/loggers', {
        method: 'POST',
        body: JSON.stringify(loggerData),
      }, 'admin');
      
      logOperation('CREATE_LOGGER_SUCCESS', { id: response.data?.id, email: loggerData.email });
      return response.data;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('CREATE_LOGGER_VALIDATION_ERROR', { email: loggerData.email, error: error.message });
        console.error('Validation error in createLogger:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('CREATE_LOGGER_ERROR', { email: loggerData.email, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in createLogger:', error);
      throw error;
    }
  }

  async createLoggerWithCredentials(loggerData: Omit<Logger, 'id' | 'created_at'> & { password: string }): Promise<Logger> {
    logOperation('CREATE_LOGGER_WITH_CREDENTIALS_START', { email: loggerData.email });
    try {
      // Validate required fields with enhanced validation
      validate.string(loggerData.name, 'Name', { required: true, minLength: 1, maxLength: 100 });
      validate.email(loggerData.email);
      validate.string(loggerData.role, 'Role', { required: true, maxLength: 50 });
      validate.string(loggerData.password, 'Password', { required: true, minLength: 8 });
      
      // Additional validation for assignedCompetitions if present
      if (loggerData.assignedCompetitions) {
        validate.array(loggerData.assignedCompetitions, 'Assigned Competitions', { required: false, maxLength: 100 });
        // Validate each competition ID in the array
        for (const competitionId of loggerData.assignedCompetitions) {
          validate.string(competitionId, 'Competition ID', { required: true, minLength: 1 });
        }
      }
      
      // Additional validation for permissions if present
      if (loggerData.permissions) {
        validate.array(loggerData.permissions, 'Permissions', { required: false, maxLength: 100 });
        // Validate each permission in the array
        for (const permission of loggerData.permissions) {
          validate.string(permission, 'Permission', { required: true, minLength: 1 });
        }
      }
      
      // Send the complete logger data including the password to the backend
      // The backend will hash the password before storing it
      const response = await apiCall('/admin/loggers/with-credentials', {
        method: 'POST',
        body: JSON.stringify(loggerData),
      }, 'admin');
      
      logOperation('CREATE_LOGGER_WITH_CREDENTIALS_SUCCESS', { id: response.data?.id, email: loggerData.email });
      return response.data;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('CREATE_LOGGER_WITH_CREDENTIALS_VALIDATION_ERROR', { email: loggerData.email, error: error.message });
        console.error('Validation error in createLoggerWithCredentials:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('CREATE_LOGGER_WITH_CREDENTIALS_ERROR', { email: loggerData.email, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in createLoggerWithCredentials:', error);
      throw error;
    }
  }

  async updateLogger(id: string, updates: Partial<Logger>): Promise<Logger | null> {
    logOperation('UPDATE_LOGGER_START', { id });
    try {
      // Validate input using enhanced validation
      validate.id(id, 'Logger ID');
      
      // Validate update fields if present
      if (updates.name !== undefined) {
        validate.string(updates.name, 'Name', { required: false, minLength: 1, maxLength: 100 });
      }
      
      if (updates.email !== undefined) {
        validate.email(updates.email);
      }
      
      if (updates.role !== undefined) {
        validate.string(updates.role, 'Role', { required: false, maxLength: 50 });
      }
      
      if (updates.status !== undefined) {
        validate.string(updates.status, 'Status', { required: false, maxLength: 50 });
      }
      
      // Additional validation for assignedCompetitions if present
      if (updates.assignedCompetitions !== undefined) {
        validate.array(updates.assignedCompetitions, 'Assigned Competitions', { required: false, maxLength: 100 });
        // Validate each competition ID in the array
        for (const competitionId of updates.assignedCompetitions) {
          validate.string(competitionId, 'Competition ID', { required: true, minLength: 1 });
        }
      }
      
      // Additional validation for permissions if present
      if (updates.permissions !== undefined) {
        validate.array(updates.permissions, 'Permissions', { required: false, maxLength: 100 });
        // Validate each permission in the array
        for (const permission of updates.permissions) {
          validate.string(permission, 'Permission', { required: true, minLength: 1 });
        }
      }
      
      const response = await apiCall(`/admin/loggers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }, 'admin');
      
      logOperation('UPDATE_LOGGER_SUCCESS', { id, updatedFields: Object.keys(updates) });
      return response.data || null;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('UPDATE_LOGGER_VALIDATION_ERROR', { id, error: error.message });
        console.error('Validation error in updateLogger:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('UPDATE_LOGGER_ERROR', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in updateLogger:', error);
      return null;
    }
  }

  async assignLoggerToMatch(matchId: string, loggerId: string): Promise<LoggerMatch | null> {
    logOperation('ASSIGN_LOGGER_TO_MATCH_START', { matchId, loggerId });
    try {
      // Validate input using enhanced validation
      validate.id(matchId, 'Match ID');
      validate.id(loggerId, 'Logger ID');
      
      // Check if the logger exists
      const logger = await this.getLoggerById(loggerId);
      if (!logger) {
        throw new DatabaseError('Logger not found', 'LOGGER_NOT_FOUND', 404);
      }
      
      // Assign the logger to the match by updating the match record in the database
      const response = await apiCall(`/matches/${matchId}`, {
        method: 'PATCH',
        body: JSON.stringify({ loggerId })
      }, 'admin');
      
      logOperation('ASSIGN_LOGGER_TO_MATCH_SUCCESS', { matchId, loggerId });
      return response.data || null;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('ASSIGN_LOGGER_TO_MATCH_VALIDATION_ERROR', { matchId, loggerId, error: error.message });
        console.error('Validation error in assignLoggerToMatch:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('ASSIGN_LOGGER_TO_MATCH_ERROR', { matchId, loggerId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in assignLoggerToMatch:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to assign logger to match: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteLogger(id: string): Promise<Logger | null> {
    logOperation('DELETE_LOGGER_START', { id });
    try {
      // Validate input using enhanced validation
      validate.id(id, 'Logger ID');
      
      const response = await apiCall(`/admin/loggers/${id}`, {
        method: 'DELETE',
      }, 'admin');
      
      logOperation('DELETE_LOGGER_SUCCESS', { id });
      return response.data || null;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('DELETE_LOGGER_VALIDATION_ERROR', { id, error: error.message });
        console.error('Validation error in deleteLogger:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('DELETE_LOGGER_ERROR', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in deleteLogger:', error);
      return null;
    }
  }

  // Competitions
  async getCompetitions(): Promise<Competition[]> {
    logOperation('GET_COMPETITIONS_START');
    try {
      const response = await apiCall('/competitions');
      logOperation('GET_COMPETITIONS_SUCCESS', { count: response.data?.length || 0 });
      return response.data || [];
    } catch (error) {
      logOperation('GET_COMPETITIONS_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getCompetitions:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch competitions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCompetitionById(id: number): Promise<Competition | null> {
    logOperation('GET_COMPETITION_BY_ID_START', { id });
    try {
      // Validate input using enhanced validation
      validate.positiveIntegerId(id, 'Competition ID');
      
      const response = await apiCall(`/competitions/${id}`);
      logOperation('GET_COMPETITION_BY_ID_SUCCESS', { id, found: !!response.data });
      return response.data || null;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_COMPETITION_BY_ID_VALIDATION_ERROR', { id, error: error.message });
        console.error('Validation error in getCompetitionById:', error.message);
        return null;
      }
      logOperation('GET_COMPETITION_BY_ID_ERROR', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getCompetitionById:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch competition: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create a new competition
  async createCompetition(competitionData: Omit<Competition, 'id' | 'created_at'>): Promise<Competition> {
    logOperation('CREATE_COMPETITION_START', { name: competitionData.name });
    try {
      // Validate required fields with enhanced validation
      validate.string(competitionData.name, 'Competition name', { required: true, minLength: 1, maxLength: 200 });
      validate.string(competitionData.type, 'Competition type', { required: true, maxLength: 50 });
      validate.string(competitionData.category, 'Competition category', { required: true, maxLength: 50 });
      validate.string(competitionData.status, 'Competition status', { required: true, maxLength: 50 });
      
      // Validate optional date fields if present
      if (competitionData.start_date !== undefined && competitionData.start_date !== null) {
        validate.string(competitionData.start_date, 'Start date', { required: false });
        // Validate date format
        const startDate = new Date(competitionData.start_date);
        if (isNaN(startDate.getTime())) {
          throw new ValidationError('Invalid start date format', 'start_date');
        }
      }
      
      if (competitionData.end_date !== undefined && competitionData.end_date !== null) {
        validate.string(competitionData.end_date, 'End date', { required: false });
        // Validate date format
        const endDate = new Date(competitionData.end_date);
        if (isNaN(endDate.getTime())) {
          throw new ValidationError('Invalid end date format', 'end_date');
        }
        
        // Validate that end date is after start date if both are present
        if (competitionData.start_date) {
          const startDate = new Date(competitionData.start_date);
          if (endDate < startDate) {
            throw new ValidationError('End date must be after start date', 'end_date');
          }
        }
      }
      
      const response = await apiCall('/competitions', {
        method: 'POST',
        body: JSON.stringify(competitionData),
      }, 'admin');
      
      logOperation('CREATE_COMPETITION_SUCCESS', { id: response.data?.id, name: competitionData.name });
      return response.data;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('CREATE_COMPETITION_VALIDATION_ERROR', { name: competitionData.name, error: error.message });
        console.error('Validation error in createCompetition:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('CREATE_COMPETITION_ERROR', { name: competitionData.name, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in createCompetition:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to create competition: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update an existing competition
  async updateCompetition(id: number, updates: Partial<Competition>): Promise<Competition | null> {
    logOperation('UPDATE_COMPETITION_START', { id });
    try {
      // Validate input using enhanced validation
      validate.positiveIntegerId(id, 'Competition ID');
      
      // Validate update fields if present
      if (updates.name !== undefined) {
        validate.string(updates.name, 'Competition name', { required: false, minLength: 1, maxLength: 200 });
      }
      
      if (updates.type !== undefined) {
        validate.string(updates.type, 'Competition type', { required: false, maxLength: 50 });
      }
      
      if (updates.category !== undefined) {
        validate.string(updates.category, 'Competition category', { required: false, maxLength: 50 });
      }
      
      if (updates.status !== undefined) {
        validate.string(updates.status, 'Competition status', { required: false, maxLength: 50 });
      }
      
      if (updates.start_date !== undefined && updates.start_date !== null) {
        validate.string(updates.start_date, 'Start date', { required: false });
        // Validate date format
        const startDate = new Date(updates.start_date);
        if (isNaN(startDate.getTime())) {
          throw new ValidationError('Invalid start date format', 'start_date');
        }
      }
      
      if (updates.end_date !== undefined && updates.end_date !== null) {
        validate.string(updates.end_date, 'End date', { required: false });
        // Validate date format
        const endDate = new Date(updates.end_date);
        if (isNaN(endDate.getTime())) {
          throw new ValidationError('Invalid end date format', 'end_date');
        }
        
        // Validate that end date is after start date if both are present
        if (updates.start_date) {
          const startDate = new Date(updates.start_date);
          if (endDate < startDate) {
            throw new ValidationError('End date must be after start date', 'end_date');
          }
        }
      }
      
      const response = await apiCall(`/competitions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }, 'admin');
      
      logOperation('UPDATE_COMPETITION_SUCCESS', { id, updatedFields: Object.keys(updates) });
      return response.data || null;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('UPDATE_COMPETITION_VALIDATION_ERROR', { id, error: error.message });
        console.error('Validation error in updateCompetition:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('UPDATE_COMPETITION_ERROR', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in updateCompetition:', error);
      return null;
    }
  }

  // Delete a competition
  async deleteCompetition(id: number): Promise<boolean> {
    logOperation('DELETE_COMPETITION_START', { id });
    try {
      // Validate input using enhanced validation
      validate.positiveIntegerId(id, 'Competition ID');
      
      await apiCall(`/competitions/${id}`, {
        method: 'DELETE',
      }, 'admin');
      
      logOperation('DELETE_COMPETITION_SUCCESS', { id });
      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('DELETE_COMPETITION_VALIDATION_ERROR', { id, error: error.message });
        console.error('Validation error in deleteCompetition:', error.message);
        return false;
      }
      logOperation('DELETE_COMPETITION_ERROR', { id, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in deleteCompetition:', error);
      return false;
    }
  }

  // Matches
  async getMatches(): Promise<Match[]> {
    logOperation('GET_MATCHES_START');
    try {
      const response = await apiCall('/matches');
      logOperation('GET_MATCHES_SUCCESS', { count: response.data?.length || 0 });
      return response.data || [];
    } catch (error) {
      logOperation('GET_MATCHES_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getMatches:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getMatchesByCompetition(competitionId: number): Promise<Match[]> {
    logOperation('GET_MATCHES_BY_COMPETITION_START', { competitionId });
    try {
      // Validate input using enhanced validation
      validate.positiveIntegerId(competitionId, 'Competition ID');
      
      const response = await apiCall(`/matches?competition_id=${competitionId}`);
      logOperation('GET_MATCHES_BY_COMPETITION_SUCCESS', { competitionId, count: response.data?.length || 0 });
      return response.data || [];
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_MATCHES_BY_COMPETITION_VALIDATION_ERROR', { competitionId, error: error.message });
        console.error('Validation error in getMatchesByCompetition:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('GET_MATCHES_BY_COMPETITION_ERROR', { competitionId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getMatchesByCompetition:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create a new match
  async createMatch(matchData: Omit<Match, 'id' | 'created_at'>): Promise<Match> {
    logOperation('CREATE_MATCH_START', { homeTeam: matchData.home_team_name, awayTeam: matchData.away_team_name });
    try {
      // Validate required fields with enhanced validation
      validate.string(matchData.home_team_name, 'Home team name', { required: true, minLength: 1, maxLength: 100 });
      validate.string(matchData.away_team_name, 'Away team name', { required: true, minLength: 1, maxLength: 100 });
      validate.string(matchData.venue, 'Venue', { required: true, minLength: 1, maxLength: 200 });
      
      // Validate date
      if (!matchData.match_date) {
        throw new ValidationError('Match date is required', 'match_date');
      }
      
      const matchDate = new Date(matchData.match_date);
      if (isNaN(matchDate.getTime())) {
        throw new ValidationError('Invalid match date format', 'match_date');
      }
      
      // Validate competition ID if provided
      if (matchData.competition_id !== undefined && matchData.competition_id !== null) {
        validate.positiveIntegerId(matchData.competition_id, 'Competition ID');
      }
      
      const response = await apiCall('/matches', {
        method: 'POST',
        body: JSON.stringify(matchData),
      }, 'admin');
      
      logOperation('CREATE_MATCH_SUCCESS', { id: response.data?.id, homeTeam: matchData.home_team_name, awayTeam: matchData.away_team_name });
      return response.data;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('CREATE_MATCH_VALIDATION_ERROR', { homeTeam: matchData.home_team_name, awayTeam: matchData.away_team_name, error: error.message });
        console.error('Validation error in createMatch:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('CREATE_MATCH_ERROR', { homeTeam: matchData.home_team_name, awayTeam: matchData.away_team_name, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in createMatch:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to create match: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Additional match methods
  async getMatchesBySport(sport: string): Promise<Match[]> {
    logOperation('GET_MATCHES_BY_SPORT_START', { sport });
    try {
      // Validate input using enhanced validation
      validate.string(sport, 'Sport', { required: true, minLength: 1 });
      
      const response = await apiCall(`/matches?sport=${encodeURIComponent(sport)}`);
      logOperation('GET_MATCHES_BY_SPORT_SUCCESS', { sport, count: response.data?.length || 0 });
      return response.data || [];
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_MATCHES_BY_SPORT_VALIDATION_ERROR', { sport, error: error.message });
        console.error('Validation error in getMatchesBySport:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('GET_MATCHES_BY_SPORT_ERROR', { sport, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getMatchesBySport:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLiveMatches(): Promise<{ football: Match[]; basketball: Match[]; track: Match[] }> {
    logOperation('GET_LIVE_MATCHES_START');
    try {
      const response = await apiCall('/live/matches');
      const liveMatches = response.data || {
        football: [],
        basketball: [],
        track: []
      };
      logOperation('GET_LIVE_MATCHES_SUCCESS', { 
        footballCount: liveMatches.football.length, 
        basketballCount: liveMatches.basketball.length, 
        trackCount: liveMatches.track.length 
      });
      return liveMatches;
    } catch (error) {
      logOperation('GET_LIVE_MATCHES_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getLiveMatches:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch live matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Teams
  async getTeams(): Promise<Team[]> {
    logOperation('GET_TEAMS_START');
    try {
      const response = await apiCall('/teams');
      logOperation('GET_TEAMS_SUCCESS', { count: response.data?.length || 0 });
      return response.data || [];
    } catch (error) {
      logOperation('GET_TEAMS_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getTeams:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch teams: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Featured content and user stats
  async getFeaturedContent(): Promise<FeaturedContent> {
    logOperation('GET_FEATURED_CONTENT_START');
    try {
      const response = await apiCall('/media/featured');
      logOperation('GET_FEATURED_CONTENT_SUCCESS');
      return response.data || {
        title: 'Featured Event',
        description: 'Check out this exciting event',
        image: '/images/featured.jpg'
      };
    } catch (error) {
      logOperation('GET_FEATURED_CONTENT_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getFeaturedContent:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch featured content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUpcomingMatches(userId: string): Promise<Match[]> {
    logOperation('GET_UPCOMING_MATCHES_START', { userId });
    try {
      // Validate input using enhanced validation
      validate.id(userId, 'User ID');
      
      const response = await apiCall(`/users/${userId}/upcoming-matches`);
      logOperation('GET_UPCOMING_MATCHES_SUCCESS', { userId, count: response.data?.length || 0 });
      return response.data || [];
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_UPCOMING_MATCHES_VALIDATION_ERROR', { userId, error: error.message });
        console.error('Validation error in getUpcomingMatches:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('GET_UPCOMING_MATCHES_ERROR', { userId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getUpcomingMatches:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch upcoming matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    logOperation('GET_USER_STATS_START', { userId });
    try {
      // Validate input using enhanced validation
      validate.id(userId, 'User ID');
      
      const response = await apiCall(`/users/${userId}/stats`);
      logOperation('GET_USER_STATS_SUCCESS', { userId });
      return response.data || {
        favoriteTeams: 0,
        followedCompetitions: 0,
        upcomingMatches: 0
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_USER_STATS_VALIDATION_ERROR', { userId, error: error.message });
        console.error('Validation error in getUserStats:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('GET_USER_STATS_ERROR', { userId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getUserStats:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch user stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Logger data submission methods
  async saveMatchEvents(events: any[], userId: string): Promise<void> {
    logOperation('SAVE_MATCH_EVENTS_START', { userId, eventCount: events.length });
    try {
      // Validate input using enhanced validation
      validate.array(events, 'Events', { required: true, maxLength: 1000 });
      validate.id(userId, 'User ID');
      
      // Validate each event in the array
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if (!event) {
          throw new ValidationError(`Event at index ${i} is required`, `events[${i}]`);
        }
        
        // Validate required event fields
        if (!event.type) {
          throw new ValidationError(`Event type is required for event at index ${i}`, `events[${i}].type`);
        }
        
        if (!event.matchId) {
          throw new ValidationError(`Match ID is required for event at index ${i}`, `events[${i}].matchId`);
        }
        
        validate.id(event.matchId, `Event ${i} match ID`);
        
        // Validate timestamp if present
        if (event.timestamp) {
          const timestamp = new Date(event.timestamp);
          if (isNaN(timestamp.getTime())) {
            throw new ValidationError(`Invalid timestamp for event at index ${i}`, `events[${i}].timestamp`);
          }
        }
      }
      
      await apiCall('/live/events', {
        method: 'POST',
        body: JSON.stringify({ events, userId }),
      }, 'logger');
      logOperation('SAVE_MATCH_EVENTS_SUCCESS', { userId, eventCount: events.length });
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('SAVE_MATCH_EVENTS_VALIDATION_ERROR', { userId, error: error.message });
        console.error('Validation error in saveMatchEvents:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('SAVE_MATCH_EVENTS_ERROR', { userId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in saveMatchEvents:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to save match events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateMatchScores(scores: any[], userId: string): Promise<void> {
    logOperation('UPDATE_MATCH_SCORES_START', { userId, scoreCount: scores.length });
    try {
      // Validate input using enhanced validation
      validate.array(scores, 'Scores', { required: true, maxLength: 1000 });
      validate.id(userId, 'User ID');
      
      // Validate each score in the array
      for (let i = 0; i < scores.length; i++) {
        const score = scores[i];
        if (!score) {
          throw new ValidationError(`Score at index ${i} is required`, `scores[${i}]`);
        }
        
        // Validate required score fields
        if (!score.matchId) {
          throw new ValidationError(`Match ID is required for score at index ${i}`, `scores[${i}].matchId`);
        }
        
        validate.id(score.matchId, `Score ${i} match ID`);
        
        // Validate numeric fields
        if (score.homeScore !== undefined) {
          validate.number(score.homeScore, `Score ${i} home score`, { min: 0 });
        }
        
        if (score.awayScore !== undefined) {
          validate.number(score.awayScore, `Score ${i} away score`, { min: 0 });
        }
        
        // Validate timestamp if present
        if (score.timestamp) {
          const timestamp = new Date(score.timestamp);
          if (isNaN(timestamp.getTime())) {
            throw new ValidationError(`Invalid timestamp for score at index ${i}`, `scores[${i}].timestamp`);
          }
        }
      }
      
      await apiCall('/matches/scores', {
        method: 'PATCH',
        body: JSON.stringify({ scores, userId }),
      }, 'logger');
      logOperation('UPDATE_MATCH_SCORES_SUCCESS', { userId, scoreCount: scores.length });
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('UPDATE_MATCH_SCORES_VALIDATION_ERROR', { userId, error: error.message });
        console.error('Validation error in updateMatchScores:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('UPDATE_MATCH_SCORES_ERROR', { userId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in updateMatchScores:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update match scores: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async logUserActivity(userId: string, activity: string, data: any): Promise<void> {
    logOperation('LOG_USER_ACTIVITY_START', { userId, activity });
    try {
      // Validate input using enhanced validation
      validate.id(userId, 'User ID');
      validate.string(activity, 'Activity', { required: true, minLength: 1, maxLength: 100 });
      validate.object(data, 'Data', { required: false });
      
      // Additional validation for data object if present
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Limit the size of the data object
        const dataKeys = Object.keys(data);
        if (dataKeys.length > 50) {
          throw new ValidationError('Data object cannot have more than 50 properties', 'data');
        }
        
        // Validate each property value length if it's a string
        for (const key of dataKeys) {
          if (typeof data[key] === 'string' && data[key].length > 1000) {
            throw new ValidationError(`Data property '${key}' cannot exceed 1000 characters`, `data.${key}`);
          }
        }
      }
      
      await apiCall('/user-activity', {
        method: 'POST',
        body: JSON.stringify({ userId, activity, data }),
      });
      logOperation('LOG_USER_ACTIVITY_SUCCESS', { userId, activity });
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('LOG_USER_ACTIVITY_VALIDATION_ERROR', { userId, activity, error: error.message });
        console.error('Validation error in logUserActivity:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('LOG_USER_ACTIVITY_ERROR', { userId, activity, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in logUserActivity:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to log user activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetches match statistics by match ID
   * @param matchId The ID of the match to fetch statistics for
   * @returns Promise resolving to match statistics data
   */
  async getMatchStats(matchId: string): Promise<any> {
    logOperation('GET_MATCH_STATS_START', { matchId });
    try {
      // Validate input using enhanced validation
      validate.id(matchId, 'Match ID');
      
      const response = await apiCall(`/matches/${matchId}/stats`);
      logOperation('GET_MATCH_STATS_SUCCESS', { matchId });
      return response; // Return the full response, not just response.data
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_MATCH_STATS_VALIDATION_ERROR', { matchId, error: error.message });
        console.error('Validation error in getMatchStats:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('GET_MATCH_STATS_ERROR', { matchId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getMatchStats:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch match stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetches match events by match ID
   * @param matchId The ID of the match to fetch events for
   * @returns Promise resolving to match events data
   */
  async getMatchEvents(matchId: number): Promise<any[]> {
    logOperation('GET_MATCH_EVENTS_START', { matchId });
    try {
      // Validate input using enhanced validation
      validate.number(matchId, 'Match ID', { min: 1 });
      
      const response = await apiCall(`/matches/${matchId}/events`);
      logOperation('GET_MATCH_EVENTS_SUCCESS', { matchId });
      return response.data || [];
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_MATCH_EVENTS_VALIDATION_ERROR', { matchId, error: error.message });
        console.error('Validation error in getMatchEvents:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('GET_MATCH_EVENTS_ERROR', { matchId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getMatchEvents:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch match events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Users
  async getUsers(): Promise<any[]> {
    logOperation('GET_USERS_START');
    try {
      const response = await apiCall('/admin/users', {}, 'admin');
      logOperation('GET_USERS_SUCCESS', { count: response.data?.length || 0 });
      return response.data || [];
    } catch (error) {
      logOperation('GET_USERS_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getUsers:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export a singleton instance
export const databaseService = new DatabaseService();

// Export dbService as an alias for backward compatibility
export const dbService = databaseService;