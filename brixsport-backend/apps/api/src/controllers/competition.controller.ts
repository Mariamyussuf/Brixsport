import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { competitionService } from '../services/competition.service';
import { errorHandlerService } from '../services/error.handler.service';
import {
  createCompetitionSchema,
  addTeamSchema,
  cancelCompetitionSchema,
  rescheduleMatchSchema,
  postponeMatchSchema
} from '../validation/competition.validation';

export const competitionController = {
  // List competitions
  listCompetitions: async (req: Request, res: Response) => {
    try {
      const filters = {
        type: req.query.type as string | undefined,
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
        search: req.query.search as string | undefined
      };

      const competitions = await competitionService.listCompetitions(filters);

      if (!competitions.success) {
        throw new Error(competitions.error || 'Failed to fetch competitions');
      }

      return res.status(200).json({
        success: true,
        data: competitions.data,
        meta: competitions.meta
      });
    } catch (error: any) {
      logger.error('List competitions error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 1. Create Competition with Group Stage Support
  createCompetition: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      // Validate input
      const validatedData = createCompetitionSchema.parse(req.body);

      const result = await competitionService.createCompetition(validatedData, userId);
      
      return res.status(201).json({
        success: true,
        data: result,
        message: 'Competition created successfully'
      });
    } catch (error: any) {
      logger.error('Create competition error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 2. Start Registration Phase
  startRegistration: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const result = await competitionService.startRegistration(id, userId);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Registration started successfully'
      });
    } catch (error: any) {
      logger.error('Start registration error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 3. Add Team to Competition (During Registration)
  addTeamToCompetition: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Validate input
      const validatedData = addTeamSchema.parse(req.body);
      
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const result = await competitionService.addTeamToCompetition(id, validatedData.team_id, userId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Team added to competition successfully'
      });
    } catch (error: any) {
      logger.error('Add team to competition error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 4. Generate Groups (After Registration)
  generateGroups: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const result = await competitionService.generateGroups(id, userId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Groups generated successfully'
      });
    } catch (error: any) {
      logger.error('Generate groups error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 5. Get Competition Groups
  getCompetitionGroups: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await competitionService.getCompetitionGroups(id);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get competition groups error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 6. Generate Group Stage Fixtures
  generateGroupFixtures: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const result = await competitionService.generateGroupFixtures(id, userId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Group stage fixtures generated successfully'
      });
    } catch (error: any) {
      logger.error('Generate group fixtures error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 7. Start Group Stage
  startGroupStage: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const result = await competitionService.startGroupStage(id, userId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Group stage started successfully'
      });
    } catch (error: any) {
      logger.error('Start group stage error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 8. Get Group Standings
  getGroupStandings: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await competitionService.getGroupStandings(id);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get group standings error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 9. Determine Knockout Stage Teams
  determineKnockoutTeams: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const result = await competitionService.determineKnockoutTeams(id, userId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Knockout stage teams determined successfully'
      });
    } catch (error: any) {
      logger.error('Determine knockout teams error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 10. Generate Knockout Stage Fixtures
  generateKnockoutFixtures: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const result = await competitionService.generateKnockoutFixtures(id, userId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Knockout stage fixtures generated successfully'
      });
    } catch (error: any) {
      logger.error('Generate knockout fixtures error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 11. Start Knockout Stage
  startKnockoutStage: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const result = await competitionService.startKnockoutStage(id, userId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Knockout stage started successfully'
      });
    } catch (error: any) {
      logger.error('Start knockout stage error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 12. Get Knockout Stage Structure
  getKnockoutStructure: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await competitionService.getKnockoutStructure(id);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get knockout structure error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 13. Complete Competition
  completeCompetition: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const result = await competitionService.completeCompetition(id, userId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Competition completed successfully'
      });
    } catch (error: any) {
      logger.error('Complete competition error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 14. Get Competition Final Standings
  getFinalStandings: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await competitionService.getFinalStandings(id);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get final standings error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 15. Cancel Competition
  cancelCompetition: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Validate input
      const validatedData = cancelCompetitionSchema.parse(req.body);
      
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const result = await competitionService.cancelCompetition(id, validatedData.reason, userId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Competition cancelled successfully'
      });
    } catch (error: any) {
      logger.error('Cancel competition error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 16. Get Competition Statistics
  getCompetitionStatistics: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await competitionService.getCompetitionStatistics(id);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get competition statistics error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 17. Get Competition Matches by Stage
  getCompetitionMatches: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { stage, status, group_id, round, limit, offset } = req.query;
      
      const filters: any = {};
      if (stage) filters.stage = stage;
      if (status) filters.status = status;
      if (group_id) filters.group_id = group_id;
      if (round) filters.round = round;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);
      
      const result = await competitionService.getCompetitionMatches(id, filters);
      
      return res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error: any) {
      logger.error('Get competition matches error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 18. Reschedule Match
  rescheduleMatch: async (req: Request, res: Response) => {
    try {
      const { id, match_id } = req.params;
      
      // Validate input
      const validatedData = rescheduleMatchSchema.parse(req.body);
      
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const result = await competitionService.rescheduleMatch(
        id, 
        match_id, 
        validatedData.new_date, 
        validatedData.new_venue, 
        userId
      );
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Match rescheduled successfully'
      });
    } catch (error: any) {
      logger.error('Reschedule match error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 19. Postpone Match
  postponeMatch: async (req: Request, res: Response) => {
    try {
      const { id, match_id } = req.params;
      
      // Validate input
      const validatedData = postponeMatchSchema.parse(req.body);
      
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
      }

      const result = await competitionService.postponeMatch(id, match_id, validatedData.reason, userId);
      
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Match postponed successfully'
      });
    } catch (error: any) {
      logger.error('Postpone match error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // 20. Get Competition Timeline
  getCompetitionTimeline: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const result = await competitionService.getCompetitionTimeline(id);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Get competition timeline error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
};