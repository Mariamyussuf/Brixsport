import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { logger } from '../utils/logger';

// Extend the Express Request interface locally
interface CustomRequest extends Request {
  user?: JwtPayload & { 
    id?: string;
    userId?: string;
    email?: string;
    role?: string;
    [key: string]: any; // Allow additional properties
  };
}

const verifyToken = (token: string) => {
  try {
    // Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    );
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const authenticate = (req: CustomRequest, res: Response, next: NextFunction): void => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      res.status(401).json({ 
        success: false,
        error: 'Access token required' 
      });
      return;
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Add user info to request
    req.user = decoded as any;
    
    // Log user authentication
    const userId = (decoded as any).userId || (decoded as any).id || 'unknown';
    logger.info('User authenticated', { userId });
    
    next();
  } catch (error: any) {
    logger.error('Authentication error', error);
    res.status(401).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
    return;
  }
};

export const authorize = (roles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({ 
          success: false,
          error: 'Authentication required' 
        });
        return;
      }
      
      // Check if user has required role
      const userRole = req.user.role || 'user';
      if (!roles.includes(userRole)) {
        const userId = req.user.userId || req.user.id || 'unknown';
        logger.warn('Authorization failed', { 
          userId, 
          userRole, 
          requiredRoles: roles 
        });
        
        res.status(403).json({ 
          success: false,
          error: 'Insufficient permissions' 
        });
        return;
      }
      
      const userId = req.user.userId || req.user.id || 'unknown';
      logger.info('User authorized', { 
        userId, 
        userRole, 
        requiredRoles: roles 
      });
      
      next();
    } catch (error: any) {
      logger.error('Authorization error', error);
      res.status(500).json({ 
        success: false,
        error: 'Authorization check failed' 
      });
      return;
    }
  };
};

// Specific role-based authorization middleware
export const requireAdmin = authorize(['admin', 'super_admin']);
export const requireLogger = authorize(['logger', 'senior_logger', 'logger_admin', 'admin', 'super_admin']);
export const requireSeniorLogger = authorize(['senior_logger', 'logger_admin', 'admin', 'super_admin']);
export const requireLoggerAdmin = authorize(['logger_admin', 'admin', 'super_admin']);
export const requireSuperAdmin = authorize(['super_admin']);