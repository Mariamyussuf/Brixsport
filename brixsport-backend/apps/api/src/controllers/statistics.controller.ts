import { Request, Response } from 'express';
import { statisticsService } from '../services/statistics.service';
import { logger } from '../utils/logger';

// Player Statistics Controllers
export const getPlayerStatistics = async (req: Request, res: Response) => {
  try {
    const { id: playerId } = req.params;
    
    const stats = await statisticsService.getPlayerStatistics(playerId);
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Get player statistics error', error);
    
    if (error.name === 'EntityNotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getPlayerTrends = async (req: Request, res: Response) => {
  try {
    const { id: playerId } = req.params;
    const { period, limit } = req.query;
    
    const trends = await statisticsService.getPlayerTrends(
      playerId,
      period as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEASON',
      limit ? parseInt(limit as string) : undefined
    );
    
    return res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error: any) {
    logger.error('Get player trends error', error);
    
    if (error.name === 'EntityNotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const comparePlayers = async (req: Request, res: Response) => {
  try {
    const { id: playerId } = req.params;
    const { compareWith, metrics } = req.query;
    
    const comparison = await statisticsService.comparePlayers(
      playerId,
      compareWith as string,
      metrics ? (Array.isArray(metrics) ? metrics.map(String) : [String(metrics)]) : undefined
    );
    
    return res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (error: any) {
    logger.error('Compare players error', error);
    
    if (error.name === 'EntityNotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Team Statistics Controllers
export const getTeamStatistics = async (req: Request, res: Response) => {
  try {
    const { id: teamId } = req.params;
    
    const stats = await statisticsService.getTeamStatistics(teamId);
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Get team statistics error', error);
    
    if (error.name === 'EntityNotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getTeamTrends = async (req: Request, res: Response) => {
  try {
    const { id: teamId } = req.params;
    const { period, limit } = req.query;
    
    const trends = await statisticsService.getTeamTrends(
      teamId,
      period as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEASON',
      limit ? parseInt(limit as string) : undefined
    );
    
    return res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error: any) {
    logger.error('Get team trends error', error);
    
    if (error.name === 'EntityNotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const compareTeams = async (req: Request, res: Response) => {
  try {
    const { id: teamId } = req.params;
    const { compareWith, metrics } = req.query;
    
    const comparison = await statisticsService.compareTeams(
      teamId,
      compareWith as string,
      metrics ? (Array.isArray(metrics) ? metrics.map(String) : [String(metrics)]) : undefined
    );
    
    return res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (error: any) {
    logger.error('Compare teams error', error);
    
    if (error.name === 'EntityNotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Competition Statistics Controllers
export const getCompetitionStatistics = async (req: Request, res: Response) => {
  try {
    const { id: competitionId } = req.params;
    
    const stats = await statisticsService.getCompetitionStatistics(competitionId);
    
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    logger.error('Get competition statistics error', error);
    
    if (error.name === 'EntityNotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Competition not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getCompetitionStandings = async (req: Request, res: Response) => {
  try {
    const { id: competitionId } = req.params;
    
    const standings = await statisticsService.getCompetitionStandings(competitionId);
    
    return res.status(200).json({
      success: true,
      data: standings
    });
  } catch (error: any) {
    logger.error('Get competition standings error', error);
    
    if (error.name === 'EntityNotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Competition not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getTopPerformers = async (req: Request, res: Response) => {
  try {
    const { id: competitionId } = req.params;
    const { category, limit } = req.query;
    
    const performers = await statisticsService.getTopPerformers(
      competitionId,
      category as string,
      limit ? parseInt(limit as string) : undefined
    );
    
    return res.status(200).json({
      success: true,
      data: performers
    });
  } catch (error: any) {
    logger.error('Get top performers error', error);
    
    if (error.name === 'EntityNotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Competition not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Analytics Report Controllers
export const getPlayerAnalyticsReport = async (req: Request, res: Response) => {
  try {
    const { id: playerId } = req.params;
    const { timeRange, startDate, endDate } = req.query;
    
    const report = await statisticsService.getPlayerAnalyticsReport(
      playerId,
      timeRange as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error: any) {
    logger.error('Get player analytics report error', error);
    
    if (error.name === 'EntityNotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

export const getTeamAnalyticsReport = async (req: Request, res: Response) => {
  try {
    const { id: teamId } = req.params;
    const { timeRange, startDate, endDate } = req.query;
    
    const report = await statisticsService.getTeamAnalyticsReport(
      teamId,
      timeRange as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error: any) {
    logger.error('Get team analytics report error', error);
    
    if (error.name === 'EntityNotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Export the controller as an object
export const statisticsController = {
  getPlayerStatistics,
  getPlayerTrends,
  comparePlayers,
  getTeamStatistics,
  getTeamTrends,
  compareTeams,
  getCompetitionStatistics,
  getCompetitionStandings,
  getTopPerformers,
  getPlayerAnalyticsReport,
  getTeamAnalyticsReport
};