// Import Supabase client
import { supabase } from './supabaseClient';
import { verifyUnifiedToken } from './authService';

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

export interface Logger {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'logger' | 'senior-logger' | 'logger-admin' | string;
  status: string;
  assignedCompetitions: string[];
  permissions: string[];
  refreshToken?: string;
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
      const { data, error } = await supabase
        .from('Logger')
        .select('*');
      
      if (error) {
        throw new DatabaseError(`Failed to fetch loggers: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_ALL_LOGGERS_SUCCESS', { count: data?.length || 0 });
      return data || [];
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
      
      const { data, error } = await supabase
        .from('Logger')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to fetch logger: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_LOGGER_BY_ID_SUCCESS', { id, found: !!data });
      return data || null;
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
      
      const { data, error } = await supabase
        .from('Logger')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to fetch logger: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_LOGGER_BY_EMAIL_SUCCESS', { email, found: !!data });
      return data || null;
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
      
      const { data, error } = await supabase
        .from('Logger')
        .insert([{
          ...loggerData,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to create logger: ${error.message}`, 'CREATE_ERROR', 500);
      }
      
      logOperation('CREATE_LOGGER_SUCCESS', { id: data?.id, email: loggerData.email });
      return data;
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
      
      // Hash the password before storing
      const bcrypt = require('bcrypt');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(loggerData.password, saltRounds);
      
      const { data, error } = await supabase
        .from('Logger')
        .insert([{
          ...loggerData,
          password: hashedPassword,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to create logger: ${error.message}`, 'CREATE_ERROR', 500);
      }
      
      logOperation('CREATE_LOGGER_WITH_CREDENTIALS_SUCCESS', { id: data?.id, email: loggerData.email });
      return data;
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
      
      const { data, error } = await supabase
        .from('Logger')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to update logger: ${error.message}`, 'UPDATE_ERROR', 500);
      }
      
      logOperation('UPDATE_LOGGER_SUCCESS', { id, updatedFields: Object.keys(updates) });
      return data || null;
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
      
      // Update the match record in the database
      const { data, error } = await supabase
        .from('Match')
        .update({ loggerId })
        .eq('id', matchId)
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to assign logger to match: ${error.message}`, 'UPDATE_ERROR', 500);
      }
      
      logOperation('ASSIGN_LOGGER_TO_MATCH_SUCCESS', { matchId, loggerId });
      return data || null;
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
      
      const { data, error } = await supabase
        .from('Logger')
        .delete()
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to delete logger: ${error.message}`, 'DELETE_ERROR', 500);
      }
      
      logOperation('DELETE_LOGGER_SUCCESS', { id });
      return data || null;
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
      const { data, error } = await supabase
        .from('Competition')
        .select('*');
      
      if (error) {
        throw new DatabaseError(`Failed to fetch competitions: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_COMPETITIONS_SUCCESS', { count: data?.length || 0 });
      return data || [];
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
      
      const { data, error } = await supabase
        .from('Competition')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to fetch competition: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_COMPETITION_BY_ID_SUCCESS', { id, found: !!data });
      return data || null;
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
      
      const { data, error } = await supabase
        .from('Competition')
        .insert([{
          ...competitionData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to create competition: ${error.message}`, 'CREATE_ERROR', 500);
      }
      
      logOperation('CREATE_COMPETITION_SUCCESS', { id: data?.id, name: competitionData.name });
      return data;
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
      
      const { data, error } = await supabase
        .from('Competition')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to update competition: ${error.message}`, 'UPDATE_ERROR', 500);
      }
      
      logOperation('UPDATE_COMPETITION_SUCCESS', { id, updatedFields: Object.keys(updates) });
      return data || null;
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
      
      const { error } = await supabase
        .from('Competition')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new DatabaseError(`Failed to delete competition: ${error.message}`, 'DELETE_ERROR', 500);
      }
      
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
      // Check if Supabase client is properly initialized
      if (!supabase) {
        throw new DatabaseError('Supabase client is not initialized', 'INIT_ERROR', 500);
      }
      
      const { data, error } = await supabase
        .from('Match')
        .select('*');
      
      if (error) {
        // Log more detailed error information
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw new DatabaseError(`Failed to fetch matches: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_MATCHES_SUCCESS', { count: data?.length || 0 });
      return data || [];
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
      
      const { data, error } = await supabase
        .from('Match')
        .select('*')
        .eq('competition_id', competitionId);
      
      if (error) {
        throw new DatabaseError(`Failed to fetch matches: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_MATCHES_BY_COMPETITION_SUCCESS', { competitionId, count: data?.length || 0 });
      return data || [];
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
      
      const { data, error } = await supabase
        .from('Match')
        .insert([{
          ...matchData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to create match: ${error.message}`, 'CREATE_ERROR', 500);
      }
      
      logOperation('CREATE_MATCH_SUCCESS', { id: data?.id, homeTeam: matchData.home_team_name, awayTeam: matchData.away_team_name });
      return data;
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
      
      // Check if Supabase client is properly initialized
      if (!supabase) {
        throw new DatabaseError('Supabase client is not initialized', 'INIT_ERROR', 500);
      }
      
      // First, get all competition IDs for the specified sport
      const { data: competitions, error: competitionError } = await supabase
        .from('Competition')
        .select('id')
        .eq('sportType', sport);
      
      if (competitionError) {
        throw new DatabaseError(`Failed to fetch competitions: ${competitionError.message}`, 'FETCH_ERROR', 500);
      }
      
      if (!competitions || competitions.length === 0) {
        logOperation('GET_MATCHES_BY_SPORT_SUCCESS', { sport, count: 0 });
        return [];
      }
      
      // Extract competition IDs
      const competitionIds = competitions.map(c => c.id);
      
      // Query matches by joining with Competition table to filter by sportType
      // Also join with Team tables to get team names and logos
      const { data, error } = await supabase
        .from('Match')
        .select(`
          *,
          competition:Competition(
            id,
            name,
            sportType
          ),
          homeTeam:Team(
            id,
            name,
            logo_url
          ),
          awayTeam:Team(
            id,
            name,
            logo_url
          )
        `)
        .in('competition_id', competitionIds)
        .order('scheduled_at', { ascending: true, nullsFirst: false });
      
      if (error) {
        // Log more detailed error information
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Check for network-related errors
        const errorMessage = error.message || '';
        if (errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
            errorMessage.includes('network') ||
            error.code === 'PGRST301') {
          // Get Supabase URL for diagnostics (safely)
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET';
          const urlHostname = supabaseUrl && supabaseUrl !== 'NOT SET' 
            ? (() => {
                try {
                  return new URL(supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`).hostname;
                } catch {
                  return 'INVALID_URL';
                }
              })()
            : 'UNKNOWN';
          
          console.error('[DatabaseService] Supabase network error:', {
            error: error.message,
            errorCode: error.code,
            supabaseUrlConfigured: supabaseUrl !== 'NOT SET',
            supabaseHostname: urlHostname,
            sport
          });
          
          throw new DatabaseError(
            `Network error: Unable to connect to Supabase database (${urlHostname}). ` +
            `Possible causes:\n` +
            `1. Missing NEXT_PUBLIC_SUPABASE_URL in Vercel environment variables\n` +
            `2. Supabase project may be paused (check Supabase dashboard)\n` +
            `3. Incorrect Supabase URL format\n` +
            `4. Network connectivity issues\n` +
            `Check browser console for detailed error information.`,
            'NETWORK_ERROR',
            503
          );
        }
        
        throw new DatabaseError(`Failed to fetch matches: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      // Transform the nested data structure to match the Match interface
      const transformedMatches: Match[] = (data || []).map((match: any) => ({
        id: match.id,
        competition_id: match.competition_id || match.competitionId || (match.competition?.id ? parseInt(match.competition.id) : 0),
        home_team_id: match.home_team_id || match.homeTeamId || (match.homeTeam?.id ? parseInt(match.homeTeam.id) : 0),
        away_team_id: match.away_team_id || match.awayTeamId || (match.awayTeam?.id ? parseInt(match.awayTeam.id) : 0),
        match_date: match.match_date || match.scheduled_at || match.startTime || '',
        venue: match.venue || null,
        status: match.status || 'scheduled',
        home_score: match.home_score || match.homeScore || 0,
        away_score: match.away_score || match.awayScore || 0,
        current_minute: match.current_minute || match.currentMinute || 0,
        period: match.period || null,
        home_team_name: match.home_team_name || match.homeTeam?.name || `Team ${match.home_team_id || match.homeTeamId}`,
        home_team_logo: match.home_team_logo || match.homeTeam?.logo_url || match.homeTeam?.logo || '',
        away_team_name: match.away_team_name || match.awayTeam?.name || `Team ${match.away_team_id || match.awayTeamId}`,
        away_team_logo: match.away_team_logo || match.awayTeam?.logo_url || match.awayTeam?.logo || '',
        competition_name: match.competition_name || match.competition?.name || 'Competition',
        created_at: match.created_at || match.createdAt || '',
        sport: match.sport || match.competition?.sportType || sport
      }));
      
      logOperation('GET_MATCHES_BY_SPORT_SUCCESS', { sport, count: transformedMatches.length });
      return transformedMatches;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_MATCHES_BY_SPORT_VALIDATION_ERROR', { sport, error: error.message });
        console.error('Validation error in getMatchesBySport:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      
      // Check for network/fetch errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        // Get Supabase URL for diagnostics (safely)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET';
        const urlHostname = supabaseUrl && supabaseUrl !== 'NOT SET' 
          ? new URL(supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`).hostname 
          : 'UNKNOWN';
        
        console.error('[DatabaseService] Network error details:', {
          error: error.message,
          supabaseUrlConfigured: supabaseUrl !== 'NOT SET',
          supabaseHostname: urlHostname,
          sport
        });
        
        const networkError = new DatabaseError(
          `Network error: Unable to connect to Supabase database (${urlHostname}). ` +
          `This could be due to:\n` +
          `1. Missing or incorrect NEXT_PUBLIC_SUPABASE_URL environment variable\n` +
          `2. Supabase project may be paused (check Supabase dashboard)\n` +
          `3. Internet connectivity issues\n` +
          `4. CORS configuration issues\n` +
          `Please verify your Supabase environment variables are set correctly in Vercel.`,
          'NETWORK_ERROR',
          503
        );
        logOperation('GET_MATCHES_BY_SPORT_NETWORK_ERROR', { sport, error: networkError.message, hostname: urlHostname });
        throw networkError;
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
      // Check if Supabase client is properly initialized
      if (!supabase) {
        throw new DatabaseError('Supabase client is not initialized', 'INIT_ERROR', 500);
      }
      
      // Fetch live matches for each sport
      const [{ data: footballMatches, error: footballError }, { data: basketballMatches, error: basketballError }, { data: trackMatches, error: trackError }] = await Promise.all([
        supabase.from('Match').select('*').eq('sport', 'football').eq('status', 'live'),
        supabase.from('Match').select('*').eq('sport', 'basketball').eq('status', 'live'),
        supabase.from('Match').select('*').eq('sport', 'track').eq('status', 'live')
      ]);
      
      if (footballError || basketballError || trackError) {
        // Log more detailed error information
        if (footballError) {
          console.error('Football matches error:', {
            message: footballError.message,
            code: footballError.code,
            details: footballError.details,
            hint: footballError.hint
          });
        }
        if (basketballError) {
          console.error('Basketball matches error:', {
            message: basketballError.message,
            code: basketballError.code,
            details: basketballError.details,
            hint: basketballError.hint
          });
        }
        if (trackError) {
          console.error('Track matches error:', {
            message: trackError.message,
            code: trackError.code,
            details: trackError.details,
            hint: trackError.hint
          });
        }
        
        const errorMessage = [footballError?.message, basketballError?.message, trackError?.message].filter(Boolean).join('; ');
        throw new DatabaseError(`Failed to fetch live matches: ${errorMessage}`, 'FETCH_ERROR', 500);
      }
      
      const liveMatches = {
        football: footballMatches || [],
        basketball: basketballMatches || [],
        track: trackMatches || []
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
      const { data, error } = await supabase
        .from('Team')
        .select('*');
      
      if (error) {
        throw new DatabaseError(`Failed to fetch teams: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_TEAMS_SUCCESS', { count: data?.length || 0 });
      return data || [];
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
      // For now, return static content since we don't have a dedicated table for this
      const featuredContent: FeaturedContent = {
        title: 'Featured Event',
        description: 'Check out this exciting event',
        image: '/images/featured.jpg'
      };
      
      logOperation('GET_FEATURED_CONTENT_SUCCESS');
      return featuredContent;
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
      
      // For now, return all scheduled matches since we don't have user-specific favorites
      const { data, error } = await supabase
        .from('Match')
        .select('*')
        .eq('status', 'scheduled');
      
      if (error) {
        throw new DatabaseError(`Failed to fetch upcoming matches: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_UPCOMING_MATCHES_SUCCESS', { userId, count: data?.length || 0 });
      return data || [];
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
      
      // For now, return static stats since we don't have user-specific data
      const userStats: UserStats = {
        favoriteTeams: 0,
        followedCompetitions: 0,
        upcomingMatches: 0
      };
      
      logOperation('GET_USER_STATS_SUCCESS', { userId });
      return userStats;
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
      
      // For now, we'll just log the events since we don't have a dedicated table for this
      console.log('Saving match events:', events);
      
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
      
      // Update match scores in the database
      for (const score of scores) {
        const { error } = await supabase
          .from('Match')
          .update({
            home_score: score.homeScore,
            away_score: score.awayScore,
            lastUpdated: new Date().toISOString()
          })
          .eq('id', score.matchId);
        
        if (error) {
          throw new DatabaseError(`Failed to update match score: ${error.message}`, 'UPDATE_ERROR', 500);
        }
      }
      
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
      
      // For now, we'll just log the activity since we don't have a dedicated table for this
      console.log('Logging user activity:', { userId, activity, data });
      
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
      
      // For now, return static data since we don't have a dedicated table for this
      const stats = {
        matchId,
        homeTeamStats: {},
        awayTeamStats: {},
        overallStats: {}
      };
      
      logOperation('GET_MATCH_STATS_SUCCESS', { matchId });
      return stats;
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
      
      // For now, return empty array since we don't have a dedicated table for this
      const events: any[] = [];
      
      logOperation('GET_MATCH_EVENTS_SUCCESS', { matchId });
      return events;
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
      const { data, error } = await supabase
        .from('User')
        .select('*');
      
      if (error) {
        throw new DatabaseError(`Failed to fetch users: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_USERS_SUCCESS', { count: data?.length || 0 });
      return data || [];
    } catch (error) {
      logOperation('GET_USERS_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getUsers:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Messaging methods

  // Get conversation details
  async getConversationDetails(conversationId: string): Promise<any> {
    logOperation('GET_CONVERSATION_DETAILS_START', { conversationId });
    try {
      // Validate input using enhanced validation
      validate.id(conversationId, 'Conversation ID');
      
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            role,
            joined_at
          )
        `)
        .eq('id', conversationId)
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to fetch conversation: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_CONVERSATION_DETAILS_SUCCESS', { conversationId });
      return data || null;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_CONVERSATION_DETAILS_VALIDATION_ERROR', { conversationId, error: error.message });
        console.error('Validation error in getConversationDetails:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('GET_CONVERSATION_DETAILS_ERROR', { conversationId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getConversationDetails:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get user conversations
  async getUserConversations(userId: string, filters: { type?: string; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }, pagination: { page: number; limit: number }): Promise<any[]> {
    logOperation('GET_USER_CONVERSATIONS_START', { userId, filters, pagination });
    try {
      // Validate input using enhanced validation
      validate.id(userId, 'User ID');
      
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;
      
      let query = supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            role,
            joined_at,
            last_read_at
          )
        `)
        .eq('participants.user_id', userId)
        .is('participants.left_at', null)
        .range(offset, offset + limit - 1);
      
      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      
      // Apply sorting
      const sortBy = filters.sortBy || 'updated_at';
      const sortOrder = filters.sortOrder || 'DESC';
      query = query.order(sortBy, { ascending: sortOrder === 'ASC' });
      
      const { data, error } = await query;
      
      if (error) {
        throw new DatabaseError(`Failed to fetch conversations: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_USER_CONVERSATIONS_SUCCESS', { userId, count: data?.length || 0 });
      return data || [];
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_USER_CONVERSATIONS_VALIDATION_ERROR', { userId, error: error.message });
        console.error('Validation error in getUserConversations:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('GET_USER_CONVERSATIONS_ERROR', { userId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getUserConversations:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch conversations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create conversation
  async createConversation(creatorId: string, type: string, name: string, participantIds: string[]): Promise<any> {
    logOperation('CREATE_CONVERSATION_START', { creatorId, type, name, participantCount: participantIds.length });
    try {
      // Validate input using enhanced validation
      validate.id(creatorId, 'Creator ID');
      validate.string(type, 'Conversation type', { required: true, maxLength: 50 });
      if (name) validate.string(name, 'Conversation name', { required: false, maxLength: 255 });
      validate.array(participantIds, 'Participant IDs', { required: true, maxLength: 100 });
      
      // Validate each participant ID
      for (const participantId of participantIds) {
        validate.id(participantId, 'Participant ID');
      }
      
      // Create the conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert([
          {
            type,
            name: name || null,
            created_by: creatorId
          }
        ])
        .select()
        .single();
      
      if (conversationError) {
        throw new DatabaseError(`Failed to create conversation: ${conversationError.message}`, 'CREATE_ERROR', 500);
      }
      
      const conversationId = conversationData.id;
      
      // Add participants
      const participantsToInsert = [
        { conversation_id: conversationId, user_id: creatorId, role: 'owner' },
        ...participantIds.map(participantId => ({
          conversation_id: conversationId,
          user_id: participantId,
          role: 'member'
        }))
      ];
      
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participantsToInsert);
      
      if (participantsError) {
        throw new DatabaseError(`Failed to add participants to conversation: ${participantsError.message}`, 'CREATE_ERROR', 500);
      }
      
      // Fetch the complete conversation with participants
      const { data: fullConversation, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            role,
            joined_at
          )
        `)
        .eq('id', conversationId)
        .single();
      
      if (fetchError) {
        throw new DatabaseError(`Failed to fetch created conversation: ${fetchError.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('CREATE_CONVERSATION_SUCCESS', { conversationId, creatorId });
      return fullConversation;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('CREATE_CONVERSATION_VALIDATION_ERROR', { creatorId, error: error.message });
        console.error('Validation error in createConversation:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('CREATE_CONVERSATION_ERROR', { creatorId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in createConversation:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Send message
  async sendMessage(conversationId: string, userId: string, content: string, contentType: string = 'text', parentId: string | null = null): Promise<any> {
    logOperation('SEND_MESSAGE_START', { conversationId, userId, contentLength: content.length });
    try {
      // Validate input using enhanced validation
      validate.id(conversationId, 'Conversation ID');
      validate.id(userId, 'User ID');
      validate.string(content, 'Message content', { required: true, maxLength: 10000 });
      validate.string(contentType, 'Content type', { required: true, maxLength: 50 });
      if (parentId) validate.id(parentId, 'Parent message ID');
      
      // Verify user is a participant in the conversation
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .is('left_at', null)
        .single();
      
      if (participantError || !participantData) {
        throw new DatabaseError('User is not a participant in this conversation', 'FORBIDDEN', 403);
      }
      
      // Create the message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: conversationId,
            user_id: userId,
            content,
            content_type: contentType,
            parent_message_id: parentId
          }
        ])
        .select()
        .single();
      
      if (messageError) {
        throw new DatabaseError(`Failed to send message: ${messageError.message}`, 'CREATE_ERROR', 500);
      }
      
      // Update conversation timestamp
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
      
      if (updateError) {
        console.warn('Failed to update conversation timestamp:', updateError);
      }
      
      logOperation('SEND_MESSAGE_SUCCESS', { messageId: messageData.id, conversationId, userId });
      return messageData;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('SEND_MESSAGE_VALIDATION_ERROR', { conversationId, userId, error: error.message });
        console.error('Validation error in sendMessage:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('SEND_MESSAGE_ERROR', { conversationId, userId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in sendMessage:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get conversation messages
  async getMessages(conversationId: string, pagination: { page: number; limit: number }): Promise<any[]> {
    logOperation('GET_MESSAGES_START', { conversationId, pagination });
    try {
      // Validate input using enhanced validation
      validate.id(conversationId, 'Conversation ID');
      
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        throw new DatabaseError(`Failed to fetch messages: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_MESSAGES_SUCCESS', { conversationId, count: data?.length || 0 });
      return data || [];
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_MESSAGES_VALIDATION_ERROR', { conversationId, error: error.message });
        console.error('Validation error in getMessages:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('GET_MESSAGES_ERROR', { conversationId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getMessages:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update message
  async updateMessage(messageId: string, userId: string, content: string): Promise<any> {
    logOperation('UPDATE_MESSAGE_START', { messageId, userId });
    try {
      // Validate input using enhanced validation
      validate.id(messageId, 'Message ID');
      validate.id(userId, 'User ID');
      validate.string(content, 'Message content', { required: true, maxLength: 10000 });
      
      // Verify user is the owner of the message
      const { data: messageData, error: fetchError } = await supabase
        .from('messages')
        .select('user_id')
        .eq('id', messageId)
        .eq('user_id', userId)
        .single();
      
      if (fetchError || !messageData) {
        throw new DatabaseError('Message not found or user is not the owner', 'FORBIDDEN', 403);
      }
      
      // Update the message
      const { data, error } = await supabase
        .from('messages')
        .update({
          content,
          edited: true,
          edited_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to update message: ${error.message}`, 'UPDATE_ERROR', 500);
      }
      
      logOperation('UPDATE_MESSAGE_SUCCESS', { messageId, userId });
      return data;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('UPDATE_MESSAGE_VALIDATION_ERROR', { messageId, userId, error: error.message });
        console.error('Validation error in updateMessage:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('UPDATE_MESSAGE_ERROR', { messageId, userId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in updateMessage:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete message
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    logOperation('DELETE_MESSAGE_START', { messageId, userId });
    try {
      // Validate input using enhanced validation
      validate.id(messageId, 'Message ID');
      validate.id(userId, 'User ID');
      
      // Verify user is the owner of the message or an admin
      const { data: messageData, error: fetchError } = await supabase
        .from('messages')
        .select('user_id')
        .eq('id', messageId)
        .single();
      
      if (fetchError || !messageData) {
        throw new DatabaseError('Message not found', 'NOT_FOUND', 404);
      }
      
      // In a real implementation, you would also check if the user is an admin
      // For now, we'll just check if they're the owner
      if (messageData.user_id !== userId) {
        throw new DatabaseError('User is not the owner of this message', 'FORBIDDEN', 403);
      }
      
      // Soft delete the message
      const { error } = await supabase
        .from('messages')
        .update({
          deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);
      
      if (error) {
        throw new DatabaseError(`Failed to delete message: ${error.message}`, 'DELETE_ERROR', 500);
      }
      
      logOperation('DELETE_MESSAGE_SUCCESS', { messageId, userId });
      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('DELETE_MESSAGE_VALIDATION_ERROR', { messageId, userId, error: error.message });
        console.error('Validation error in deleteMessage:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('DELETE_MESSAGE_ERROR', { messageId, userId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in deleteMessage:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create announcement
  async createAnnouncement(userId: string, title: string, content: string, priority: string): Promise<any> {
    logOperation('CREATE_ANNOUNCEMENT_START', { userId, title });
    try {
      // Validate input using enhanced validation
      validate.id(userId, 'User ID');
      validate.string(title, 'Announcement title', { required: true, maxLength: 255 });
      validate.string(content, 'Announcement content', { required: true, maxLength: 10000 });
      validate.string(priority, 'Announcement priority', { required: true, maxLength: 20 });
      
      // In a real implementation, you would check if the user has admin permissions
      
      // Create the broadcast message
      const { data, error } = await supabase
        .from('broadcast_messages')
        .insert([
          {
            sender_id: userId,
            title,
            content,
            priority,
            target_type: 'all_users',
            status: 'sent',
            sent_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to create announcement: ${error.message}`, 'CREATE_ERROR', 500);
      }
      
      logOperation('CREATE_ANNOUNCEMENT_SUCCESS', { announcementId: data.id, userId });
      return data;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('CREATE_ANNOUNCEMENT_VALIDATION_ERROR', { userId, error: error.message });
        console.error('Validation error in createAnnouncement:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('CREATE_ANNOUNCEMENT_ERROR', { userId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in createAnnouncement:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to create announcement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get announcements
  async getAnnouncements(userId: string, pagination: { page: number; limit: number }): Promise<any> {
    logOperation('GET_ANNOUNCEMENTS_START', { userId, pagination });
    try {
      // Validate input using enhanced validation
      validate.id(userId, 'User ID');
      
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;
      
      // In a real implementation, you would check if the user has admin permissions
      
      const { data, error } = await supabase
        .from('broadcast_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        throw new DatabaseError(`Failed to fetch announcements: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_ANNOUNCEMENTS_SUCCESS', { userId, count: data?.length || 0 });
      return {
        announcements: data || [],
        pagination: {
          page,
          limit,
          total: data?.length || 0,
          hasNext: false
        }
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_ANNOUNCEMENTS_VALIDATION_ERROR', { userId, error: error.message });
        console.error('Validation error in getAnnouncements:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('GET_ANNOUNCEMENTS_ERROR', { userId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in getAnnouncements:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch announcements: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete announcement
  async deleteAnnouncement(userId: string, announcementId: string): Promise<boolean> {
    logOperation('DELETE_ANNOUNCEMENT_START', { userId, announcementId });
    try {
      // Validate input using enhanced validation
      validate.id(userId, 'User ID');
      validate.id(announcementId, 'Announcement ID');
      
      // In a real implementation, you would check if the user has admin permissions
      
      // Delete the broadcast message
      const { error } = await supabase
        .from('broadcast_messages')
        .delete()
        .eq('id', announcementId);
      
      if (error) {
        throw new DatabaseError(`Failed to delete announcement: ${error.message}`, 'DELETE_ERROR', 500);
      }
      
      logOperation('DELETE_ANNOUNCEMENT_SUCCESS', { userId, announcementId });
      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('DELETE_ANNOUNCEMENT_VALIDATION_ERROR', { userId, announcementId, error: error.message });
        console.error('Validation error in deleteAnnouncement:', error.message);
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('DELETE_ANNOUNCEMENT_ERROR', { userId, announcementId, error: error instanceof Error ? error.message : 'Unknown error' });
      console.error('Error in deleteAnnouncement:', error);
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete announcement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================
  // LOGGER ASSIGNMENT METHODS
  // ============================================================

  /**
   * Create a new logger assignment
   * @param assignmentData - Logger assignment data
   * @returns The created assignment or null
   */
  async createLoggerAssignment(assignmentData: {
    logger_id: string;
    competition_id?: number | null;
    match_id?: number | null;
    assigned_by?: string;
    notes?: string;
    status?: 'active' | 'completed' | 'cancelled';
  }): Promise<any> {
    logOperation('CREATE_LOGGER_ASSIGNMENT_START', { assignmentData });
    try {
      // Validate required fields
      validate.id(assignmentData.logger_id, 'Logger ID');
      
      // Validate that at least one of competition_id or match_id is provided
      if (!assignmentData.competition_id && !assignmentData.match_id) {
        throw new ValidationError('Either competition_id or match_id must be provided', 'assignment');
      }
      
      // Validate competition_id if provided
      if (assignmentData.competition_id !== null && assignmentData.competition_id !== undefined) {
        validate.positiveIntegerId(assignmentData.competition_id, 'Competition ID');
      }
      
      // Validate match_id if provided
      if (assignmentData.match_id !== null && assignmentData.match_id !== undefined) {
        validate.positiveIntegerId(assignmentData.match_id, 'Match ID');
      }
      
      // Check for conflicts if match_id is provided
      if (assignmentData.match_id) {
        const { data: conflictCheck, error: conflictError } = await supabase
          .from('LoggerAssignments')
          .select('*')
          .eq('match_id', assignmentData.match_id)
          .eq('status', 'active')
          .single();
        
        if (conflictCheck) {
          throw new DatabaseError(
            'This match already has an active logger assigned',
            'ASSIGNMENT_CONFLICT',
            409
          );
        }
      }
      
      const { data, error } = await supabase
        .from('LoggerAssignments')
        .insert([{
          logger_id: assignmentData.logger_id,
          competition_id: assignmentData.competition_id || null,
          match_id: assignmentData.match_id || null,
          assigned_by: assignmentData.assigned_by || null,
          notes: assignmentData.notes || null,
          status: assignmentData.status || 'active'
        }])
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to create logger assignment: ${error.message}`, 'CREATE_ERROR', 500);
      }
      
      logOperation('CREATE_LOGGER_ASSIGNMENT_SUCCESS', { assignmentId: data?.id });
      return data;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('CREATE_LOGGER_ASSIGNMENT_VALIDATION_ERROR', { error: error.message });
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('CREATE_LOGGER_ASSIGNMENT_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to create logger assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get logger assignments with optional filters
   * @param filters - Filter criteria
   * @returns Array of logger assignments
   */
  async getLoggerAssignments(filters?: {
    logger_id?: string;
    competition_id?: number;
    match_id?: number;
    status?: 'active' | 'completed' | 'cancelled';
    assigned_by?: string;
  }): Promise<any[]> {
    logOperation('GET_LOGGER_ASSIGNMENTS_START', { filters });
    try {
      let query = supabase.from('LoggerAssignments').select('*');
      
      if (filters?.logger_id) {
        validate.id(filters.logger_id, 'Logger ID');
        query = query.eq('logger_id', filters.logger_id);
      }
      
      if (filters?.competition_id) {
        validate.positiveIntegerId(filters.competition_id, 'Competition ID');
        query = query.eq('competition_id', filters.competition_id);
      }
      
      if (filters?.match_id) {
        validate.positiveIntegerId(filters.match_id, 'Match ID');
        query = query.eq('match_id', filters.match_id);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.assigned_by) {
        validate.id(filters.assigned_by, 'Assigned By');
        query = query.eq('assigned_by', filters.assigned_by);
      }
      
      query = query.order('assigned_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        throw new DatabaseError(`Failed to fetch logger assignments: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_LOGGER_ASSIGNMENTS_SUCCESS', { count: data?.length || 0 });
      return data || [];
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_LOGGER_ASSIGNMENTS_VALIDATION_ERROR', { error: error.message });
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('GET_LOGGER_ASSIGNMENTS_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch logger assignments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get logger assignments with full details (joined with Logger, Competition, Match)
   * @param filters - Filter criteria
   * @returns Array of logger assignments with details
   */
  async getLoggerAssignmentsWithDetails(filters?: {
    logger_id?: string;
    competition_id?: number;
    match_id?: number;
    status?: 'active' | 'completed' | 'cancelled';
  }): Promise<any[]> {
    logOperation('GET_LOGGER_ASSIGNMENTS_WITH_DETAILS_START', { filters });
    try {
      const assignments = await this.getLoggerAssignments(filters);
      
      // Enrich with logger, competition, and match details
      const enrichedAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          const enriched: any = { ...assignment };
          
          // Fetch logger details
          if (assignment.logger_id) {
            const logger = await this.getLoggerById(assignment.logger_id);
            if (logger) {
              enriched.logger = {
                id: logger.id,
                name: logger.name,
                email: logger.email
              };
            }
          }
          
          // Fetch competition details
          if (assignment.competition_id) {
            const competition = await this.getCompetitionById(assignment.competition_id);
            if (competition) {
              enriched.competition = {
                id: competition.id,
                name: competition.name,
                type: competition.type
              };
            }
          }
          
          // Fetch match details
          if (assignment.match_id) {
            const matches = await this.getMatches();
            const match = matches.find(m => m.id === assignment.match_id);
            if (match) {
              enriched.match = {
                id: match.id,
                home_team_id: match.home_team_id,
                away_team_id: match.away_team_id,
                match_date: match.match_date,
                status: match.status
              };
            }
          }
          
          return enriched;
        })
      );
      
      logOperation('GET_LOGGER_ASSIGNMENTS_WITH_DETAILS_SUCCESS', { count: enrichedAssignments.length });
      return enrichedAssignments;
    } catch (error) {
      logOperation('GET_LOGGER_ASSIGNMENTS_WITH_DETAILS_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch logger assignments with details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a logger assignment by ID
   * @param assignmentId - Assignment ID
   * @returns Logger assignment or null
   */
  async getLoggerAssignmentById(assignmentId: string): Promise<any | null> {
    logOperation('GET_LOGGER_ASSIGNMENT_BY_ID_START', { assignmentId });
    try {
      validate.id(assignmentId, 'Assignment ID');
      
      const { data, error } = await supabase
        .from('LoggerAssignments')
        .select('*')
        .eq('id', assignmentId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new DatabaseError(`Failed to fetch logger assignment: ${error.message}`, 'FETCH_ERROR', 500);
      }
      
      logOperation('GET_LOGGER_ASSIGNMENT_BY_ID_SUCCESS', { assignmentId });
      return data;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('GET_LOGGER_ASSIGNMENT_BY_ID_VALIDATION_ERROR', { error: error.message });
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('GET_LOGGER_ASSIGNMENT_BY_ID_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch logger assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a logger assignment
   * @param assignmentId - Assignment ID
   * @param updates - Fields to update
   * @returns Updated assignment or null
   */
  async updateLoggerAssignment(
    assignmentId: string,
    updates: {
      status?: 'active' | 'completed' | 'cancelled';
      notes?: string;
    }
  ): Promise<any | null> {
    logOperation('UPDATE_LOGGER_ASSIGNMENT_START', { assignmentId, updates });
    try {
      validate.id(assignmentId, 'Assignment ID');
      
      const { data, error } = await supabase
        .from('LoggerAssignments')
        .update(updates)
        .eq('id', assignmentId)
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError(`Failed to update logger assignment: ${error.message}`, 'UPDATE_ERROR', 500);
      }
      
      logOperation('UPDATE_LOGGER_ASSIGNMENT_SUCCESS', { assignmentId });
      return data;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('UPDATE_LOGGER_ASSIGNMENT_VALIDATION_ERROR', { error: error.message });
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('UPDATE_LOGGER_ASSIGNMENT_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update logger assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a logger assignment (unassign)
   * @param assignmentId - Assignment ID
   * @returns True if successful
   */
  async deleteLoggerAssignment(assignmentId: string): Promise<boolean> {
    logOperation('DELETE_LOGGER_ASSIGNMENT_START', { assignmentId });
    try {
      validate.id(assignmentId, 'Assignment ID');
      
      const { error } = await supabase
        .from('LoggerAssignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) {
        throw new DatabaseError(`Failed to delete logger assignment: ${error.message}`, 'DELETE_ERROR', 500);
      }
      
      logOperation('DELETE_LOGGER_ASSIGNMENT_SUCCESS', { assignmentId });
      return true;
    } catch (error) {
      if (error instanceof ValidationError) {
        logOperation('DELETE_LOGGER_ASSIGNMENT_VALIDATION_ERROR', { error: error.message });
        throw new DatabaseError(`Validation failed: ${error.message}`, 'VALIDATION_ERROR', 400);
      }
      logOperation('DELETE_LOGGER_ASSIGNMENT_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete logger assignment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get competitions assigned to a logger
   * @param loggerId - Logger ID
   * @param status - Optional status filter
   * @returns Array of competition IDs
   */
  async getLoggerCompetitionIds(
    loggerId: string,
    status: 'active' | 'completed' | 'cancelled' = 'active'
  ): Promise<number[]> {
    logOperation('GET_LOGGER_COMPETITION_IDS_START', { loggerId, status });
    try {
      validate.id(loggerId, 'Logger ID');
      
      const assignments = await this.getLoggerAssignments({
        logger_id: loggerId,
        status
      });
      
      // Extract unique competition IDs
      const competitionIds = assignments
        .filter(a => a.competition_id !== null)
        .map(a => a.competition_id);
      
      const uniqueIds = [...new Set(competitionIds)];
      
      logOperation('GET_LOGGER_COMPETITION_IDS_SUCCESS', { count: uniqueIds.length });
      return uniqueIds;
    } catch (error) {
      logOperation('GET_LOGGER_COMPETITION_IDS_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch logger competition IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get matches assigned to a logger
   * @param loggerId - Logger ID
   * @param status - Optional status filter
   * @returns Array of match IDs
   */
  async getLoggerMatchIds(
    loggerId: string,
    status: 'active' | 'completed' | 'cancelled' = 'active'
  ): Promise<number[]> {
    logOperation('GET_LOGGER_MATCH_IDS_START', { loggerId, status });
    try {
      validate.id(loggerId, 'Logger ID');
      
      const assignments = await this.getLoggerAssignments({
        logger_id: loggerId,
        status
      });
      
      // Extract unique match IDs
      const matchIds = assignments
        .filter(a => a.match_id !== null)
        .map(a => a.match_id);
      
      const uniqueIds = [...new Set(matchIds)];
      
      logOperation('GET_LOGGER_MATCH_IDS_SUCCESS', { count: uniqueIds.length });
      return uniqueIds;
    } catch (error) {
      logOperation('GET_LOGGER_MATCH_IDS_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to fetch logger match IDs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export a singleton instance
export const databaseService = new DatabaseService();

// Export dbService as an alias for backward compatibility
export const dbService = databaseService;