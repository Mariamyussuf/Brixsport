import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore, { RedisReply } from 'rate-limit-redis';
import Redis from 'ioredis';
import { RateLimitError } from '../types/errors';
import { logger } from '../utils/logger';

// Check if Redis is configured
const redisUrl = process.env.REDIS_URL;
let rateLimitStore: any = undefined;

if (redisUrl && redisUrl !== '' && redisUrl !== 'disabled') {
  try {
    // Initialize Redis client
    const redisClient = new Redis(redisUrl, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    // Create Redis store for rate limiting
    rateLimitStore = new RedisStore({
      sendCommand: async (...args: string[]) => {
        // Fix the type issue by properly typing the return value
        const result = await redisClient.call(args[0], ...args.slice(1));
        return result as RedisReply;
      },
    });
    
    logger.info('Rate limiting using Redis store');
  } catch (error) {
    logger.warn('Failed to initialize Redis for rate limiting, falling back to memory store:', error);
  }
} else {
  logger.info('Redis not configured for rate limiting, using memory store');
}

// Define rate limit options
const rateLimitOptions = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests default
  standardHeaders: true,
  legacyHeaders: false,
  store: rateLimitStore, // Will be undefined if Redis is not available, falling back to memory store
  handler: (req: Request, res: Response) => {
    throw new RateLimitError('Too many requests from this IP, please try again later');
  }
};

// Create rate limiter instance
export const rateLimiter = rateLimit(rateLimitOptions);

// Create stricter rate limiter for security-sensitive endpoints
export const securityRateLimiter = rateLimit({
  ...rateLimitOptions,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10 // Limit each IP to 10 requests per hour for security endpoints
});