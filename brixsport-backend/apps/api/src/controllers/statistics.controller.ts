import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { statisticsService } from '../services/statistics.service';
import { 
  PlayerStatistics, 
  TeamStatistics, 
  CompetitionStatistics, 
  PerformanceTrend,
  Standing,
  TopPerformer,
  PlayerComparison,
  TeamComparison,
  PlayerAnalyticsReport,
  TeamAnalyticsReport,
  ComparisonResult
} from '../types/statistics.types';
import { errorHandlerService } from '../services/error.handler.service';

export const statisticsController = {
  // Player Statistics Controllers
  getPlayerStatistics: async (req: Request, res: Response) => {
    try {
      const { id: playerId } = req.params;
      
      const result = await statisticsService.getPlayerStatistics(playerId);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get player statistics error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'Player not found') {
        return res.status(404).json({
          success: false,
          error: 'Player not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getPlayerTrends: async (req: Request, res: Response) => {
    try {
      const { id: playerId } = req.params;
      const { period, limit } = req.query;
      
      const result = await statisticsService.getPlayerTrends(
        playerId,
        period as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEASON' || 'MONTHLY',
        limit ? parseInt(limit as string) : 12
      );
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get player trends error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'Player not found') {
        return res.status(404).json({
          success: false,
          error: 'Player not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  comparePlayers: async (req: Request, res: Response) => {
    try {
      const { id: playerId } = req.params;
      const { compareWith, metrics } = req.query;
      
      // Validate required query parameter
      if (!compareWith) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'compareWith query parameter is required'
        });
      }
      
      const result = await statisticsService.comparePlayers(
        playerId,
        compareWith as string,
        metrics ? (metrics as string).split(',') : undefined
      );
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Compare players error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'Player not found') {
        return res.status(404).json({
          success: false,
          error: 'Player not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Team Statistics Controllers
  getTeamStatistics: async (req: Request, res: Response) => {
    try {
      const { id: teamId } = req.params;
      
      const result = await statisticsService.getTeamStatistics(teamId);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get team statistics error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'Team not found') {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getTeamTrends: async (req: Request, res: Response) => {
    try {
      const { id: teamId } = req.params;
      const { period, limit } = req.query;
      
      const result = await statisticsService.getTeamTrends(
        teamId,
        period as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEASON' || 'MONTHLY',
        limit ? parseInt(limit as string) : 12
      );
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get team trends error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'Team not found') {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  compareTeams: async (req: Request, res: Response) => {
    try {
      const { id: teamId } = req.params;
      const { compareWith, metrics } = req.query;
      
      // Validate required query parameter
      if (!compareWith) {
        return res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'compareWith query parameter is required'
        });
      }
      
      const result = await statisticsService.compareTeams(
        teamId,
        compareWith as string,
        metrics ? (metrics as string).split(',') : undefined
      );
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Compare teams error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'Team not found') {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Competition Statistics Controllers
  getCompetitionStatistics: async (req: Request, res: Response) => {
    try {
      const { id: competitionId } = req.params;
      
      const result = await statisticsService.getCompetitionStatistics(competitionId);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get competition statistics error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'Competition not found') {
        return res.status(404).json({
          success: false,
          error: 'Competition not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getCompetitionStandings: async (req: Request, res: Response) => {
    try {
      const { id: competitionId } = req.params;
      const { sortBy, sortOrder } = req.query;
      
      const result = await statisticsService.getCompetitionStandings(
        competitionId,
        sortBy as string,
        sortOrder as 'ASC' | 'DESC'
      );
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get competition standings error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'Competition not found') {
        return res.status(404).json({
          success: false,
          error: 'Competition not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getTopPerformers: async (req: Request, res: Response) => {
    try {
      const { id: competitionId } = req.params;
      const { category, limit } = req.query;
      
      const result = await statisticsService.getTopPerformers(
        competitionId,
        category as string,
        limit ? parseInt(limit as string) : 10
      );
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get top performers error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'Competition not found') {
        return res.status(404).json({
          success: false,
          error: 'Competition not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Analytics and Reports
  getPlayerAnalyticsReport: async (req: Request, res: Response) => {
    try {
      const { id: playerId } = req.params;
      const { timeRange, startDate, endDate } = req.query;
      
      const result = await statisticsService.getPlayerAnalyticsReport(
        playerId,
        timeRange as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get player analytics report error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'Player not found') {
        return res.status(404).json({
          success: false,
          error: 'Player not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getTeamAnalyticsReport: async (req: Request, res: Response) => {
    try {
      const { id: teamId } = req.params;
      const { timeRange, startDate, endDate } = req.query;
      
      const result = await statisticsService.getTeamAnalyticsReport(
        teamId,
        timeRange as string,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get team analytics report error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'Team not found') {
        return res.status(404).json({
          success: false,
          error: 'Team not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
};