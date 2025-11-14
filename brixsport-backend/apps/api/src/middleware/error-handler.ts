import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../types/errors';
import { logger } from '../utils/logger';
import { auditService } from '../services/security/audit.service';

export const errorHandler = async (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logger.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  // Handle known errors
  if (error instanceof BaseError) {
    // Log security-related errors
    if (error.statusCode >= 400 && error.statusCode < 500) {
      // Extract user ID from request user object (handling different possible structures)
      let userId = 'anonymous';
      if (req.user) {
        userId = req.user.id || req.user.userId || 'anonymous';
      }

      await auditService.logSecurityEvent({
        id: `error-${Date.now()}`,
        userId: userId,
        eventType: 'security_error',
        resource: req.path,
        action: req.method,
        timestamp: new Date(),
        severity: error.statusCode >= 500 ? 'high' : 'medium',
        details: {
          errorName: error.name,
          errorMessage: error.message,
          statusCode: error.statusCode
        },
        outcome: 'failure',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(err => logger.error('Failed to log security event:', err));
    }

    return res.status(error.statusCode).json({
      success: false,
      error: {
        name: error.name,
        message: error.message,
        ...(error.statusCode === 400 && { details: (error as any).details })
      }
    });
  }

  // Handle unknown errors
  logger.error('Unhandled error:', error);
  
  return res.status(500).json({
    success: false,
    error: {
      name: 'InternalServerError',
      message: 'An unexpected error occurred'
    }
  });
};