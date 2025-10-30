import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware to check if user has logger role
 */
export const requireLogger = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get user from request (attached by auth middleware)
    const user = (req as any).user;
    
    if (!user) {
      res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
      return;
    }
    
    // Check if user has logger role
    if (user.role !== 'logger' && user.role !== 'admin' && user.role !== 'super-admin') {
      logger.warn('User attempted to access logger-only resource without proper role', {
        userId: user.id,
        userRole: user.role,
        requestedResource: req.originalUrl
      });
      
      res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions. Logger role required.' 
      });
      return;
    }
    
    // User has proper role, continue
    next();
  } catch (error) {
    logger.error('Error in requireLogger middleware', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
    return;
  }
};