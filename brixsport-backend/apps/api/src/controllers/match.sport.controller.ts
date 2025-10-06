import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { matchService } from '../services/match.sport.service';
import { trackService } from '../services/track.sport.service';
import { errorHandlerService } from '../services/error.handler.service';

export const matchController = {
  // Get all matches by sport with filtering and pagination
  listMatchesBySport: async (req: Request, res: Response) => {
    try {
      const { sport, status, limit, offset } = req.query;
      
      const filters: any = {};
      if (sport) filters.sport = sport;
      if (status) filters.status = status;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);
      
      const result = await matchService.listMatches(filters);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('List matches by sport error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get live matches by sport
  getLiveMatchesBySport: async (req: Request, res: Response) => {
    try {
      const { sport } = req.query;
      
      const result = await matchService.getLiveMatches(sport as string);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get live matches by sport error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get match details
  getMatchDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await matchService.getMatchDetails(id);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get match details error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get football match details with extensions
  getFootballMatchDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await matchService.getFootballMatchDetails(id);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get football match details error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get basketball match details with extensions
  getBasketballMatchDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await matchService.getBasketballMatchDetails(id);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get basketball match details error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get track event details
  getTrackEventDetails: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await trackService.getEventDetails(id);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get track event details error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
};