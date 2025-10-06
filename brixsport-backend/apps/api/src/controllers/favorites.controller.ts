import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { favoritesService } from '../services/favorites.service';
import { errorHandlerService } from '../services/error.handler.service';

export const favoritesController = {
  // Get all user favorites
  getUserFavorites: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'You must be logged in to view favorites.'
        });
      }
      
      const result = await favoritesService.getUserFavorites(userId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get user favorites error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Add a favorite
  addFavorite: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'You must be logged in to add favorites.'
        });
      }

      const { favorite_type, favorite_id } = req.body;
      
      // Validate request body
      if (!favorite_type || favorite_id === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'favorite_type and favorite_id are required'
        });
      }
      
      const result = await favoritesService.addFavorite(userId, favorite_type, favorite_id.toString());
      
      return res.status(200).json({
        success: true,
        data: result.data,
        message: 'Added to favorites successfully'
      });
    } catch (error: any) {
      logger.error('Add favorite error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Remove a favorite
  removeFavorite: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'You must be logged in to remove favorites.'
        });
      }

      const { favorite_type, favorite_id } = req.body;
      
      // Validate request body
      if (!favorite_type || favorite_id === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'favorite_type and favorite_id are required'
        });
      }
      
      const result = await favoritesService.removeFavorite(userId, favorite_type, favorite_id.toString());
      
      return res.status(200).json({
        success: true,
        data: result.data,
        message: 'Removed from favorites successfully'
      });
    } catch (error: any) {
      logger.error('Remove favorite error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
};