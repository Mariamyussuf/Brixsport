import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { userService } from '../services/user.service';
import { userRules } from '../services/userRules.service';
import { validate, validationSchemas } from '../middleware';
import { errorHandlerService } from '../services/error.handler.service';

export const userController = {
  // Get current user profile
  getCurrentUser: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      
      const result = await userService.getCurrentUser(userId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get current user error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Update user profile
  updateProfile: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const profileData = req.body;
      
      // Validate profile data using our rules
      const validationErrors = userRules.validateProfileUpdate(profileData);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationErrors
        });
      }
      
      const result = await userService.updateProfile(userId, profileData);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Update profile error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Upload profile picture
  uploadProfilePicture: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const pictureData = req.body;
      
      // Validate picture data
      if (!pictureData || !pictureData.url) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Picture URL is required'
        });
      }
      
      const result = await userService.uploadProfilePicture(userId, pictureData);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Upload profile picture error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Remove profile picture
  removeProfilePicture: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      
      const result = await userService.removeProfilePicture(userId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Remove profile picture error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get user preferences
  getPreferences: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      
      const result = await userService.getPreferences(userId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get preferences error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Update preferences
  updatePreferences: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const preferences = req.body;
      
      const result = await userService.updatePreferences(userId, preferences);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Update preferences error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get user activity log
  getActivityLog: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const result = await userService.getActivityLog(userId, limit);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get activity log error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get notification settings
  getNotificationSettings: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      
      const result = await userService.getNotificationSettings(userId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get notification settings error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Update notification settings
  updateNotificationSettings: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.userId;
      const settings = req.body;
      
      // Validate notification settings
      const validationErrors = userRules.validateNotificationPreferences(settings);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationErrors
        });
      }
      
      const result = await userService.updateNotificationSettings(userId, settings);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Update notification settings error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
};