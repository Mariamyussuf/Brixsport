import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore, { RedisReply } from 'rate-limit-redis';
import Redis from 'ioredis';
import { RateLimitError } from '../types/errors';
import { logger } from '@utils/logger';

// Initialize Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

// Define rate limit options
const rateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      // Fix the type issue by properly typing the return value
      const result = await redisClient.call(args[0], ...args.slice(1));
      return result as RedisReply;
    },
  }),
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