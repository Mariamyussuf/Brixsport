import { logger } from '@utils/logger';
import { encryptionService } from './encryption.service';
import { redisService } from '../redis.service';
import { supabaseService } from '../supabase.service';

export interface DatabaseSecurityService {
  maskSensitiveData<T>(data: T, fields: string[]): Promise<T>;
  encryptField(value: string): Promise<string>;
  decryptField(encryptedValue: string): Promise<string>;
  auditDatabaseAccess(userId: string, query: string, resource: string): Promise<void>;
  checkDatabasePermissions(userId: string, resource: string, action: string): Promise<boolean>;
  // New methods for production-ready implementation
  flushAuditLogs(): Promise<void>;
  getAuditLogs(filters: any): Promise<any[]>;
  setPermission(userId: string, resource: string, action: string, allowed: boolean): Promise<void>;
  getPermission(userId: string, resource: string, action: string): Promise<boolean | null>;
}

// Redis key for audit log buffering
const AUDIT_LOG_BUFFER_KEY = 'db:audit:buffer';

export const databaseSecurityService: DatabaseSecurityService = {
  maskSensitiveData: async <T>(data: T, fields: string[]): Promise<T> => {
    try {
      logger.debug('Masking sensitive data', { fields: fields.join(', ') });
      
      // If data is an array, process each item
      if (Array.isArray(data)) {
        return data.map(item => {
          const maskedItem = { ...item as any };
          fields.forEach(field => {
            if (maskedItem[field]) {
              // Mask the field value (show first 2 and last 2 characters, mask the rest)
              const value = maskedItem[field].toString();
              if (value.length > 4) {
                maskedItem[field] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
              } else {
                maskedItem[field] = '*'.repeat(value.length);
              }
            }
          });
          return maskedItem;
        }) as unknown as T;
      }
      
      // If data is an object, process it directly
      if (typeof data === 'object' && data !== null) {
        const maskedData = { ...data as any };
        fields.forEach(field => {
          if (maskedData[field]) {
            // Mask the field value (show first 2 and last 2 characters, mask the rest)
            const value = maskedData[field].toString();
            if (value.length > 4) {
              maskedData[field] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
            } else {
              maskedData[field] = '*'.repeat(value.length);
            }
            }
        });
        return maskedData as unknown as T;
      }
      
      // For primitive types, just return as is
      return data;
    } catch (error: any) {
      logger.error('Data masking error', error);
      throw error;
    }
  },
  
  encryptField: async (value: string): Promise<string> => {
    try {
      logger.debug('Encrypting database field');
      
      const encryptedData = await encryptionService.encrypt(value);
      const encryptedString = JSON.stringify(encryptedData);
      
      logger.debug('Database field encrypted');
      
      return encryptedString;
    } catch (error: any) {
      logger.error('Field encryption error', error);
      throw error;
    }
  },
  
  decryptField: async (encryptedValue: string): Promise<string> => {
    try {
      logger.debug('Decrypting database field');
      
      const encryptedData = JSON.parse(encryptedValue);
      const decryptedValue = await encryptionService.decrypt(encryptedData);
      
      logger.debug('Database field decrypted');
      
      return decryptedValue;
    } catch (error: any) {
      logger.error('Field decryption error', error);
      throw error;
    }
  },
  
  auditDatabaseAccess: async (userId: string, query: string, resource: string): Promise<void> => {
    try {
      logger.debug('Auditing database access', { userId, resource });
      
      // Create audit log entry
      const auditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        userId,
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''), // Truncate long queries
        resource,
        ip: '', // Would be captured from request context in real implementation
        userAgent: '' // Would be captured from request context in real implementation
      };
      
      // Add to Redis buffer for performance
      await redisService.lpush(AUDIT_LOG_BUFFER_KEY, JSON.stringify(auditEntry));
      
      // Keep only the last 1000 entries in the buffer
      await redisService.ltrim(AUDIT_LOG_BUFFER_KEY, 0, 999);
      
      logger.info('Database access audited', { userId, resource });
    } catch (error: any) {
      logger.error('Database access audit error', error);
      throw error;
    }
  },
  
  checkDatabasePermissions: async (userId: string, resource: string, action: string): Promise<boolean> => {
    try {
      logger.debug('Checking database permissions', { userId, resource, action });
      
      // Check in Redis cache first
      const cacheKey = `db:permission:${userId}:${resource}:${action}`;
      const cachedPermission = await redisService.get(cacheKey);
      
      if (cachedPermission !== null) {
        const hasPermission = cachedPermission === 'true';
        logger.debug('Database permission check completed (from cache)', { userId, resource, action, hasPermission });
        return hasPermission;
      }
      
      // If not in cache, check in database
      const hasPermission = await databaseSecurityService.getPermission(userId, resource, action);
      
      // Cache the result for 5 minutes
      await redisService.set(cacheKey, hasPermission ? 'true' : 'false', 300);
      
      logger.debug('Database permission check completed', { userId, resource, action, hasPermission });
      
      return hasPermission || false;
    } catch (error: any) {
      logger.error('Database permission check error', error);
      return false;
    }
  },
  
  // New methods for production-ready implementation
  flushAuditLogs: async (): Promise<void> => {
    try {
      logger.debug('Flushing database audit logs');
      
      // Get all entries from Redis buffer
      const auditLogs = await redisService.lrange(AUDIT_LOG_BUFFER_KEY, 0, -1);
      
      if (auditLogs.length === 0) {
        logger.debug('No audit logs to flush');
        return;
      }
      
      // Convert string entries back to objects
      const auditEntries = auditLogs.map(log => JSON.parse(log));
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('DatabaseAuditLogs')
        .insert(auditEntries);
      
      if (error) {
        logger.error('Error saving audit logs to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Clear Redis buffer
      await redisService.del(AUDIT_LOG_BUFFER_KEY);
      
      logger.info('Database audit logs flushed to database', { count: auditEntries.length });
    } catch (error: any) {
      logger.error('Error flushing database audit logs', { error: error.message });
      throw error;
    }
  },
  
  getAuditLogs: async (filters: any): Promise<any[]> => {
    try {
      logger.debug('Retrieving database audit logs', { filters });
      
      // First, flush any buffered logs
      await databaseSecurityService.flushAuditLogs();
      
      // Query database for audit logs
      let query = (supabaseService as any).supabase
        .from('DatabaseAuditLogs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      // Apply filters
      if (filters.userId) {
        query = query.eq('userId', filters.userId);
      }
      
      if (filters.resource) {
        query = query.eq('resource', filters.resource);
      }
      
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        logger.error('Error retrieving audit logs from database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      logger.debug('Database audit logs retrieved', { count: data.length });
      return data;
    } catch (error: any) {
      logger.error('Error retrieving database audit logs', { error: error.message });
      throw error;
    }
  },
  
  setPermission: async (userId: string, resource: string, action: string, allowed: boolean): Promise<void> => {
    try {
      logger.debug('Setting database permission', { userId, resource, action, allowed });
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('DatabasePermissions')
        .upsert({
          userId,
          resource,
          action,
          allowed,
          updatedAt: new Date().toISOString()
        }, {
          onConflict: 'userId,resource,action'
        });
      
      if (error) {
        logger.error('Error saving permission to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Update cache
      const cacheKey = `db:permission:${userId}:${resource}:${action}`;
      await redisService.set(cacheKey, allowed ? 'true' : 'false', 300);
      
      logger.debug('Database permission set', { userId, resource, action, allowed });
    } catch (error: any) {
      logger.error('Error setting database permission', { error: error.message });
      throw error;
    }
  },
  
  getPermission: async (userId: string, resource: string, action: string): Promise<boolean | null> => {
    try {
      logger.debug('Getting database permission', { userId, resource, action });
      
      // Get from database
      const { data, error } = await (supabaseService as any).supabase
        .from('DatabasePermissions')
        .select('allowed')
        .eq('userId', userId)
        .eq('resource', resource)
        .eq('action', action)
        .single();
      
      if (error) {
        logger.warn('Database permission not found', { userId, resource, action, error: error.message });
        return null;
      }
      
      logger.debug('Database permission retrieved', { userId, resource, action, allowed: data.allowed });
      return data.allowed;
    } catch (error: any) {
      logger.error('Error getting database permission', { error: error.message });
      throw error;
    }
  }
};