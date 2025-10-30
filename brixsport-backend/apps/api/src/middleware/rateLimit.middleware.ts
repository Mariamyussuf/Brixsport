import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

// Rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    res.status(options.statusCode).send(options.message);
  }
});

// Rate limiter for password reset endpoints
export const passwordResetRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many password reset attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Password reset rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    res.status(options.statusCode).send(options.message);
  }
});

// Rate limiter for credential-related operations (more strict)
export const credentialRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many credential-related requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Credential rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    res.status(options.statusCode).send(options.message);
  }
});

// Rate limiter for account creation
export const accountCreationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 account creations per hour
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many account creation attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Account creation rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    res.status(options.statusCode).send(options.message);
  }
});

// Rate limiter for MFA operations
export const mfaRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 MFA attempts per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many MFA attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('MFA rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    res.status(options.statusCode).send(options.message);
  }
});

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('API rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method
    });
    res.status(options.statusCode).send(options.message);
  }
});