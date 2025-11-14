import { logger } from '../utils/logger';
import { redisService } from './redis.service';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  blockDurationMinutes: number;
}

/**
 * Password Reset Rate Limiting Service
 * Implements strict rate limiting for password reset requests to prevent abuse
 */
export const passwordResetRateLimitService = {
  // Default configuration
  config: {
    maxAttempts: 3, // Maximum reset requests per window
    windowMinutes: 60, // 1 hour window
    blockDurationMinutes: 30, // Block for 30 minutes after exceeding limit
  } as RateLimitConfig,

  /**
   * Check if password reset is allowed for an email
   * @param email User email address
   * @param ipAddress Optional IP address for additional tracking
   * @returns RateLimitResult with allowed status and metadata
   */
  checkResetLimit: async (email: string, ipAddress?: string): Promise<RateLimitResult> => {
    try {
      const emailKey = `pwd_reset_limit:${email.toLowerCase()}`;
      const ipKey = ipAddress ? `pwd_reset_ip:${ipAddress}` : null;
      const now = Date.now();
      const windowMs = passwordResetRateLimitService.config.windowMinutes * 60 * 1000;
      const blockMs = passwordResetRateLimitService.config.blockDurationMinutes * 60 * 1000;

      // Check if email is blocked
      if (redisService && typeof redisService.get === 'function') {
        try {
          const blockData = await redisService.get(`${emailKey}:blocked`);
          if (blockData) {
            const blockInfo = JSON.parse(blockData);
            const blockUntil = new Date(blockInfo.blockUntil);
            
            if (now < blockUntil.getTime()) {
              const retryAfter = Math.ceil((blockUntil.getTime() - now) / 1000);
              logger.warn('Password reset blocked - rate limit exceeded', { 
                email, 
                ipAddress,
                blockUntil,
                retryAfter 
              });
              
              return {
                allowed: false,
                remaining: 0,
                resetTime: new Date(now + windowMs),
                retryAfter
              };
            } else {
              // Block expired, remove it
              await redisService.del(`${emailKey}:blocked`);
            }
          }

          // Get current attempt count
          const attemptsData = await redisService.get(emailKey);
          let attempts = 0;
          let windowStart = now;

          if (attemptsData) {
            const data = JSON.parse(attemptsData);
            attempts = data.count || 0;
            windowStart = data.windowStart || now;

            // Check if window has expired
            if (now - windowStart > windowMs) {
              attempts = 0;
              windowStart = now;
            }
          }

          // Check IP-based rate limit (stricter)
          if (ipKey) {
            const ipAttemptsData = await redisService.get(ipKey);
            if (ipAttemptsData) {
              const ipData = JSON.parse(ipAttemptsData);
              const ipAttempts = ipData.count || 0;
              const ipWindowStart = ipData.windowStart || now;

              // IP can make max 5 reset requests per hour across all emails
              if (now - ipWindowStart < windowMs && ipAttempts >= 5) {
                logger.warn('Password reset blocked - IP rate limit exceeded', { 
                  ipAddress,
                  attempts: ipAttempts 
                });
                
                return {
                  allowed: false,
                  remaining: 0,
                  resetTime: new Date(ipWindowStart + windowMs),
                  retryAfter: Math.ceil((ipWindowStart + windowMs - now) / 1000)
                };
              }
            }
          }

          // Calculate remaining attempts
          const remaining = Math.max(0, passwordResetRateLimitService.config.maxAttempts - attempts);
          const resetTime = new Date(windowStart + windowMs);

          return {
            allowed: remaining > 0,
            remaining,
            resetTime
          };
        } catch (redisError) {
          logger.warn('Redis error in password reset rate limit, allowing request', { error: redisError });
          // Fail open on Redis errors
          return {
            allowed: true,
            remaining: passwordResetRateLimitService.config.maxAttempts,
            resetTime: new Date(now + windowMs)
          };
        }
      }

      // Fallback to in-memory tracking (less reliable)
      logger.warn('Redis not available, using in-memory rate limiting');
      return {
        allowed: true,
        remaining: passwordResetRateLimitService.config.maxAttempts,
        resetTime: new Date(now + windowMs)
      };
    } catch (error: any) {
      logger.error('Password reset rate limit check failed', { error: error.message, email });
      // Fail open on errors
      return {
        allowed: true,
        remaining: passwordResetRateLimitService.config.maxAttempts,
        resetTime: new Date()
      };
    }
  },

  /**
   * Record a password reset attempt
   * @param email User email address
   * @param ipAddress Optional IP address
   */
  recordResetAttempt: async (email: string, ipAddress?: string): Promise<void> => {
    try {
      const emailKey = `pwd_reset_limit:${email.toLowerCase()}`;
      const ipKey = ipAddress ? `pwd_reset_ip:${ipAddress}` : null;
      const now = Date.now();
      const windowMs = passwordResetRateLimitService.config.windowMinutes * 60 * 1000;
      const blockMs = passwordResetRateLimitService.config.blockDurationMinutes * 60 * 1000;

      if (redisService && typeof redisService.set === 'function') {
        try {
          // Get current attempts
          const attemptsData = await redisService.get(emailKey);
          let attempts = 0;
          let windowStart = now;

          if (attemptsData) {
            const data = JSON.parse(attemptsData);
            attempts = data.count || 0;
            windowStart = data.windowStart || now;

            // Reset if window expired
            if (now - windowStart > windowMs) {
              attempts = 0;
              windowStart = now;
            }
          }

          attempts += 1;

          // Store updated attempt count
          await redisService.set(
            emailKey,
            JSON.stringify({ count: attempts, windowStart }),
            Math.ceil(windowMs / 1000)
          );

          // Check if should block
          if (attempts >= passwordResetRateLimitService.config.maxAttempts) {
            const blockUntil = new Date(now + blockMs);
            await redisService.set(
              `${emailKey}:blocked`,
              JSON.stringify({ 
                blockUntil: blockUntil.toISOString(), 
                attempts,
                blockedAt: new Date().toISOString()
              }),
              Math.ceil(blockMs / 1000)
            );
            
            logger.warn('Password reset limit exceeded - blocking user', { 
              email, 
              attempts,
              blockUntil 
            });
          }

          // Track IP attempts
          if (ipKey) {
            const ipAttemptsData = await redisService.get(ipKey);
            let ipAttempts = 0;
            let ipWindowStart = now;

            if (ipAttemptsData) {
              const ipData = JSON.parse(ipAttemptsData);
              ipAttempts = ipData.count || 0;
              ipWindowStart = ipData.windowStart || now;

              if (now - ipWindowStart > windowMs) {
                ipAttempts = 0;
                ipWindowStart = now;
              }
            }

            ipAttempts += 1;

            await redisService.set(
              ipKey,
              JSON.stringify({ count: ipAttempts, windowStart: ipWindowStart }),
              Math.ceil(windowMs / 1000)
            );
          }

          logger.info('Password reset attempt recorded', { 
            email, 
            ipAddress,
            attempts,
            remaining: Math.max(0, passwordResetRateLimitService.config.maxAttempts - attempts)
          });
        } catch (redisError) {
          logger.warn('Redis error recording password reset attempt', { error: redisError });
        }
      }
    } catch (error: any) {
      logger.error('Failed to record password reset attempt', { error: error.message, email });
    }
  },

  /**
   * Clear rate limit for an email (admin use)
   * @param email User email address
   */
  clearRateLimit: async (email: string): Promise<void> => {
    try {
      const emailKey = `pwd_reset_limit:${email.toLowerCase()}`;
      
      if (redisService && typeof redisService.del === 'function') {
        await redisService.del(emailKey);
        await redisService.del(`${emailKey}:blocked`);
        logger.info('Password reset rate limit cleared', { email });
      }
    } catch (error: any) {
      logger.error('Failed to clear password reset rate limit', { error: error.message, email });
    }
  },

  /**
   * Get rate limit status for an email
   * @param email User email address
   */
  getRateLimitStatus: async (email: string): Promise<{
    attempts: number;
    blocked: boolean;
    blockUntil?: Date;
    resetTime: Date;
  }> => {
    try {
      const emailKey = `pwd_reset_limit:${email.toLowerCase()}`;
      const now = Date.now();
      const windowMs = passwordResetRateLimitService.config.windowMinutes * 60 * 1000;

      if (redisService && typeof redisService.get === 'function') {
        const [attemptsData, blockData] = await Promise.all([
          redisService.get(emailKey),
          redisService.get(`${emailKey}:blocked`)
        ]);

        let attempts = 0;
        let windowStart = now;
        let blocked = false;
        let blockUntil: Date | undefined;

        if (attemptsData) {
          const data = JSON.parse(attemptsData);
          attempts = data.count || 0;
          windowStart = data.windowStart || now;
        }

        if (blockData) {
          const blockInfo = JSON.parse(blockData);
          blockUntil = new Date(blockInfo.blockUntil);
          blocked = now < blockUntil.getTime();
        }

        return {
          attempts,
          blocked,
          blockUntil,
          resetTime: new Date(windowStart + windowMs)
        };
      }

      return {
        attempts: 0,
        blocked: false,
        resetTime: new Date(now + windowMs)
      };
    } catch (error: any) {
      logger.error('Failed to get password reset rate limit status', { error: error.message, email });
      return {
        attempts: 0,
        blocked: false,
        resetTime: new Date()
      };
    }
  }
};
