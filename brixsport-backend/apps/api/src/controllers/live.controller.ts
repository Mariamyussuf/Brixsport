import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { liveService } from '../services/live.service';
import { errorHandlerService } from '../services/error.handler.service';

export const liveController = {
  // Live Match State
  getMatchState: async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const result = await liveService.getMatchState(matchId);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get match state error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  updateMatchState: async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const result = await liveService.updateMatchState(matchId, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Update match state error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  startMatch: async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const result = await liveService.startMatch(matchId);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Start match error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  pauseMatch: async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const result = await liveService.pauseMatch(matchId);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Pause match error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  resumeMatch: async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const result = await liveService.resumeMatch(matchId);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Resume match error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  endMatch: async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const result = await liveService.endMatch(matchId);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('End match error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Live Events
  getMatchEvents: async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const result = await liveService.getMatchEvents(matchId);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get match events error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  addEvent: async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const result = await liveService.addEvent(matchId, req.body);
      res.status(201).json(result);
    } catch (error: any) {
      logger.error('Add event error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  updateEvent: async (req: Request, res: Response) => {
    try {
      const { matchId, id } = req.params;
      const result = await liveService.updateEvent(matchId, id, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Update event error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  deleteEvent: async (req: Request, res: Response) => {
    try {
      const { matchId, id } = req.params;
      const result = await liveService.deleteEvent(matchId, id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Delete event error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  validateEvent: async (req: Request, res: Response) => {
    try {
      const { matchId, id } = req.params;
      const result = await liveService.validateEvent(matchId, id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Validate event error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Live Commentary
  getCommentary: async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const result = await liveService.getCommentary(matchId);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get commentary error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  addCommentary: async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const result = await liveService.addCommentary(matchId, req.body);
      res.status(201).json(result);
    } catch (error: any) {
      logger.error('Add commentary error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Match Statistics (Real-time)
  getMatchStats: async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const result = await liveService.getMatchStats(matchId);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get match stats error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
};