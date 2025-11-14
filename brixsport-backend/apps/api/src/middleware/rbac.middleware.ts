import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { JwtPayload } from 'jsonwebtoken';

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

// Role-based access control middleware
export enum UserRole {
  USER = 'user',
  LOGGER = 'logger',
  SENIOR_LOGGER = 'senior_logger',
  LOGGER_ADMIN = 'logger_admin',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Permission matrix
const PERMISSIONS: Record<string, UserRole[]> = {
  'match:create': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'match:update': [UserRole.LOGGER, UserRole.SENIOR_LOGGER, UserRole.LOGGER_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'event:create': [UserRole.LOGGER, UserRole.SENIOR_LOGGER, UserRole.LOGGER_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'event:validate': [UserRole.SENIOR_LOGGER, UserRole.LOGGER_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'user:manage': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'admin:access': [UserRole.ADMIN, UserRole.SUPER_ADMIN],
  'logger:manage': [UserRole.LOGGER_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN]
};

// Check if user has a specific role
export const hasRole = (requiredRole: UserRole) => {
  return (req: CustomRequest, res: Response, next: NextFunction): void => {
    try {
      // Get user from request (added by auth middleware)
      const user = req.user;
      
      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      const userRole = user.role || UserRole.USER;
      
      // Check if user has required role
      if (userRole !== requiredRole) {
        logger.warn('Insufficient role', { 
          userId: user.userId, 
          userRole, 
          requiredRole 
        });
        res.status(403).json({ error: 'Insufficient role' });
        return;
      }
      
      logger.info('Role check passed', { 
        userId: user.userId, 
        userRole, 
        requiredRole 
      });
      
      next();
    } catch (error: any) {
      logger.error('Role check error', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  };
};

// Check if user has specific permission
export const hasPermission = (permission: string) => {
  return (req: CustomRequest, res: Response, next: NextFunction): void => {
    try {
      // Get user from request (added by auth middleware)
      const user = req.user;
      
      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      const userRole = user.role || UserRole.USER;
      
      // Get roles that have this permission
      const allowedRoles = PERMISSIONS[permission] || [];
      
      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(userRole as UserRole)) {
        logger.warn('Insufficient permissions', { 
          userId: user.userId, 
          userRole, 
          permission,
          allowedRoles
        });
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      
      logger.info('Permission check passed', { 
        userId: user.userId, 
        userRole, 
        permission
      });
      
      next();
    } catch (error: any) {
      logger.error('Permission check error', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
  };
};