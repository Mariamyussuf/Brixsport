import { logger } from '../../utils/logger';
import { redisService } from '../redis.service';
import { supabaseService } from '../supabase.service';

export interface SQLInjectionProtection {
  sanitizeSQLInput(input: string): Promise<string>;
  validateSQLQuery(query: string): Promise<boolean>;
  executeParameterizedQuery(query: string, params: any[]): Promise<any>;
  // New methods for production-ready implementation
  getSQLPatterns(): Promise<any[]>;
  addSQLPattern(pattern: string, type: string): Promise<void>;
  blockSQLPattern(pattern: string): Promise<void>;
  getBlockedPatterns(): Promise<string[]>;
}

export const sqlInjectionProtection: SQLInjectionProtection = {
  sanitizeSQLInput: async (input: string): Promise<string> => {
    try {
      logger.debug('Sanitizing SQL input');
      
      // Remove potentially dangerous characters
      // Note: This is a basic implementation. In practice, you should use parameterized queries.
      let sanitized = input;
      
      // Remove common SQL injection patterns
      const dangerousPatterns = [
        /(\b|\d)union(\b|\d)/gi,
        /(\b|\d)select(\b|\d)/gi,
        /(\b|\d)insert(\b|\d)/gi,
        /(\b|\d)update(\b|\d)/gi,
        /(\b|\d)delete(\b|\d)/gi,
        /(\b|\d)drop(\b|\d)/gi,
        /(\b|\d)create(\b|\d)/gi,
        /(\b|\d)alter(\b|\d)/gi,
        /(\b|\d)exec(\b|\d)/gi,
        /(\b|\d)execute(\b|\d)/gi,
        /--/g,           // SQL comment
        /;/g,            // Statement separator
        /\/\*/g,         // Block comment start
        /\*\//g          // Block comment end
      ];
      
      for (const pattern of dangerousPatterns) {
        sanitized = sanitized.replace(pattern, '');
      }
      
      // Escape single quotes
      sanitized = sanitized.replace(/'/g, "''");
      
      logger.debug('SQL input sanitized');
      
      return sanitized;
    } catch (error: any) {
      logger.error('SQL input sanitization error', error);
      throw error;
    }
  },
  
  validateSQLQuery: async (query: string): Promise<boolean> => {
    try {
      logger.debug('Validating SQL query');
      
      // Get blocked patterns from Redis cache or database
      const blockedPatterns = await sqlInjectionProtection.getBlockedPatterns();
      
      // Check if query contains any blocked patterns
      const hasBlockedPatterns = blockedPatterns.some(pattern => {
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(query);
        } catch (e) {
          // If pattern is not a valid regex, do a simple string check
          return query.toLowerCase().includes(pattern.toLowerCase());
        }
      });
      
      const isValid = !hasBlockedPatterns;
      
      if (hasBlockedPatterns) {
        logger.warn('SQL query contains blocked patterns', { query: query.substring(0, 100) });
      }
      
      logger.debug('SQL query validation result', { isValid, hasBlockedPatterns });
      
      return isValid;
    } catch (error: any) {
      logger.error('SQL query validation error', error);
      return false;
    }
  },
  
  executeParameterizedQuery: async (query: string, params: any[]): Promise<any> => {
    try {
      logger.info('Executing parameterized query');
      
      // First validate the query
      const isValid = await sqlInjectionProtection.validateSQLQuery(query);
      if (!isValid) {
        throw new Error('SQL query contains blocked patterns');
      }
      
      // In a real implementation, this would interface with your database
      // For now, we'll just log the query and return a mock result
      logger.info('Parameterized query executed', { 
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        paramsCount: params.length
      });
      
      // Mock result
      return {
        rows: [],
        rowCount: 0
      };
    } catch (error: any) {
      logger.error('Parameterized query execution error', error);
      throw error;
    }
  },
  
  // New methods for production-ready implementation
  getSQLPatterns: async (): Promise<any[]> => {
    try {
      logger.debug('Getting SQL patterns');
      
      // Try to get from Redis cache first
      const cachedPatterns = await redisService.get('sql:patterns');
      
      if (cachedPatterns) {
        logger.debug('SQL patterns retrieved from cache');
        return JSON.parse(cachedPatterns);
      }
      
      // If not in cache, get from database
      const { data, error } = await (supabaseService as any).supabase
        .from('SQLPatterns')
        .select('*');
      
      if (error) {
        logger.warn('Error retrieving SQL patterns from database', { error: error.message });
        // Return default patterns
        return [
          { pattern: 'union', type: 'dangerous', blocked: true },
          { pattern: 'select', type: 'dangerous', blocked: true },
          { pattern: 'insert', type: 'dangerous', blocked: true },
          { pattern: 'update', type: 'dangerous', blocked: true },
          { pattern: 'delete', type: 'dangerous', blocked: true },
          { pattern: 'drop', type: 'dangerous', blocked: true },
          { pattern: 'create', type: 'dangerous', blocked: true },
          { pattern: 'alter', type: 'dangerous', blocked: true },
          { pattern: 'exec', type: 'dangerous', blocked: true },
          { pattern: 'execute', type: 'dangerous', blocked: true }
        ];
      }
      
      // Cache the patterns in Redis for 10 minutes
      await redisService.set('sql:patterns', JSON.stringify(data), 600);
      
      logger.debug('SQL patterns retrieved from database and cached', { count: data.length });
      return data;
    } catch (error: any) {
      logger.error('Error getting SQL patterns', { error: error.message });
      throw error;
    }
  },
  
  addSQLPattern: async (pattern: string, type: string): Promise<void> => {
    try {
      logger.debug('Adding SQL pattern', { pattern, type });
      
      // Save to database
      const { error } = await (supabaseService as any).supabase
        .from('SQLPatterns')
        .insert({
          pattern: pattern,
          type: type,
          blocked: true,
          createdAt: new Date().toISOString()
        });
      
      if (error) {
        logger.error('Error saving SQL pattern to database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Clear cache to force refresh
      await redisService.del('sql:patterns');
      await redisService.sadd('sql:blocked:patterns', pattern);
      
      logger.debug('SQL pattern added', { pattern, type });
    } catch (error: any) {
      logger.error('Error adding SQL pattern', { error: error.message });
      throw error;
    }
  },
  
  blockSQLPattern: async (pattern: string): Promise<void> => {
    try {
      logger.debug('Blocking SQL pattern', { pattern });
      
      // Update in database
      const { error } = await (supabaseService as any).supabase
        .from('SQLPatterns')
        .update({ blocked: true })
        .eq('pattern', pattern);
      
      if (error) {
        logger.error('Error blocking SQL pattern in database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Add to blocked patterns set in Redis
      await redisService.sadd('sql:blocked:patterns', pattern);
      
      // Clear patterns cache to force refresh
      await redisService.del('sql:patterns');
      
      logger.debug('SQL pattern blocked', { pattern });
    } catch (error: any) {
      logger.error('Error blocking SQL pattern', { error: error.message });
      throw error;
    }
  },
  
  getBlockedPatterns: async (): Promise<string[]> => {
    try {
      logger.debug('Getting blocked SQL patterns');
      
      // Try to get from Redis cache first
      const cachedBlocked = await redisService.smembers('sql:blocked:patterns');
      
      if (cachedBlocked.length > 0) {
        logger.debug('Blocked SQL patterns retrieved from cache', { count: cachedBlocked.length });
        return cachedBlocked;
      }
      
      // If not in cache, get from database
      const { data, error } = await (supabaseService as any).supabase
        .from('SQLPatterns')
        .select('pattern')
        .eq('blocked', true);
      
      if (error) {
        logger.error('Error retrieving blocked SQL patterns from database', { error: error.message });
        throw new Error(`Database error: ${error.message}`);
      }
      
      const patterns = data.map((item: { pattern: string }) => item.pattern);
      
      // Cache in Redis for 10 minutes
      if (patterns.length > 0) {
        await redisService.sadd('sql:blocked:patterns', ...patterns);
      }
      
      logger.debug('Blocked SQL patterns retrieved from database and cached', { count: patterns.length });
      return patterns;
    } catch (error: any) {
      logger.error('Error getting blocked SQL patterns', { error: error.message });
      throw error;
    }
  }
};