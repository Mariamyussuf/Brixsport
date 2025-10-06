import { logger } from '@utils/logger';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { redisService } from '../redis.service';

export interface APIKey {
  id: string;
  key: string;
  userId: string;
  name: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
}

export interface APIGatewayService {
  rateLimitByAPIKey(): any;
  validateAPIKey(): any;
  logAPIUsage(): any;
  blockMaliciousRequests(): any;
}

export const apiGatewayService: APIGatewayService = {
  rateLimitByAPIKey: () => {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: async (req: any, res: any) => {
        // Get API key from request
        const apiKey = req.headers['x-api-key'] || req.query.api_key;
        
        if (apiKey) {
          // Try to get rate limit from Redis cache
          const cacheKey = `api_key_rate_limit:${apiKey}`;
          const rateLimitStr = await redisService.get(cacheKey);
          
          if (rateLimitStr) {
            return parseInt(rateLimitStr);
          }
          
          // If not in cache, return default
          return 100;
        }
        
        // Default rate limit
        return 100;
      },
      message: {
        success: false,
        error: 'Too many requests',
        message: 'API rate limit exceeded'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: async (req: any) => {
        // Use API key as the rate limit key
        const apiKey = req.headers['x-api-key'] || req.query.api_key || req.ip;
        
        // Store API key usage in Redis
        if (apiKey && apiKey !== req.ip) {
          const usageKey = `api_key_usage:${apiKey}`;
          const currentUsage = parseInt(await redisService.get(usageKey) || '0');
          await redisService.set(usageKey, (currentUsage + 1).toString(), 15 * 60); // 15 minutes window
        }
        
        return apiKey;
      },
      handler: (req: any, res: any, next: any, options: any) => {
        logger.warn('API rate limit exceeded', {
          ip: req.ip,
          url: req.url,
          method: req.method,
          apiKey: req.headers['x-api-key'] || req.query.api_key
        });
        res.status(options.statusCode).send(options.message);
      }
    });
  },
  
  validateAPIKey: () => {
    return async (req: any, res: any, next: any): Promise<void> => {
      try {
        // Get API key from header or query parameter
        const apiKey = req.headers['x-api-key'] || req.query.api_key;
        
        if (!apiKey) {
          logger.warn('API key required', { 
            ip: req.ip, 
            url: req.url, 
            method: req.method 
          });
          
          res.status(401).json({
            success: false,
            error: 'API key required'
          });
          return;
        }
        
        // Try to get API key from Redis cache first
        const cacheKey = `api_key:${apiKey}`;
        let keyRecordStr = await redisService.get(cacheKey);
        let keyRecord: APIKey | null = null;
        
        if (keyRecordStr) {
          keyRecord = JSON.parse(keyRecordStr);
        } else {
          // If not in cache, this would normally query the database
          // For now, we'll simulate with a mock implementation
          keyRecord = null;
        }
        
        if (!keyRecord) {
          logger.warn('Invalid API key', { 
            ip: req.ip, 
            url: req.url, 
            method: req.method,
            apiKey: apiKey.substring(0, 5) + '...'
          });
          
          res.status(401).json({
            success: false,
            error: 'Invalid API key'
          });
          return;
        }
        
        // Check if key is expired
        if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
          logger.warn('API key expired', { 
            userId: keyRecord.userId,
            apiKey: apiKey.substring(0, 5) + '...'
          });
          
          res.status(401).json({
            success: false,
            error: 'API key expired'
          });
          return;
        }
        
        // Update last used timestamp
        keyRecord.lastUsedAt = new Date();
        
        // Update in Redis cache
        await redisService.set(cacheKey, JSON.stringify(keyRecord), 60 * 60); // 1 hour cache
        
        // Add API key info to request
        req.apiKey = keyRecord;
        
        logger.info('API key validated', { 
          userId: keyRecord.userId,
          apiKey: apiKey.substring(0, 5) + '...'
        });
        
        next();
      } catch (error: any) {
        logger.error('API key validation error', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
        return;
      }
    };
  },
  
  logAPIUsage: () => {
    return (req: any, res: any, next: any): void => {
      try {
        // Log API usage to Redis
        const apiKey = req.headers['x-api-key'] || req.query.api_key;
        if (apiKey) {
          const logKey = `api_usage_log:${new Date().toISOString().split('T')[0]}`; // Daily log key
          const logEntry = {
            timestamp: new Date().toISOString(),
            userId: req.apiKey?.userId || req.user?.userId || null,
            apiKey: apiKey.substring(0, 10) + '...',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            method: req.method,
            url: req.url
          };
          
          // Add to daily usage log in Redis (as a list)
          redisService.lpush(logKey, JSON.stringify(logEntry))
            .then(() => {
              // Keep only last 1000 entries
              return redisService.ltrim(logKey, 0, 999);
            })
            .catch(err => {
              logger.warn('Failed to log API usage to Redis', { error: err.message });
            });
        }
        
        next();
      } catch (error: any) {
        logger.error('API usage logging error', error);
        next();
      }
    };
  },
  
  blockMaliciousRequests: () => {
    return async (req: any, res: any, next: any): Promise<void> => {
      try {
        // Check if IP is blocked in Redis
        const blockedKey = `blocked_ip:${req.ip}`;
        const isBlocked = await redisService.exists(blockedKey);
        
        if (isBlocked) {
          logger.warn('Blocked malicious IP', { ip: req.ip });
          res.status(403).json({
            success: false,
            error: 'Request blocked for security reasons'
          });
          return;
        }
        
        // Suspicious patterns to check for
        const suspiciousPatterns = [
          /(\b|\d)union(\b|\d)/i,
          /(\b|\d)select(\b|\d)/i,
          /(\b|\d)insert(\b|\d)/i,
          /(\b|\d)update(\b|\d)/i,
          /(\b|\d)delete(\b|\d)/i,
          /(\b|\d)drop(\b|\d)/i,
          /(\b|\d)create(\b|\d)/i,
          /(\b|\d)alter(\b|\d)/i,
          /<script/i,
          /javascript:/i,
          /vbscript:/i,
          /on\w+\s*=/i
        ];
        
        // Check URL, query parameters, and body for suspicious patterns
        const requestData = [
          req.url,
          JSON.stringify(req.query),
          JSON.stringify(req.body)
        ].join(' ');
        
        // Check if any suspicious pattern is found
        const isMalicious = suspiciousPatterns.some(pattern => pattern.test(requestData));
        
        if (isMalicious) {
          logger.warn('Malicious request blocked', {
            ip: req.ip,
            url: req.url,
            method: req.method
          });
          
          // Block IP for 1 hour
          await redisService.set(blockedKey, '1', 60 * 60);
          
          res.status(403).json({
            success: false,
            error: 'Request blocked for security reasons'
          });
          return;
        }
        
        logger.debug('Request passed security check', {
          ip: req.ip,
          url: req.url,
          method: req.method
        });
        
        next();
      } catch (error: any) {
        logger.error('Malicious request detection error', error);
        next();
      }
    };
  }
};

// Helper function to generate a secure API key
export function generateAPIKey(): string {
  return uuidv4().replace(/-/g, '') + Math.random().toString(36).substring(2, 15);
}

// Helper function to create an API key
export async function createAPIKey(userId: string, name: string, permissions: string[], rateLimit: number, expiresAt?: Date): Promise<APIKey> {
  const key = generateAPIKey();
  
  const apiKey: APIKey = {
    id: uuidv4(),
    key,
    userId,
    name,
    permissions,
    rateLimit,
    expiresAt,
    createdAt: new Date()
  };
  
  // Store in Redis with expiration
  const cacheKey = `api_key:${key}`;
  await redisService.set(cacheKey, JSON.stringify(apiKey), 60 * 60); // 1 hour cache
  
  // Also store rate limit separately for quick access
  const rateLimitKey = `api_key_rate_limit:${key}`;
  await redisService.set(rateLimitKey, rateLimit.toString(), 60 * 60); // 1 hour cache
  
  logger.info('API key created', { 
    userId, 
    keyId: apiKey.id,
    name 
  });
  
  return apiKey;
}