import { logger } from '@utils/logger';
import { z, ZodSchema } from 'zod';
import sanitizeHtml from 'sanitize-html';
import validator from 'validator';
import { redisService } from '../redis.service';
import { supabaseService } from '../supabase.service';

export interface FieldValidation {
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'date' | 'object' | 'array' | 'phone' | 'uuid' | 'json';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  sanitize?: boolean;
  trim?: boolean;
  normalize?: boolean;
}

export interface ValidationSchema<T> {
  fields: {
    [K in keyof T]: FieldValidation;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult<T> {
  isValid: boolean;
  data: T;
  errors: ValidationError[];
}

export interface ValidationService {
  validateInput<T>(data: any, schema: ValidationSchema<T>): Promise<ValidationResult<T>>;
  sanitizeHTML(html: string): Promise<string>;
  sanitizeURL(url: string): Promise<string>;
  sanitizeInput(input: string): Promise<string>;
  validateFile(file: UploadedFile, allowedTypes: string[], maxSize: number): Promise<boolean>;
  validatePhone(phone: string, countryCode?: string): Promise<boolean>;
  validateJSON(jsonString: string): Promise<any>;
  // New methods for production-ready implementation
  getValidationRules(resource: string): Promise<any>;
  setValidationRules(resource: string, rules: any): Promise<void>;
  clearValidationCache(resource: string): Promise<void>;
}

export interface UploadedFile {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
  path?: string;
}

export const validationService: ValidationService = {
  validateInput: async <T>(data: any, schema: ValidationSchema<T>): Promise<ValidationResult<T>> => {
    try {
      logger.debug('Validating input data');
      
      const errors: ValidationError[] = [];
      const sanitizedData: any = {};
      
      // Validate each field according to schema
      for (const [fieldName, fieldConfig] of Object.entries(schema.fields)) {
        const value = data[fieldName];
        const config = fieldConfig as FieldValidation; // Type assertion to fix TypeScript error
        
        // Required field check
        if (config.required && (value === undefined || value === null || value === '')) {
          errors.push({
            field: fieldName,
            message: `${fieldName} is required`,
            code: 'required'
          });
          continue;
        }
        
        // Skip validation for optional fields that are not provided
        if (value === undefined || value === null || value === '') {
          continue;
        }
        
        // Type-specific validation
        switch (config.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be a string`,
                code: 'type_mismatch'
              });
              continue;
            }
            
            let processedValue = value;
            
            // Trim whitespace if requested
            if (config.trim) {
              processedValue = processedValue.trim();
            }
            
            // Length validation
            if (config.minLength && processedValue.length < config.minLength) {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be at least ${config.minLength} characters`,
                code: 'min_length'
              });
            }
            
            if (config.maxLength && processedValue.length > config.maxLength) {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be no more than ${config.maxLength} characters`,
                code: 'max_length'
              });
            }
            
            // Pattern validation
            if (config.pattern && !config.pattern.test(processedValue)) {
              errors.push({
                field: fieldName,
                message: `${fieldName} format is invalid`,
                code: 'pattern_mismatch'
              });
            }
            
            // Enum validation
            if (config.enum && !config.enum.includes(processedValue)) {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be one of: ${config.enum.join(', ')}`,
                code: 'invalid_enum'
              });
            }
            
            // Sanitize if requested
            sanitizedData[fieldName] = config.sanitize ? await validationService.sanitizeInput(processedValue) : processedValue;
            break;
            
          case 'number':
            const numValue = Number(value);
            if (isNaN(numValue)) {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be a number`,
                code: 'type_mismatch'
              });
              continue;
            }
            
            if (config.min !== undefined && numValue < config.min) {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be at least ${config.min}`,
                code: 'min_value'
              });
            }
            
            if (config.max !== undefined && numValue > config.max) {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be no more than ${config.max}`,
                code: 'max_value'
              });
            }
            
            sanitizedData[fieldName] = numValue;
            break;
            
          case 'boolean':
            if (typeof value !== 'boolean') {
              // Accept string representations of boolean
              if (value === 'true') {
                sanitizedData[fieldName] = true;
              } else if (value === 'false') {
                sanitizedData[fieldName] = false;
              } else {
                errors.push({
                  field: fieldName,
                  message: `${fieldName} must be a boolean`,
                  code: 'type_mismatch'
                });
              }
            } else {
              sanitizedData[fieldName] = value;
            }
            break;
            
          case 'email':
            if (typeof value !== 'string' || !validator.isEmail(value)) {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be a valid email address`,
                code: 'invalid_email'
              });
            } else {
              let emailValue = value;
              if (config.normalize) {
                emailValue = validator.normalizeEmail(emailValue) || emailValue;
              }
              sanitizedData[fieldName] = config.sanitize ? await validationService.sanitizeInput(emailValue) : emailValue;
            }
            break;
            
          case 'url':
            if (typeof value !== 'string' || !validator.isURL(value)) {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be a valid URL`,
                code: 'invalid_url'
              });
            } else {
              sanitizedData[fieldName] = config.sanitize ? await validationService.sanitizeInput(value) : value;
            }
            break;
            
          case 'date':
            if (!(value instanceof Date) && !validator.isISO8601(value)) {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be a valid date`,
                code: 'invalid_date'
              });
            } else {
              sanitizedData[fieldName] = value instanceof Date ? value : new Date(value);
            }
            break;
            
          case 'phone':
            if (typeof value !== 'string') {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be a string`,
                code: 'type_mismatch'
              });
            } else {
              const isValidPhone = await validationService.validatePhone(value);
              if (!isValidPhone) {
                errors.push({
                  field: fieldName,
                  message: `${fieldName} must be a valid phone number`,
                  code: 'invalid_phone'
                });
              } else {
                sanitizedData[fieldName] = config.sanitize ? await validationService.sanitizeInput(value) : value;
              }
            }
            break;
            
          case 'uuid':
            if (typeof value !== 'string' || !validator.isUUID(value)) {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be a valid UUID`,
                code: 'invalid_uuid'
              });
            } else {
              sanitizedData[fieldName] = value;
            }
            break;
            
          case 'json':
            try {
              const parsed = await validationService.validateJSON(value);
              sanitizedData[fieldName] = parsed;
            } catch (jsonError) {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be valid JSON`,
                code: 'invalid_json'
              });
            }
            break;
            
          default:
            sanitizedData[fieldName] = value;
        }
      }
      
      const isValid = errors.length === 0;
      
      logger.debug('Input validation completed', { isValid, errorCount: errors.length });
      
      return {
        isValid,
        data: sanitizedData as T,
        errors
      };
    } catch (error: any) {
      logger.error('Input validation error', error);
      throw error;
    }
  },
  
  sanitizeHTML: async (html: string): Promise<string> => {
    try {
      logger.debug('Sanitizing HTML content');
      
      const sanitized = sanitizeHtml(html, {
        allowedTags: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
          'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
          'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span'
        ],
        allowedAttributes: {
          a: ['href', 'name', 'target'],
          img: ['src'],
          span: ['class']
        },
        // Lots of these won't come up by default because we don't allow them
        selfClosing: ['img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],
        // URL schemes we permit
        allowedSchemes: ['http', 'https', 'ftp', 'mailto'],
        allowedSchemesByTag: {},
        allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
        allowProtocolRelative: true
      });
      
      logger.debug('HTML sanitized');
      return sanitized;
    } catch (error: any) {
      logger.error('HTML sanitization error', error);
      throw error;
    }
  },
  
  sanitizeURL: async (url: string): Promise<string> => {
    try {
      logger.debug('Sanitizing URL');
      
      // Validate URL format
      if (!validator.isURL(url)) {
        throw new Error('Invalid URL format');
      }
      
      // Normalize URL
      const normalized = validator.normalizeEmail(url) || url;
      
      logger.debug('URL sanitized');
      return normalized;
    } catch (error: any) {
      logger.error('URL sanitization error', error);
      throw error;
    }
  },
  
  sanitizeInput: async (input: string): Promise<string> => {
    try {
      logger.debug('Sanitizing input');
      
      // Escape HTML entities
      let sanitized = validator.escape(input);
      
      // Remove null bytes
      sanitized = sanitized.replace(/\0/g, '');
      
      // Remove control characters except whitespace
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      
      logger.debug('Input sanitized');
      return sanitized;
    } catch (error: any) {
      logger.error('Input sanitization error', error);
      throw error;
    }
  },
  
  validateFile: async (file: UploadedFile, allowedTypes: string[], maxSize: number): Promise<boolean> => {
    try {
      logger.debug('Validating file upload', { 
        fileName: file.originalName, 
        mimeType: file.mimeType, 
        size: file.size 
      });
      
      // Check file size
      if (file.size > maxSize) {
        logger.warn('File too large', { 
          fileName: file.originalName, 
          size: file.size, 
          maxSize 
        });
        return false;
      }
      
      // Check file type
      if (!allowedTypes.includes(file.mimeType)) {
        logger.warn('File type not allowed', { 
          fileName: file.originalName, 
          mimeType: file.mimeType, 
          allowedTypes 
        });
        return false;
      }
      
      // Additional security checks could be added here
      // For example, checking file content, scanning for malware, etc.
      
      logger.debug('File validation passed', { fileName: file.originalName });
      return true;
    } catch (error: any) {
      logger.error('File validation error', error);
      return false;
    }
  },
  
  validatePhone: async (phone: string, countryCode: string = 'US'): Promise<boolean> => {
    try {
      logger.debug('Validating phone number');
      
      // Remove all non-digit characters except +
      const cleaned = phone.replace(/[^\d+]/g, '');
      
      // Check if it's a valid phone number
      const isValid = validator.isMobilePhone(cleaned, countryCode as any);
      
      logger.debug('Phone validation completed', { isValid });
      return isValid;
    } catch (error: any) {
      logger.error('Phone validation error', error);
      return false;
    }
  },
  
  validateJSON: async (jsonString: string): Promise<any> => {
    try {
      logger.debug('Validating JSON');
      
      // Check if it's a valid JSON string
      const parsed = JSON.parse(jsonString);
      
      logger.debug('JSON validation completed');
      return parsed;
    } catch (error: any) {
      logger.error('JSON validation error', error);
      throw error;
    }
  },
  
  // New methods for production-ready implementation
  getValidationRules: async (resource: string): Promise<any> => {
    try {
      logger.debug('Getting validation rules for resource', { resource });
      
      // Try to get from Redis cache first
      const cacheKey = `validation:rules:${resource}`;
      const cachedRules = await redisService.get(cacheKey);
      
      if (cachedRules) {
        logger.debug('Validation rules retrieved from cache', { resource });
        return JSON.parse(cachedRules);
      }
      
      // If not in cache, get from database
      const { data, error } = await (supabaseService as any).supabase
        .from('ValidationRules')
        .select('*')
        .eq('resource', resource)
        .single();
      
      if (error) {
        logger.warn('Validation rules not found in database', { resource, error: error.message });
        return null;
      }
      
      // Cache the rules in Redis for 1 hour
      await redisService.set(cacheKey, JSON.stringify(data.rules), 3600);
      
      logger.debug('Validation rules retrieved from database and cached', { resource });
      return data.rules;
    } catch (error: any) {
      logger.error('Error getting validation rules', { resource, error: error.message });
      throw error;
    }
  },
  
  setValidationRules: async (resource: string, rules: any): Promise<void> => {
    try {
      logger.debug('Setting validation rules for resource', { resource });
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('ValidationRules')
        .upsert({
          resource: resource,
          rules: rules,
          updatedAt: new Date().toISOString()
        }, {
          onConflict: 'resource'
        });
      
      if (error) {
        logger.error('Error saving validation rules to database', { resource, error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Cache the rules in Redis for 1 hour
      const cacheKey = `validation:rules:${resource}`;
      await redisService.set(cacheKey, JSON.stringify(rules), 3600);
      
      logger.debug('Validation rules saved to database and cached', { resource });
    } catch (error: any) {
      logger.error('Error setting validation rules', { resource, error: error.message });
      throw error;
    }
  },
  
  clearValidationCache: async (resource: string): Promise<void> => {
    try {
      logger.debug('Clearing validation cache for resource', { resource });
      
      const cacheKey = `validation:rules:${resource}`;
      await redisService.del(cacheKey);
      
      logger.debug('Validation cache cleared', { resource });
    } catch (error: any) {
      logger.error('Error clearing validation cache', { resource, error: error.message });
      throw error;
    }
  }
};