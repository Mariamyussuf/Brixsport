import { logger } from '../../utils/logger';
import sanitizeHtml from 'sanitize-html';
import validator from 'validator';
import { redisService } from '../redis.service';

export interface XSSProtection {
  sanitizeOutput(data: any): Promise<any>;
  escapeHTML(html: string): Promise<string>;
  xssProtection(): any;
  getSanitizationRules(): Promise<any>;
  setSanitizationRules(rules: any): Promise<void>;
  clearSanitizationCache(): Promise<void>;
}

export const xssProtection: XSSProtection = {
  sanitizeOutput: async (data: any): Promise<any> => {
    try {
      logger.debug('Sanitizing output data');
      
      // If data is a string, sanitize it
      if (typeof data === 'string') {
        return sanitizeHtml(data, {
          allowedTags: [], // Remove all HTML tags
          allowedAttributes: {}
        });
      }
      
      // If data is an array, sanitize each element
      if (Array.isArray(data)) {
        return Promise.all(data.map(item => xssProtection.sanitizeOutput(item)));
      }
      
      // If data is an object, sanitize each property
      if (typeof data === 'object' && data !== null) {
        const sanitizedData: any = {};
        for (const [key, value] of Object.entries(data)) {
          sanitizedData[key] = await xssProtection.sanitizeOutput(value);
        }
        return sanitizedData;
      }
      
      // For other types (number, boolean, etc.), return as is
      return data;
    } catch (error: any) {
      logger.error('Output sanitization error', error);
      throw error;
    }
  },
  
  escapeHTML: async (html: string): Promise<string> => {
    try {
      logger.debug('Escaping HTML content');
      
      const escaped = validator.escape(html);
      
      logger.debug('HTML escaped');
      
      return escaped;
    } catch (error: any) {
      logger.error('HTML escaping error', error);
      throw error;
    }
  },
  
  xssProtection: () => {
    return (req: any, res: any, next: any): void => {
      try {
        logger.debug('Applying XSS protection middleware');
        
        // Store original json method
        const originalJson = res.json;
        
        // Override json method to sanitize output
        res.json = function (body?: any) {
          xssProtection.sanitizeOutput(body)
            .then(sanitizedBody => {
              originalJson.call(this, sanitizedBody);
            })
            .catch(error => {
              logger.error('XSS protection error', error);
              originalJson.call(this, body); // Fallback to original if sanitization fails
            });
        };
        
        next();
      } catch (error: any) {
        logger.error('XSS protection middleware error', error);
        next();
      }
    };
  },
  
  // New methods for production-ready implementation
  getSanitizationRules: async (): Promise<any> => {
    try {
      logger.debug('Getting XSS sanitization rules');
      
      // Try to get from Redis cache first
      const cachedRules = await redisService.get('xss:sanitization:rules');
      
      if (cachedRules) {
        logger.debug('XSS sanitization rules retrieved from cache');
        return JSON.parse(cachedRules);
      }
      
      // Default sanitization rules
      const defaultRules = {
        allowedTags: [],
        allowedAttributes: {},
        allowedSchemes: ['http', 'https', 'ftp', 'mailto'],
        allowProtocolRelative: true
      };
      
      // Cache the default rules for 1 hour
      await redisService.set('xss:sanitization:rules', JSON.stringify(defaultRules), 3600);
      
      logger.debug('Default XSS sanitization rules created and cached');
      return defaultRules;
    } catch (error: any) {
      logger.error('Error getting XSS sanitization rules', { error: error.message });
      throw error;
    }
  },
  
  setSanitizationRules: async (rules: any): Promise<void> => {
    try {
      logger.debug('Setting XSS sanitization rules');
      
      // Cache the rules in Redis for 1 hour
      await redisService.set('xss:sanitization:rules', JSON.stringify(rules), 3600);
      
      logger.debug('XSS sanitization rules set and cached');
    } catch (error: any) {
      logger.error('Error setting XSS sanitization rules', { error: error.message });
      throw error;
    }
  },
  
  clearSanitizationCache: async (): Promise<void> => {
    try {
      logger.debug('Clearing XSS sanitization cache');
      
      await redisService.del('xss:sanitization:rules');
      
      logger.debug('XSS sanitization cache cleared');
    } catch (error: any) {
      logger.error('Error clearing XSS sanitization cache', { error: error.message });
      throw error;
    }
  }
};