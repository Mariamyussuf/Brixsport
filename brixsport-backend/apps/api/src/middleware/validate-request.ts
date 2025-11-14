import { Request, Response, NextFunction } from 'express';
import { validationService } from '../services/security/validation.service';
import { ValidationError } from '../types/errors';
import { logger } from '../utils/logger';

export const validateRequest = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = await validationService.validateInput(
        {
          ...req.body,
          ...req.params,
          ...req.query
        },
        schema
      );

      if (!validationResult.isValid) {
        throw new ValidationError('Request validation failed', validationResult.errors);
      }

      next();
    } catch (error) {
      logger.error('Request validation error:', error);
      next(error);
    }
  };
};