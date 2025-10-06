import { Request, Response, NextFunction } from 'express';
import { logger } from '@utils/logger';
import { redisService } from '../services/redis.service';

// Rate limiting store using Redis for production environments
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // Max requests per window

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  message?: string;
}

export const rateLimiter = (config: RateLimitConfig | number = RATE_LIMIT_MAX, windowMs: number = RATE_LIMIT_WINDOW) => {
  // Handle both old and new parameter formats
  const rateLimitConfig: RateLimitConfig = typeof config === 'number' 
    ? { maxRequests: config, windowMs } 
    : config;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if rate limiting should be skipped
      if (rateLimitConfig.skip && rateLimitConfig.skip(req)) {
        next();
        return;
      }

      // Generate client identifier
      const clientId = rateLimitConfig.keyGenerator 
        ? rateLimitConfig.keyGenerator(req) 
        : req.ip || 'unknown';

      const now = Date.now();
      const windowMs = rateLimitConfig.windowMs;
      const maxRequests = rateLimitConfig.maxRequests;

      let clientData: { count: number; resetTime: number };

      // Try to get data from Redis first (if available)
      if (redisService && typeof redisService.get === 'function') {
        try {
          const cacheKey = `rate_limit:${clientId}`;
          const cachedData = await redisService.get(cacheKey);
          
          if (cachedData) {
            clientData = JSON.parse(cachedData);
          } else {
            clientData = {
              count: 0,
              resetTime: now + windowMs
            };
          }
        } catch (redisError) {
          // Fallback to in-memory store if Redis fails
          logger.warn('Redis error in rate limiter, falling back to in-memory store', redisError);
          let storedData = rateLimitStore.get(clientId);
          
          if (!storedData || storedData.resetTime < now) {
            storedData = {
              count: 0,
              resetTime: now + windowMs
            };
          }
          clientData = storedData;
        }
      } else {
        // Use in-memory store
        let storedData = rateLimitStore.get(clientId);
        
        if (!storedData || storedData.resetTime < now) {
          storedData = {
            count: 0,
            resetTime: now + windowMs
          };
        }
        clientData = storedData;
      }

      // Increment request count
      clientData.count += 1;

      // Store updated data
      if (redisService && typeof redisService.set === 'function') {
        try {
          const cacheKey = `rate_limit:${clientId}`;
          await redisService.set(cacheKey, JSON.stringify(clientData), Math.ceil(windowMs / 1000));
        } catch (redisError) {
          // Fallback to in-memory store if Redis fails
          rateLimitStore.set(clientId, clientData);
        }
      } else {
        rateLimitStore.set(clientId, clientData);
      }

      // Check if limit exceeded
      if (clientData.count > maxRequests) {
        logger.warn('Rate limit exceeded', { 
          clientId, 
          count: clientData.count, 
          maxRequests,
          url: req.url,
          method: req.method
        });
        
        res.status(429).json({
          error: 'Too many requests',
          message: rateLimitConfig.message || 'Too many requests, please try again later',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
        return;
      }

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - clientData.count),
        'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString(),
        'Retry-After': Math.ceil((clientData.resetTime - now) / 1000)
      });

      next();
    } catch (error: any) {
      logger.error('Rate limiting error', error);
      // Don't block requests if rate limiting fails
      next();
    }
  };
};

// Specific rate limiters for different endpoint types
export const authRateLimiter = rateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000, // 5 requests per minute
  message: 'Too many authentication attempts, please try again later'
});

export const passwordResetRateLimiter = rateLimiter({
  maxRequests: 3,
  windowMs: 15 * 60 * 1000, // 3 requests per 15 minutes
  message: 'Too many password reset attempts, please try again later'
});

export const readRateLimiter = rateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000 // 100 requests per minute
});

export const writeRateLimiter = rateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000 // 30 requests per minute
});

export const liveEventRateLimiter = rateLimiter({
  maxRequests: 10,
  windowMs: 1000 // 10 requests per second
});

// User-specific rate limiter
export const userRateLimiter = rateLimiter({
  maxRequests: 200,
  windowMs: 60 * 1000, // 200 requests per minute per user
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise IP
    return (req as any).user?.id || req.ip || 'unknown';
  },
  skip: (req: Request) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/health' || req.path === '/api/health';
  }
});

// API key rate limiter
export const apiKeyRateLimiter = rateLimiter({
  maxRequests: 1000,
  windowMs: 60 * 1000, // 1000 requests per minute per API key
  keyGenerator: (req: Request) => {
    return req.headers['x-api-key'] as string || req.query.api_key as string || req.ip || 'unknown';
  },
  message: 'API rate limit exceeded'
});