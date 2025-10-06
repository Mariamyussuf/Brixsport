import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { matchService } from '../services/match.service';
import { errorHandlerService } from '../services/error.handler.service';

export const matchesController = {
  // Home & Discovery
  getHomeFeed: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      const result = await matchService.getHomeFeed(userId);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Home feed error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getDiscoverContent: async (req: Request, res: Response) => {
    try {
      const result = await matchService.getDiscoverContent();
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Discover content error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getTrending: async (req: Request, res: Response) => {
    try {
      const result = await matchService.getTrending();
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Trending content error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Competitions
  listCompetitions: async (req: Request, res: Response) => {
    try {
      const result = await matchService.listCompetitions(req.query);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('List competitions error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getCompetition: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.getCompetition(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get competition error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getCompetitionMatches: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.getCompetitionMatches(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get competition matches error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getCompetitionStandings: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.getCompetitionStandings(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get competition standings error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getCompetitionStats: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.getCompetitionStats(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get competition stats error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  createCompetition: async (req: Request, res: Response) => {
    try {
      const result = await matchService.createCompetition(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      logger.error('Create competition error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  updateCompetition: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.updateCompetition(id, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Update competition error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  deleteCompetition: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.deleteCompetition(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Delete competition error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Teams
  listTeams: async (req: Request, res: Response) => {
    try {
      const result = await matchService.listTeams(req.query);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('List teams error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getTeam: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.getTeam(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get team error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getTeamMatches: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.getTeamMatches(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get team matches error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getTeamPlayers: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.getTeamPlayers(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get team players error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getTeamStats: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.getTeamStats(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get team stats error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  createTeam: async (req: Request, res: Response) => {
    try {
      const result = await matchService.createTeam(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      logger.error('Create team error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  updateTeam: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.updateTeam(id, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Update team error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  deleteTeam: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.deleteTeam(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Delete team error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Players
  listPlayers: async (req: Request, res: Response) => {
    try {
      const result = await matchService.listPlayers(req.query);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('List players error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getPlayer: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.getPlayer(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get player error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getPlayerMatches: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.getPlayerMatches(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get player matches error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getPlayerStats: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.getPlayerStats(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get player stats error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  createPlayer: async (req: Request, res: Response) => {
    try {
      const result = await matchService.createPlayer(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      logger.error('Create player error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  updatePlayer: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.updatePlayer(id, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Update player error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  deletePlayer: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.deletePlayer(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Delete player error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Matches
  listMatches: async (req: Request, res: Response) => {
    try {
      // Extract and validate query parameters
      const filters: any = {};
      
      // Handle status filter
      if (req.query.status && typeof req.query.status === 'string') {
        filters.status = req.query.status;
      }
      
      // Handle competition filter
      if (req.query.competitionId && typeof req.query.competitionId === 'string') {
        filters.competitionId = req.query.competitionId;
      }
      
      // Handle sport filter
      if (req.query.sport && typeof req.query.sport === 'string') {
        filters.sport = req.query.sport;
        logger.info('Filtering matches by sport', { sport: req.query.sport });
      }
      
      const result = await matchService.listMatches(filters);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('List matches error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getMatch: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.getMatch(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get match error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getMatchEvents: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.getMatchEvents(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get match events error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getMatchLineups: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.getMatchLineups(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get match lineups error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  getMatchStats: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.getMatchStats(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get match stats error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  createMatch: async (req: Request, res: Response) => {
    try {
      const result = await matchService.createMatch(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      logger.error('Create match error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  updateMatch: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.updateMatch(id, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Update match error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  deleteMatch: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await matchService.deleteMatch(id);
      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Delete match error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
};