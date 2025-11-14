import { logger } from '../utils/logger';
import { databaseSecurityService } from './security/database-security.service';
import { authorizationService } from './security/authorization.service';
import { supabaseService, supabase } from './supabase.service';
import { ValidationError, DatabaseError } from './error.handler.service';

// Centralized Database Service with enhanced security features
export interface CentralizedDatabaseService {
  // CRUD operations with security
  create<T>(table: string, data: Partial<T>, userId: string, permissions: string[]): Promise<T>;
  read<T>(table: string, filters: any, userId: string, permissions: string[]): Promise<T[]>;
  update<T>(table: string, id: string, data: Partial<T>, userId: string, permissions: string[]): Promise<T | null>;
  delete<T>(table: string, id: string, userId: string, permissions: string[]): Promise<boolean>;
  
  // Security features
  maskSensitiveFields<T>(data: T, fields: string[]): Promise<T>;
  encryptField(value: string): Promise<string>;
  decryptField(encryptedValue: string): Promise<string>;
  hashPassword(password: string): Promise<string>;
  auditAccess(userId: string, operation: string, resource: string, details?: any): Promise<void>;
  checkPermissions(userId: string, resource: string, action: string): Promise<boolean>;
  
  // Validation
  validateData<T>(data: Partial<T>, schema: any): Promise<void>;
}

// Validation schema interface
interface ValidationSchema {
  [field: string]: {
    required?: boolean;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'date';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
  };
}

export const centralizedDatabaseService: CentralizedDatabaseService = {
  // Create operation with security
  create: async <T>(table: string, data: Partial<T>, userId: string, permissions: string[]): Promise<T> => {
    try {
      logger.info('Creating record in centralized database', { table, userId });
      
      // Check permissions
      const hasPermission = await centralizedDatabaseService.checkPermissions(userId, table, 'create');
      if (!hasPermission) {
        throw new DatabaseError('Insufficient permissions to create record', 'PERMISSION_DENIED', 403);
      }
      
      // Audit the operation
      await centralizedDatabaseService.auditAccess(userId, 'create', table, { data: Object.keys(data) });
      
      // Create the record using supabase service with specific method based on table name
      let result;
      const methodName = `create${table}`;
      if (typeof (supabaseService as any)[methodName] === 'function') {
        result = await (supabaseService as any)[methodName](data);
      } else {
        // Fallback to generic insert operation
        logger.info(`Using generic create for table ${table}`);
        const { data: createdData, error } = await supabase
          .from(table)
          .insert(data)
          .select()
          .single();
        
        if (error) {
          throw new DatabaseError(`Failed to create record: ${error.message}`, 'CREATE_FAILED', 500);
        }
        
        result = {
          success: true,
          data: createdData
        };
      }
      
      if (!result?.success) {
        throw new DatabaseError('Failed to create record', 'CREATE_FAILED', 500);
      }
      
      logger.info('Record created successfully', { table, userId, recordId: result.data?.id });
      return result.data;
    } catch (error: any) {
      logger.error('Error creating record', { error: error.message, table, userId });
      throw error;
    }
  },
  
  // Read operation with security
  read: async <T>(table: string, filters: any, userId: string, permissions: string[]): Promise<T[]> => {
    try {
      logger.info('Reading records from centralized database', { table, userId, filters });
      
      // Check permissions
      const hasPermission = await centralizedDatabaseService.checkPermissions(userId, table, 'read');
      if (!hasPermission) {
        throw new DatabaseError('Insufficient permissions to read records', 'PERMISSION_DENIED', 403);
      }
      
      // Audit the operation
      await centralizedDatabaseService.auditAccess(userId, 'read', table, { filters: Object.keys(filters || {}) });
      
      // Read the records using supabase service with specific method based on table name
      let result;
      const listMethodName = `list${table}`;
      const getMethodName = `get${table}`;

      if (typeof (supabaseService as any)[listMethodName] === 'function') {
        result = await (supabaseService as any)[listMethodName](filters);
      } else if (typeof (supabaseService as any)[getMethodName] === 'function' && filters.id) {
        // For single record retrieval
        result = await (supabaseService as any)[getMethodName](filters.id);
        // Convert single record to array format
        if (result?.success && result.data) {
          result.data = Array.isArray(result.data) ? result.data : [result.data];
        }
      } else {
        // Fallback to generic select operation
        logger.info(`Using generic read for table ${table}`);
        let query = supabase.from(table).select('*');
        
        // Apply filters if provided
        if (filters) {
          Object.keys(filters).forEach(key => {
            if (key !== 'id' || !filters.id) { // Skip 'id' as it's handled specially
              query = query.eq(key, filters[key]);
            }
          });
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw new DatabaseError(`Failed to read records: ${error.message}`, 'READ_FAILED', 500);
        }
        
        result = {
          success: true,
          data: data || []
        };
      }
      
      if (!result?.success) {
        throw new DatabaseError('Failed to read records', 'READ_FAILED', 500);
      }
      
      // Mask sensitive data if needed
      const maskedData = await centralizedDatabaseService.maskSensitiveFields(result.data, ['password', 'token', 'secret']);
      
      logger.info('Records read successfully', { table, userId, count: result.data?.length });
      return maskedData as T[];
    } catch (error: any) {
      logger.error('Error reading records', { error: error.message, table, userId });
      throw error;
    }
  },
  
  // Update operation with security
  update: async <T>(table: string, id: string, data: Partial<T>, userId: string, permissions: string[]): Promise<T | null> => {
    try {
      logger.info('Updating record in centralized database', { table, id, userId });
      
      // Check permissions
      const hasPermission = await centralizedDatabaseService.checkPermissions(userId, table, 'update');
      if (!hasPermission) {
        throw new DatabaseError('Insufficient permissions to update record', 'PERMISSION_DENIED', 403);
      }
      
      // Audit the operation
      await centralizedDatabaseService.auditAccess(userId, 'update', table, { id, fields: Object.keys(data) });
      
      // Update the record using supabase service with specific method based on table name
      let result;
      const methodName = `update${table}`;
      if (typeof (supabaseService as any)[methodName] === 'function') {
        result = await (supabaseService as any)[methodName](id, data);
      } else {
        // Fallback to generic update operation
        logger.info(`Using generic update for table ${table}`);
        const { data: updatedData, error } = await supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          throw new DatabaseError(`Failed to update record: ${error.message}`, 'UPDATE_FAILED', 500);
        }
        
        if (!updatedData) {
          throw new DatabaseError('Record not found', 'NOT_FOUND', 404);
        }
        
        result = {
          success: true,
          data: updatedData
        };
      }
      
      if (!result?.success) {
        throw new DatabaseError('Failed to update record', 'UPDATE_FAILED', 500);
      }
      
      logger.info('Record updated successfully', { table, id, userId });
      return result.data;
    } catch (error: any) {
      logger.error('Error updating record', { error: error.message, table, id, userId });
      throw error;
    }
  },
  
  // Delete operation with security
  delete: async <T>(table: string, id: string, userId: string, permissions: string[]): Promise<boolean> => {
    try {
      logger.info('Deleting record from centralized database', { table, id, userId });
      
      // Check permissions
      const hasPermission = await centralizedDatabaseService.checkPermissions(userId, table, 'delete');
      if (!hasPermission) {
        throw new DatabaseError('Insufficient permissions to delete record', 'PERMISSION_DENIED', 403);
      }
      
      // Audit the operation
      await centralizedDatabaseService.auditAccess(userId, 'delete', table, { id });
      
      // Delete the record using supabase service with specific method based on table name
      let result;
      const methodName = `delete${table}`;
      if (typeof (supabaseService as any)[methodName] === 'function') {
        result = await (supabaseService as any)[methodName](id);
      } else {
        // Fallback to generic delete operation
        logger.info(`Using generic delete for table ${table}`);
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        
        if (error) {
          throw new DatabaseError(`Failed to delete record: ${error.message}`, 'DELETE_FAILED', 500);
        }
        
        result = {
          success: true,
          data: null
        };
      }
      
      if (!result?.success) {
        throw new DatabaseError('Failed to delete record', 'DELETE_FAILED', 500);
      }
      
      logger.info('Record deleted successfully', { table, id, userId });
      return true;
    } catch (error: any) {
      logger.error('Error deleting record', { error: error.message, table, id, userId });
      throw error;
    }
  },
  
  // Mask sensitive fields
  maskSensitiveFields: async <T>(data: T, fields: string[]): Promise<T> => {
    return await databaseSecurityService.maskSensitiveData(data, fields);
  },
  
  // Encrypt field
  encryptField: async (value: string): Promise<string> => {
    return await databaseSecurityService.encryptField(value);
  },
  
  // Decrypt field
  decryptField: async (encryptedValue: string): Promise<string> => {
    return await databaseSecurityService.decryptField(encryptedValue);
  },
  
  // Hash password
  hashPassword: async (password: string): Promise<string> => {
    return await databaseSecurityService.hashPassword(password);
  },
  
  // Audit database access
  auditAccess: async (userId: string, operation: string, resource: string, details?: any): Promise<void> => {
    const auditDetails = {
      operation,
      resource,
      timestamp: new Date().toISOString(),
      ...details
    };
    
    await databaseSecurityService.auditDatabaseAccess(userId, operation, resource);
    logger.info('Database access audited', { userId, operation, resource, details: auditDetails });
  },
  
  // Check permissions
  checkPermissions: async (userId: string, resource: string, action: string): Promise<boolean> => {
    // First check database security service
    const dbPermission = await databaseSecurityService.checkDatabasePermissions(userId, resource, action);
    if (dbPermission) {
      return true;
    }
    
    // Then check authorization service
    return await authorizationService.hasPermission(userId, `${resource}:${action}`);
  },
  
  // Validate data against schema
  validateData: async <T>(data: Partial<T>, schema: ValidationSchema): Promise<void> => {
    for (const field in schema) {
      const fieldSchema = schema[field];
      const value = (data as any)[field];
      
      // Check required fields
      if (fieldSchema.required && (value === undefined || value === null)) {
        throw new ValidationError(`Field '${field}' is required`);
      }
      
      // Skip validation for optional undefined values
      if (!fieldSchema.required && (value === undefined || value === null)) {
        continue;
      }
      
      // Type validation
      switch (fieldSchema.type) {
        case 'string':
          if (typeof value !== 'string') {
            throw new ValidationError(`Field '${field}' must be a string`);
          }
          if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
            throw new ValidationError(`Field '${field}' must be at least ${fieldSchema.minLength} characters long`);
          }
          if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
            throw new ValidationError(`Field '${field}' must be no more than ${fieldSchema.maxLength} characters long`);
          }
          if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
            throw new ValidationError(`Field '${field}' format is invalid`);
          }
          break;
          
        case 'email':
          if (typeof value !== 'string') {
            throw new ValidationError(`Field '${field}' must be a string`);
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            throw new ValidationError(`Field '${field}' must be a valid email address`);
          }
          break;
          
        case 'number':
          if (typeof value !== 'number') {
            throw new ValidationError(`Field '${field}' must be a number`);
          }
          if (fieldSchema.min !== undefined && value < fieldSchema.min) {
            throw new ValidationError(`Field '${field}' must be at least ${fieldSchema.min}`);
          }
          if (fieldSchema.max !== undefined && value > fieldSchema.max) {
            throw new ValidationError(`Field '${field}' must be no more than ${fieldSchema.max}`);
          }
          break;
          
        case 'boolean':
          if (typeof value !== 'boolean') {
            throw new ValidationError(`Field '${field}' must be a boolean`);
          }
          break;
          
        case 'date':
          if (!(value instanceof Date) && typeof value !== 'string') {
            throw new ValidationError(`Field '${field}' must be a date`);
          }
          // Try to parse date string
          if (typeof value === 'string') {
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              throw new ValidationError(`Field '${field}' must be a valid date`);
            }
          }
          break;
          
        case 'array':
          if (!Array.isArray(value)) {
            throw new ValidationError(`Field '${field}' must be an array`);
          }
          if (fieldSchema.minLength !== undefined && value.length < fieldSchema.minLength) {
            throw new ValidationError(`Field '${field}' must contain at least ${fieldSchema.minLength} items`);
          }
          if (fieldSchema.maxLength !== undefined && value.length > fieldSchema.maxLength) {
            throw new ValidationError(`Field '${field}' must contain no more than ${fieldSchema.maxLength} items`);
          }
          break;
          
        case 'object':
          if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new ValidationError(`Field '${field}' must be an object`);
          }
          break;
      }
      
      // Enum validation
      if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
        throw new ValidationError(`Field '${field}' must be one of: ${fieldSchema.enum.join(', ')}`);
      }
    }
  }
};