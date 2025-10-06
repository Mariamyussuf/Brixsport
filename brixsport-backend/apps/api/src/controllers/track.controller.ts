import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { trackService } from '../services/track.service';
import { hasPermission } from '../middleware/rbac.middleware';
import { errorHandlerService } from '../services/error.handler.service';

export const trackController = {
  // List track events
  listTrackEvents: async (req: Request, res: Response) => {
    try {
      const result = await trackService.listEvents(req.query);
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('List track events error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get track event details
  getTrackEventDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await trackService.getEvent(id);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get track event details error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Create track event (admin)
  createTrackEvent: async (req: Request, res: Response) => {
    try {
      const eventData = req.body;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      
      // Check if user has admin permissions
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions to create track events.'
        });
      }
      
      const result = await trackService.createEvent(eventData);
      
      return res.status(201).json(result);
    } catch (error: any) {
      logger.error('Create track event error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Update track event (admin)
  updateTrackEvent: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const eventData = req.body;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      
      // Check if user has admin permissions
      if (userRole !== 'admin' && userRole !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions to update track events.'
        });
      }
      
      const result = await trackService.updateEvent(id, eventData);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Update track event error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Submit results (logger)
  submitResults: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const resultsData = req.body;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      
      // Check if user has logger or admin permissions
      if (userRole !== 'logger' && userRole !== 'senior_logger' && userRole !== 'logger_admin' && userRole !== 'admin' && userRole !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions to submit results.'
        });
      }
      
      const result = await trackService.submitResults(id, resultsData);
      
      return res.status(201).json(result);
    } catch (error: any) {
      logger.error('Submit track event results error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Update result (logger)
  updateResult: async (req: Request, res: Response) => {
    try {
      const { id, resultId } = req.params;
      const resultData = req.body;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      
      // Check if user has logger or admin permissions
      if (userRole !== 'logger' && userRole !== 'senior_logger' && userRole !== 'logger_admin' && userRole !== 'admin' && userRole !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Insufficient permissions to update results.'
        });
      }
      
      const result = await trackService.updateResult(id, resultId, resultData);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Update track event result error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
};