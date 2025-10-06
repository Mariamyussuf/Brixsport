import { Request, Response } from 'express';
import { TeamService } from '../services/team.service';
import { 
  teamValidationRules,
  addPlayerValidationRules,
  removePlayerValidationRules,
  getTeamsValidationRules,
  getMatchesValidationRules,
  searchTeamsValidationRules,
  getTeamValidationRules,
  updateTeamValidationRules,
  deleteTeamValidationRules
} from '../validation/team.validation';
import { Team, Player, Match, Competition, TeamStats } from '../types/team.types';
import { logger } from '../utils/logger';
import { errorHandlerService } from '../services/error.handler.service';

const teamService = new TeamService();

export class TeamController {
  // Get all teams with pagination and filtering
  async getTeams(req: Request, res: Response): Promise<Response> {
    try {
      const {
        page = 1,
        limit = 20,
        sport,
        status,
        search,
        sortBy = 'name',
        sortOrder = 'ASC'
      } = req.query;
      
      const result = await teamService.getTeams(
        parseInt(page as string),
        parseInt(limit as string),
        sport as string,
        status as string,
        search as string,
        sortBy as string,
        sortOrder as 'ASC' | 'DESC'
      );
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get teams error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
  
  // Get a specific team by ID
  async getTeamById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const team = await teamService.getTeamById(id);
      
      if (!team) {
        return res.status(404).json({
          error: {
            code: 'TEAM_NOT_FOUND',
            message: 'Team not found'
          }
        });
      }
      
      return res.status(200).json({ team });
    } catch (error: any) {
      logger.error('Get team by ID error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
  
  // Create a new team
  async createTeam(req: Request, res: Response): Promise<Response> {
    try {
      const teamData = req.body;
      const newTeam = await teamService.createTeam(teamData);
      return res.status(201).json({ team: newTeam });
    } catch (error: any) {
      logger.error('Create team error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      // Check if it's a validation error
      if (error.error) {
        return res.status(400).json(error);
      }
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
  
  // Update an existing team
  async updateTeam(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const teamData = req.body;
      const updatedTeam = await teamService.updateTeam(id, teamData);
      
      if (!updatedTeam) {
        return res.status(404).json({
          error: {
            code: 'TEAM_NOT_FOUND',
            message: 'Team not found'
          }
        });
      }
      
      return res.status(200).json({ team: updatedTeam });
    } catch (error: any) {
      logger.error('Update team error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
  
  // Delete a team (soft delete)
  async deleteTeam(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deleted = await teamService.deleteTeam(id);
      
      if (!deleted) {
        return res.status(404).json({
          error: {
            code: 'TEAM_NOT_FOUND',
            message: 'Team not found'
          }
        });
      }
      
      return res.status(200).json({
        message: 'Team deleted successfully'
      });
    } catch (error: any) {
      logger.error('Delete team error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
  
  // Get all players for a specific team
  async getTeamPlayers(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status, position } = req.query;
      
      const players = await teamService.getTeamPlayers(
        id,
        status as string,
        position as string
      );
      
      return res.status(200).json({ players });
    } catch (error: any) {
      logger.error('Get team players error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      // Check if it's a validation error
      if (error.error) {
        return res.status(400).json(error);
      }
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
  
  // Add a player to a team
  async addPlayerToTeam(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { playerId } = req.body;
      
      const player = await teamService.addPlayerToTeam(id, playerId);
      
      if (!player) {
        return res.status(404).json({
          error: {
            code: 'PLAYER_NOT_FOUND',
            message: 'Player not found'
          }
        });
      }
      
      return res.status(200).json({ player });
    } catch (error: any) {
      logger.error('Add player to team error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
  
  // Remove a player from a team
  async removePlayerFromTeam(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { playerId } = req.body;
      
      const removed = await teamService.removePlayerFromTeam(id, playerId);
      
      if (!removed) {
        return res.status(404).json({
          error: {
            code: 'PLAYER_NOT_FOUND',
            message: 'Player not found or not in team'
          }
        });
      }
      
      return res.status(200).json({
        message: 'Player removed from team successfully'
      });
    } catch (error: any) {
      logger.error('Remove player from team error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
  
  // Get team matches
  async getTeamMatches(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, status, competitionId } = req.query;
      
      const result = await teamService.getTeamMatches(
        id,
        parseInt(page as string),
        parseInt(limit as string),
        status as string,
        competitionId as string
      );
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get team matches error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      // Check if it's a validation error
      if (error.error) {
        return res.status(400).json(error);
      }
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
  
  // Get team competitions
  async getTeamCompetitions(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      const competitions = await teamService.getTeamCompetitions(id);
      
      return res.status(200).json({ competitions });
    } catch (error: any) {
      logger.error('Get team competitions error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
  
  // Get team statistics
  async getTeamStats(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      const stats = await teamService.getTeamStats(id);
      
      return res.status(200).json({ stats });
    } catch (error: any) {
      logger.error('Get team stats error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
  
  // Search teams
  async searchTeams(req: Request, res: Response): Promise<Response> {
    try {
      const { query, sports, countries, minFoundedYear, maxFoundedYear } = req.query;
      
      const result = await teamService.searchTeams(
        query as string,
        sports ? (sports as string).split(',') : undefined,
        countries ? (countries as string).split(',') : undefined,
        minFoundedYear ? parseInt(minFoundedYear as string) : undefined,
        maxFoundedYear ? parseInt(maxFoundedYear as string) : undefined
      );
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Search teams error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      // Check if it's a validation error
      if (error.error) {
        return res.status(400).json(error);
      }
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
}