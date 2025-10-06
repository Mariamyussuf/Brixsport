import { withRedis } from '../config/redis';
import { logger } from '../utils/logger';
import type { RedisClientType, RedisModules } from 'redis';

// Define the Redis modules we're using
interface RateLimitRedisModules {
  // Add any Redis modules you're using here
  // For example, if using RedisJSON:
  // json: any;
  [key: string]: any; // Add index signature to satisfy RedisModules constraint
}

type RedisClient = RedisClientType<RateLimitRedisModules, any, any>;

type RateLimitOptions = {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests allowed in the window
  keyPrefix?: string; // Prefix for Redis keys
  message?: string; // Custom error message
  statusCode?: number; // HTTP status code for rate limited responses
  headers?: boolean; // Whether to include rate limit headers in responses
};

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
  message?: string;
};

export class RedisRateLimitService {
  private static readonly DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
  private static readonly DEFAULT_MAX_REQUESTS = 100;
  private static readonly DEFAULT_KEY_PREFIX = 'brixsport:ratelimit:';
  private static readonly DEFAULT_MESSAGE = 'Too many requests, please try again later.';
  private static readonly DEFAULT_STATUS_CODE = 429;
  
  /**
   * Check rate limit for a given key
   */
  public static async check(
    key: string,
    options: Partial<RateLimitOptions> = {}
  ): Promise<RateLimitResult> {
    const {
      windowMs = this.DEFAULT_WINDOW_MS,
      maxRequests = this.DEFAULT_MAX_REQUESTS,
      keyPrefix = this.DEFAULT_KEY_PREFIX,
      message = this.DEFAULT_MESSAGE,
      statusCode = this.DEFAULT_STATUS_CODE,
      headers = true
    } = options;
    
    const redisKey = this.getRedisKey(key, keyPrefix);
    const now = Date.now();
    const windowStart = now - windowMs;
    
    try {
      return await withRedis(async (client: RedisClient) => {
        // Start a transaction
        const multi = client.multi();
        
        // Add current timestamp to the sorted set
        multi.zAdd(redisKey, { score: now, value: now.toString() });
        
        // Remove old entries outside the current window
        multi.zRemRangeByScore(redisKey, 0, windowStart);
        
        // Get the count of requests in the current window
        multi.zCard(redisKey);
        
        // Set expiry on the key
        multi.expire(redisKey, Math.ceil(windowMs / 1000));
        
        // Execute the transaction
        const results = await multi.exec();
        
        // Extract the count from the transaction results
        const count = results?.[2] as number ?? 0;
        
        // Calculate remaining requests and reset time
        const remaining = Math.max(0, maxRequests - count);
        const resetTime = new Date(now + windowMs);
        
        // Check if rate limit is exceeded
        if (count > maxRequests) {
          const retryAfter = Math.ceil((resetTime.getTime() - now) / 1000);
          
          return {
            success: false,
            limit: maxRequests,
            remaining,
            resetTime,
            retryAfter,
            message
          };
        }
        
        return {
          success: true,
          limit: maxRequests,
          remaining,
          resetTime
        };
      });
    } catch (error) {
      logger.error('Rate limit check error:', { key, error });
      
      // On Redis errors, allow the request to proceed (fail open)
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests,
        resetTime: new Date(now + windowMs)
      };
    }
  }
  
  /**
   * Get rate limit information without consuming a request
   */
  public static async get(
    key: string,
    options: Partial<RateLimitOptions> = {}
  ): Promise<RateLimitResult> {
    const {
      windowMs = this.DEFAULT_WINDOW_MS,
      maxRequests = this.DEFAULT_MAX_REQUESTS,
      keyPrefix = this.DEFAULT_KEY_PREFIX,
      message = this.DEFAULT_MESSAGE,
      statusCode = this.DEFAULT_STATUS_CODE
    } = options;
    
    const redisKey = this.getRedisKey(key, keyPrefix);
    const now = Date.now();
    const windowStart = now - windowMs;
    
    try {
      return await withRedis(async (client: RedisClient) => {
        // Get all requests in the current window
        const [count] = await Promise.all([
          client.zCount(redisKey, windowStart, now),
          // Clean up old entries in the background
          this.cleanupExpiredEntries(client, redisKey, windowStart)
        ]);
        
        const remaining = Math.max(0, maxRequests - count);
        const resetTime = new Date(now + windowMs);
        
        return {
          success: count < maxRequests,
          limit: maxRequests,
          remaining,
          resetTime,
          ...(count >= maxRequests && { 
            retryAfter: Math.ceil(windowMs / 1000),
            message
          })
        };
      });
    } catch (error) {
      logger.error('Rate limit get error:', { key, error });
      
      // On Redis errors, return a passing result
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests,
        resetTime: new Date(now + windowMs)
      };
    }
  }
  
  /**
   * Reset rate limit for a key
   */
  public static async reset(key: string, keyPrefix: string = this.DEFAULT_KEY_PREFIX): Promise<boolean> {
    const redisKey = this.getRedisKey(key, keyPrefix);
    
    try {
      return await withRedis(async (client: RedisClient) => {
        const result = await client.del(redisKey);
        return result > 0;
      });
    } catch (error) {
      logger.error('Rate limit reset error:', { key, error });
      return false;
    }
  }
  
  /**
   * Get rate limit headers
   */
  public static getHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString()
    };
    
    if (!result.success && result.retryAfter !== undefined) {
      headers['Retry-After'] = result.retryAfter.toString();
      headers['X-RateLimit-Retry-After'] = result.retryAfter.toString();
    }
    
    return headers;
  }
  
  // Private helper methods
  
  private static getRedisKey(key: string, prefix: string): string {
    return `${prefix}${key}`;
  }
  
  private static async cleanupExpiredEntries(
    client: RedisClient,
    key: string,
    minScore: number
  ): Promise<void> {
    try {
      // Remove entries older than the current window
      await client.zRemRangeByScore(key, 0, minScore);
    } catch (error) {
      logger.error('Rate limit cleanup error:', { key, error });
    }
  }
}

export const rateLimiter = RedisRateLimitService;
