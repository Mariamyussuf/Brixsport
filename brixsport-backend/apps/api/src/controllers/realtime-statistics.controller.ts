import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { matchEventAggregatorService } from '../services/matchEventAggregator.service';
import { heatMapService } from '../services/heatMap.service';
import { comparisonAnalyticsService } from '../services/comparisonAnalytics.service';
import { exportService } from '../services/export.service';
import { supabaseService } from '../services/supabase.service';

// Controller for statistics-related endpoints
export const statisticsController = {
  // Get real-time match statistics
  getMatchStats: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { matchId } = req.params;
      
      if (!matchId) {
        return res.status(400).json({ error: 'Match ID is required' });
      }
      
      const stats = await matchEventAggregatorService.getMatchStats(matchId);
      return res.json(stats);
    } catch (error: any) {
      logger.error('Get match stats error', error);
      return res.status(500).json({ error: 'Failed to get match statistics' });
    }
  },
  
  // Process a new match event
  processMatchEvent: async (req: Request, res: Response): Promise<Response> => {
    try {
      const matchEvent = req.body;
      
      if (!matchEvent.matchId || !matchEvent.eventType) {
        return res.status(400).json({ error: 'Match ID and event type are required' });
      }
      
      const updatedStats = await matchEventAggregatorService.processMatchEvent(matchEvent);
      return res.json(updatedStats);
    } catch (error: any) {
      logger.error('Process match event error', error);
      return res.status(500).json({ error: 'Failed to process match event' });
    }
  },
  
  // Get heat map data
  getHeatMap: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { matchId } = req.params;
      const { playerId, teamId } = req.query;
      
      if (!matchId) {
        return res.status(400).json({ error: 'Match ID is required' });
      }
      
      let heatMapData;
      if (playerId) {
        heatMapData = await heatMapService.generatePlayerHeatMap(matchId as string, playerId as string);
      } else if (teamId) {
        heatMapData = await heatMapService.generateTeamHeatMap(matchId as string, teamId as string);
      } else {
        heatMapData = await heatMapService.generateMatchHeatMap(matchId as string);
      }
      
      return res.json(heatMapData);
    } catch (error: any) {
      logger.error('Get heat map error', error);
      return res.status(500).json({ error: 'Failed to get heat map data' });
    }
  },
  
  // Compare players
  comparePlayers: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { playerId } = req.params;
      const { comparisonType, comparisonTargetId, metrics } = req.query;
      
      if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
      }
      
      // Type guard to ensure metrics is a string array
      const stringMetrics = metrics 
        ? Array.isArray(metrics) 
          ? metrics.filter((m): m is string => typeof m === 'string')
          : typeof metrics === 'string' 
            ? [metrics]
            : []
        : undefined;

      const comparison = await comparisonAnalyticsService.comparePlayers(
        playerId,
        comparisonType === 'player' ? 'player' : 'league_average',
        comparisonTargetId as string,
        stringMetrics
      );
      
      return res.json(comparison);
    } catch (error: any) {
      logger.error('Compare players error', error);
      return res.status(500).json({ error: 'Failed to compare players' });
    }
  },
  
  // Compare teams
  compareTeams: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { teamId } = req.params;
      const { comparisonType, comparisonTargetId, metrics } = req.query;
      
      if (!teamId) {
        return res.status(400).json({ error: 'Team ID is required' });
      }
      
      // Type guard to ensure metrics is a string array
      const stringMetrics = metrics 
        ? Array.isArray(metrics) 
          ? metrics.filter((m): m is string => typeof m === 'string')
          : typeof metrics === 'string' 
            ? [metrics]
            : []
        : undefined;

      const comparison = await comparisonAnalyticsService.compareTeams(
        teamId,
        comparisonType === 'team' ? 'team' : 'league_average',
        comparisonTargetId as string,
        stringMetrics
      );
      
      return res.json(comparison);
    } catch (error: any) {
      logger.error('Compare teams error', error);
      return res.status(500).json({ error: 'Failed to compare teams' });
    }
  },
  
  // Export player statistics to CSV
  exportPlayerStatsCSV: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { playerId } = req.params;
      
      if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
      }
      
      // Get player statistics
      const playerStats = await comparisonAnalyticsService.getPlayerStatistics(playerId);
      
      // Export to CSV
      const csvBuffer = await exportService.exportPlayerStatsToCSV(playerStats);
      
      // Get player name for filename
      const playerResult = await supabaseService.getPlayer(playerId);
      const playerName = playerResult.success ? `${playerResult.data.firstName}_${playerResult.data.lastName}` : 'player';
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${playerName}_stats.csv"`);
      return res.send(csvBuffer);
    } catch (error: any) {
      logger.error('Export player stats to CSV error', error);
      return res.status(500).json({ error: 'Failed to export player statistics to CSV' });
    }
  },
  
  // Export player statistics to PDF
  exportPlayerStatsPDF: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { playerId } = req.params;
      
      if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
      }
      
      // Get player statistics
      const playerStats = await comparisonAnalyticsService.getPlayerStatistics(playerId);
      
      // Get player name
      const playerResult = await supabaseService.getPlayer(playerId);
      const playerName = playerResult.success ? `${playerResult.data.firstName} ${playerResult.data.lastName}` : undefined;
      
      // Export to PDF
      const pdfBuffer = await exportService.exportPlayerStatsToPDF(playerStats, playerName);
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${playerName ? playerName.replace(/\s+/g, '_') : 'player'}_stats.pdf"`);
      return res.send(pdfBuffer);
    } catch (error: any) {
      logger.error('Export player stats to PDF error', error);
      return res.status(500).json({ error: 'Failed to export player statistics to PDF' });
    }
  },
  
  // Export team statistics to CSV
  exportTeamStatsCSV: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { teamId } = req.params;
      
      if (!teamId) {
        return res.status(400).json({ error: 'Team ID is required' });
      }
      
      // Get team statistics
      const teamStats = await comparisonAnalyticsService.getTeamStatistics(teamId);
      
      // Export to CSV
      const csvBuffer = await exportService.exportTeamStatsToCSV(teamStats);
      
      // Get team name for filename
      const teamResult = await supabaseService.getTeam(teamId);
      const teamName = teamResult.success ? teamResult.data.name.replace(/\s+/g, '_') : 'team';
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${teamName}_stats.csv"`);
      return res.send(csvBuffer);
    } catch (error: any) {
      logger.error('Export team stats to CSV error', error);
      return res.status(500).json({ error: 'Failed to export team statistics to CSV' });
    }
  },
  
  // Export team statistics to PDF
  exportTeamStatsPDF: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { teamId } = req.params;
      
      if (!teamId) {
        return res.status(400).json({ error: 'Team ID is required' });
      }
      
      // Get team statistics
      const teamStats = await comparisonAnalyticsService.getTeamStatistics(teamId);
      
      // Get team name
      const teamResult = await supabaseService.getTeam(teamId);
      const teamName = teamResult.success ? teamResult.data.name : undefined;
      
      // Export to PDF
      const pdfBuffer = await exportService.exportTeamStatsToPDF(teamStats, teamName);
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${teamName ? teamName.replace(/\s+/g, '_') : 'team'}_stats.pdf"`);
      return res.send(pdfBuffer);
    } catch (error: any) {
      logger.error('Export team stats to PDF error', error);
      return res.status(500).json({ error: 'Failed to export team statistics to PDF' });
    }
  },
  
  // Export player comparison to CSV
  exportPlayerComparisonCSV: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { playerId } = req.params;
      const { comparisonType, comparisonTargetId } = req.query;
      
      if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
      }
      
      // Get comparison data
      const comparison = await comparisonAnalyticsService.comparePlayers(
        playerId,
        comparisonType === 'player' ? 'player' : 'league_average',
        comparisonTargetId as string
      );
      
      // Export to CSV
      const csvBuffer = await exportService.exportPlayerComparisonToCSV(comparison);
      
      // Get player name for filename
      const playerResult = await supabaseService.getPlayer(playerId);
      const playerName = playerResult.success ? `${playerResult.data.firstName}_${playerResult.data.lastName}` : 'player';
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${playerName}_comparison.csv"`);
      return res.send(csvBuffer);
    } catch (error: any) {
      logger.error('Export player comparison to CSV error', error);
      return res.status(500).json({ error: 'Failed to export player comparison to CSV' });
    }
  },
  
  // Export player comparison to PDF
  exportPlayerComparisonPDF: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { playerId } = req.params;
      const { comparisonType, comparisonTargetId } = req.query;
      
      if (!playerId) {
        return res.status(400).json({ error: 'Player ID is required' });
      }
      
      // Get comparison data
      const comparison = await comparisonAnalyticsService.comparePlayers(
        playerId,
        comparisonType === 'player' ? 'player' : 'league_average',
        comparisonTargetId as string
      );
      
      // Get player name
      const playerResult = await supabaseService.getPlayer(playerId);
      const playerName = playerResult.success ? `${playerResult.data.firstName} ${playerResult.data.lastName}` : undefined;
      
      // Export to PDF
      const pdfBuffer = await exportService.exportPlayerComparisonToPDF(comparison, playerName);
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${playerName ? playerName.replace(/\s+/g, '_') : 'player'}_comparison.pdf"`);
      return res.send(pdfBuffer);
    } catch (error: any) {
      logger.error('Export player comparison to PDF error', error);
      return res.status(500).json({ error: 'Failed to export player comparison to PDF' });
    }
  }
};