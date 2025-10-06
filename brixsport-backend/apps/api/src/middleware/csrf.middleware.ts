import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@utils/logger';
import { redisService } from '../services/redis.service';

export interface CSRFGuard {
  generateToken(req: Request): Promise<string>;
  validateToken(req: Request, token: string): Promise<boolean>;
  csrfProtection(): any;
  doubleSubmitCookieProtection(): any;
}

// In-memory storage for CSRF tokens (in production, this should be in a secure session store)
const csrfTokens: { [sessionId: string]: string } = {};
const csrfTokenExpiry: { [sessionId: string]: number } = {};

export const csrfGuard: CSRFGuard = {
  generateToken: async (req: Request): Promise<string> => {
    try {
      logger.debug('Generating CSRF token');
      
      // Use session ID or generate a new one
      const sessionId = (req as any).session?.id || uuidv4();
      
      // Generate a random CSRF token
      const token = uuidv4();
      
      // Set token expiry (1 hour)
      const expiry = Date.now() + 60 * 60 * 1000;
      
      // Store the token with expiry
      if (redisService && typeof redisService.set === 'function') {
        // Use Redis for production
        const cacheKey = `csrf_token:${sessionId}`;
        await redisService.set(cacheKey, token, 60 * 60); // 1 hour expiry
        await redisService.set(`${cacheKey}:expiry`, expiry.toString(), 60 * 60);
      } else {
        // Fallback to in-memory storage
        csrfTokens[sessionId] = token;
        csrfTokenExpiry[sessionId] = expiry;
      }
      
      logger.debug('CSRF token generated', { sessionId: sessionId.substring(0, 8) });
      
      return token;
    } catch (error: any) {
      logger.error('CSRF token generation error', error);
      throw error;
    }
  },
  
  validateToken: async (req: Request, token: string): Promise<boolean> => {
    try {
      logger.debug('Validating CSRF token');
      
      // Get session ID
      const sessionId = (req as any).session?.id;
      if (!sessionId) {
        logger.warn('No session ID for CSRF validation');
        return false;
      }
      
      let storedToken: string | null = null;
      let tokenExpiry: number | null = null;
      
      // Get stored token
      if (redisService && typeof redisService.get === 'function') {
        // Use Redis for production
        const cacheKey = `csrf_token:${sessionId}`;
        storedToken = await redisService.get(cacheKey);
        const expiryStr = await redisService.get(`${cacheKey}:expiry`);
        tokenExpiry = expiryStr ? parseInt(expiryStr) : null;
      } else {
        // Fallback to in-memory storage
        storedToken = csrfTokens[sessionId];
        tokenExpiry = csrfTokenExpiry[sessionId];
      }
      
      if (!storedToken) {
        logger.warn('No stored CSRF token for session', { sessionId: sessionId.substring(0, 8) });
        return false;
      }
      
      // Check if token is expired
      if (tokenExpiry && Date.now() > tokenExpiry) {
        logger.warn('CSRF token expired', { sessionId: sessionId.substring(0, 8) });
        
        // Clean up expired token
        if (redisService && typeof redisService.del === 'function') {
          const cacheKey = `csrf_token:${sessionId}`;
          await redisService.del(cacheKey);
          await redisService.del(`${cacheKey}:expiry`);
        } else {
          delete csrfTokens[sessionId];
          delete csrfTokenExpiry[sessionId];
        }
        
        return false;
      }
      
      // Validate token
      const isValid = storedToken === token;
      
      // Remove token after validation (one-time use) for POST/PUT/DELETE requests
      if (isValid && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        if (redisService && typeof redisService.del === 'function') {
          const cacheKey = `csrf_token:${sessionId}`;
          await redisService.del(cacheKey);
          await redisService.del(`${cacheKey}:expiry`);
        } else {
          delete csrfTokens[sessionId];
          delete csrfTokenExpiry[sessionId];
        }
      }
      
      logger.debug('CSRF token validation result', { isValid, sessionId: sessionId.substring(0, 8) });
      
      return isValid;
    } catch (error: any) {
      logger.error('CSRF token validation error', error);
      return false;
    }
  },
  
  csrfProtection: () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Skip CSRF check for safe methods
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          next();
          return;
        }
        
        // Get token from header, body, or query
        const token = req.headers['x-csrf-token'] || 
                     req.headers['x-xsrf-token'] || 
                     req.body._csrf || 
                     req.query._csrf ||
                     req.body.csrfToken;
        
        if (!token) {
          logger.warn('CSRF token required', { 
            method: req.method, 
            url: req.url 
          });
          
          res.status(403).json({
            success: false,
            error: 'CSRF token required',
            message: 'A valid CSRF token is required for this request'
          });
          return;
        }
        
        // Validate token
        const isValid = await csrfGuard.validateToken(req, token as string);
        
        if (!isValid) {
          logger.warn('Invalid CSRF token', { 
            method: req.method, 
            url: req.url 
          });
          
          res.status(403).json({
            success: false,
            error: 'Invalid CSRF token',
            message: 'The provided CSRF token is invalid or expired'
          });
          return;
        }
        
        logger.debug('CSRF token validated', { 
          method: req.method, 
          url: req.url 
        });
        
        next();
      } catch (error: any) {
        logger.error('CSRF protection error', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'An error occurred while validating the CSRF token'
        });
        return;
      }
    };
  },
  
  doubleSubmitCookieProtection: () => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Skip for safe methods
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
          next();
          return;
        }
        
        // Get token from header
        const headerToken = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
        
        // Get token from cookie
        const cookieToken = req.cookies?._csrf || req.cookies?.csrfToken;
        
        // Both tokens must be present and match
        if (!headerToken || !cookieToken || headerToken !== cookieToken) {
          logger.warn('Double submit cookie validation failed', {
            method: req.method,
            url: req.url,
            hasHeaderToken: !!headerToken,
            hasCookieToken: !!cookieToken
          });
          
          res.status(403).json({
            success: false,
            error: 'CSRF token mismatch',
            message: 'CSRF token validation failed'
          });
          return;
        }
        
        // Validate the token
        const isValid = await csrfGuard.validateToken(req, headerToken as string);
        
        if (!isValid) {
          logger.warn('Invalid CSRF token in double submit cookie validation', {
            method: req.method,
            url: req.url
          });
          
          res.status(403).json({
            success: false,
            error: 'Invalid CSRF token',
            message: 'The provided CSRF token is invalid or expired'
          });
          return;
        }
        
        logger.debug('Double submit cookie validation passed', {
          method: req.method,
          url: req.url
        });
        
        next();
      } catch (error: any) {
        logger.error('Double submit cookie protection error', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: 'An error occurred while validating the CSRF token'
        });
        return;
      }
    };
  }
};

// Middleware to add CSRF token to response locals and set cookie
export const csrfTokenMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Generate CSRF token for all requests
    const token = await csrfGuard.generateToken(req);
    
    // Add token to response locals
    res.locals.csrfToken = token;
    
    // Set cookie for double submit cookie pattern
    res.cookie('_csrf', token, {
      httpOnly: false, // Must be false so JavaScript can read it for AJAX requests
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });
    
    next();
  } catch (error: any) {
    logger.error('CSRF token middleware error', error);
    next();
  }
};