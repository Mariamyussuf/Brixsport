import { logger } from '../utils/logger';
import { createObjectCsvWriter } from 'csv-writer';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { 
  PlayerStatistics, 
  TeamStatistics, 
  CompetitionStatistics,
  PlayerComparison,
  TeamComparison
} from '../types/statistics.types';
import { RealTimeMatchStats } from './matchEventAggregator.service';
import { PlayerPerformanceMetrics, AdvancedPlayerMetrics } from '../types/performance.metrics';

// Error types for better error handling
export class ExportServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ExportServiceError';
  }
}

export class ValidationError extends ExportServiceError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

// Export service
export const exportService = {
  // Export player statistics to CSV
  exportPlayerStatsToCSV: async (playerStats: PlayerStatistics): Promise<Buffer> => {
    try {
      logger.info('Exporting player statistics to CSV', { playerId: playerStats.playerId });
      
      // Create a PassThrough stream to capture CSV data
      const csvStream = new PassThrough();
      
      // Create CSV writer
      const csvWriter = createObjectCsvWriter({
        path: '', // We'll use the stream instead of writing to a file
        header: [
          { id: 'metric', title: 'Metric' },
          { id: 'value', title: 'Value' }
        ]
      });
      
      // Prepare data for CSV
      const records = [
        { metric: 'Player ID', value: playerStats.playerId },
        { metric: 'Sport', value: playerStats.sport },
        { metric: 'Matches Played', value: playerStats.matchesPlayed.toString() },
        { metric: 'Minutes Played', value: playerStats.minutesPlayed.toString() },
        { metric: 'Goals', value: playerStats.goals.toString() },
        { metric: 'Assists', value: playerStats.assists.toString() },
        { metric: 'Yellow Cards', value: playerStats.yellowCards.toString() },
        { metric: 'Red Cards', value: (playerStats.redCards || 0).toString() },
        { metric: 'Total Points', value: playerStats.totalPoints.toString() }
      ];
      
      // Add sport-specific metrics
      if (playerStats.sport === 'FOOTBALL' && playerStats.football) {
        records.push(
          { metric: 'Clean Sheets', value: (playerStats.football.cleanSheets || 0).toString() },
          { metric: 'Goals Conceded', value: (playerStats.football.goalsConceded || 0).toString() },
          { metric: 'Saves', value: (playerStats.football.saves || 0).toString() },
          { metric: 'Passes Completed', value: (playerStats.football.passesCompleted || 0).toString() },
          { metric: 'Pass Accuracy', value: (playerStats.football.passAccuracy || 0).toString() },
          { metric: 'Tackles', value: (playerStats.football.tackles || 0).toString() },
          { metric: 'Interceptions', value: (playerStats.football.interceptions || 0).toString() }
        );
      } else if (playerStats.sport === 'BASKETBALL' && playerStats.basketball) {
        records.push(
          { metric: 'Points', value: (playerStats.basketball.points || 0).toString() },
          { metric: 'Rebounds', value: (playerStats.basketball.rebounds || 0).toString() },
          { metric: 'Steals', value: (playerStats.basketball.steals || 0).toString() },
          { metric: 'Blocks', value: (playerStats.basketball.blocks || 0).toString() },
          { metric: 'Field Goal %', value: (playerStats.basketball.fieldGoalPercentage || 0).toString() },
          { metric: 'Three Point %', value: (playerStats.basketball.threePointPercentage || 0).toString() }
        );
      }
      
      // Convert to CSV
      let csvData = 'Metric,Value\n';
      records.forEach(record => {
        csvData += `"${record.metric}","${record.value}"\n`;
      });
      
      return Buffer.from(csvData, 'utf8');
    } catch (error: any) {
      logger.error('Export player stats to CSV error', error);
      throw new ExportServiceError('Failed to export player statistics to CSV', 'CSV_EXPORT_ERROR', 500, error);
    }
  },
  
  // Export team statistics to CSV
  exportTeamStatsToCSV: async (teamStats: TeamStatistics): Promise<Buffer> => {
    try {
      logger.info('Exporting team statistics to CSV', { teamId: teamStats.teamId });
      
      // Prepare data for CSV
      const records = [
        { metric: 'Team ID', value: teamStats.teamId },
        { metric: 'Sport', value: teamStats.sport },
        { metric: 'Matches Played', value: teamStats.matchesPlayed.toString() },
        { metric: 'Wins', value: teamStats.wins.toString() },
        { metric: 'Draws', value: teamStats.draws.toString() },
        { metric: 'Losses', value: teamStats.losses.toString() },
        { metric: 'Goals For', value: teamStats.goalsFor.toString() },
        { metric: 'Goals Against', value: teamStats.goalsAgainst.toString() },
        { metric: 'Goal Difference', value: teamStats.goalDifference.toString() },
        { metric: 'Points', value: teamStats.points.toString() },
        { metric: 'Win Percentage', value: teamStats.winPercentage.toString() }
      ];
      
      // Add sport-specific metrics
      if (teamStats.sport === 'FOOTBALL' && teamStats.football) {
        records.push(
          { metric: 'Clean Sheets', value: (teamStats.football.cleanSheets || 0).toString() },
          { metric: 'Goals Conceded', value: (teamStats.football.goalsConceded || 0).toString() },
          { metric: 'Shots', value: (teamStats.football.shots || 0).toString() },
          { metric: 'Shots On Target', value: (teamStats.football.shotsOnTarget || 0).toString() },
          { metric: 'Possession', value: (teamStats.football.possession || 0).toString() },
          { metric: 'Pass Accuracy', value: (teamStats.football.passAccuracy || 0).toString() },
          { metric: 'Tackles', value: (teamStats.football.tackles || 0).toString() },
          { metric: 'Interceptions', value: (teamStats.football.interceptions || 0).toString() },
          { metric: 'Yellow Cards', value: (teamStats.football.yellowCards || 0).toString() },
          { metric: 'Red Cards', value: (teamStats.football.redCards || 0).toString() }
        );
      } else if (teamStats.sport === 'BASKETBALL' && teamStats.basketball) {
        records.push(
          { metric: 'Points', value: (teamStats.basketball.points || 0).toString() },
          { metric: 'Rebounds', value: (teamStats.basketball.rebounds || 0).toString() },
          { metric: 'Assists', value: (teamStats.basketball.assists || 0).toString() },
          { metric: 'Steals', value: (teamStats.basketball.steals || 0).toString() },
          { metric: 'Blocks', value: (teamStats.basketball.blocks || 0).toString() },
          { metric: 'Field Goal %', value: (teamStats.basketball.fieldGoalPercentage || 0).toString() },
          { metric: 'Three Point %', value: (teamStats.basketball.threePointPercentage || 0).toString() },
          { metric: 'Free Throw %', value: (teamStats.basketball.freeThrowPercentage || 0).toString() }
        );
      }
      
      // Convert to CSV
      let csvData = 'Metric,Value\n';
      records.forEach(record => {
        csvData += `"${record.metric}","${record.value}"\n`;
      });
      
      return Buffer.from(csvData, 'utf8');
    } catch (error: any) {
      logger.error('Export team stats to CSV error', error);
      throw new ExportServiceError('Failed to export team statistics to CSV', 'CSV_EXPORT_ERROR', 500, error);
    }
  },
  
  // Export player comparison to CSV
  exportPlayerComparisonToCSV: async (comparison: PlayerComparison): Promise<Buffer> => {
    try {
      logger.info('Exporting player comparison to CSV');
      
      // Prepare data for CSV
      const records = [
        { metric: 'Player ID', value: comparison.player.playerId },
        { metric: 'Versus', value: comparison.comparison.versus }
      ];
      
      // Add comparison metrics
      Object.keys(comparison.comparison.metrics).forEach(metric => {
        const metricData = comparison.comparison.metrics[metric];
        records.push(
          { metric: `${metric} (Player)`, value: metricData.player.toString() },
          { metric: `${metric} (Comparison)`, value: metricData.comparison.toString() },
          { metric: `${metric} (Difference)`, value: metricData.difference.toString() },
          { metric: `${metric} (Percentage)`, value: `${metricData.percentage}%` }
        );
      });
      
      // Convert to CSV
      let csvData = 'Metric,Value\n';
      records.forEach(record => {
        csvData += `"${record.metric}","${record.value}"\n`;
      });
      
      return Buffer.from(csvData, 'utf8');
    } catch (error: any) {
      logger.error('Export player comparison to CSV error', error);
      throw new ExportServiceError('Failed to export player comparison to CSV', 'CSV_EXPORT_ERROR', 500, error);
    }
  },
  
  // Export team comparison to CSV
  exportTeamComparisonToCSV: async (comparison: TeamComparison): Promise<Buffer> => {
    try {
      logger.info('Exporting team comparison to CSV');
      
      // Prepare data for CSV
      const records = [
        { metric: 'Team ID', value: comparison.team.teamId },
        { metric: 'Versus', value: comparison.comparison.versus }
      ];
      
      // Add comparison metrics
      Object.keys(comparison.comparison.metrics).forEach(metric => {
        const metricData = comparison.comparison.metrics[metric];
        records.push(
          { metric: `${metric} (Team)`, value: metricData.team.toString() },
          { metric: `${metric} (Comparison)`, value: metricData.comparison.toString() },
          { metric: `${metric} (Difference)`, value: metricData.difference.toString() },
          { metric: `${metric} (Percentage)`, value: `${metricData.percentage}%` }
        );
      });
      
      // Convert to CSV
      let csvData = 'Metric,Value\n';
      records.forEach(record => {
        csvData += `"${record.metric}","${record.value}"\n`;
      });
      
      return Buffer.from(csvData, 'utf8');
    } catch (error: any) {
      logger.error('Export team comparison to CSV error', error);
      throw new ExportServiceError('Failed to export team comparison to CSV', 'CSV_EXPORT_ERROR', 500, error);
    }
  },
  
  // Export match statistics to CSV
  exportMatchStatsToCSV: async (matchStats: RealTimeMatchStats): Promise<Buffer> => {
    try {
      logger.info('Exporting match statistics to CSV', { matchId: matchStats.matchId });
      
      // Prepare data for CSV
      const records = [
        { metric: 'Match ID', value: matchStats.matchId },
        { metric: 'Home Team Goals', value: matchStats.homeTeamStats.goals.toString() },
        { metric: 'Away Team Goals', value: matchStats.awayTeamStats.goals.toString() },
        { metric: 'Home Team Shots', value: matchStats.homeTeamStats.shots.toString() },
        { metric: 'Away Team Shots', value: matchStats.awayTeamStats.shots.toString() },
        { metric: 'Home Team Shots On Target', value: matchStats.homeTeamStats.shotsOnTarget.toString() },
        { metric: 'Away Team Shots On Target', value: matchStats.awayTeamStats.shotsOnTarget.toString() },
        { metric: 'Home Team Possession', value: `${matchStats.homeTeamStats.possession}%` },
        { metric: 'Away Team Possession', value: `${matchStats.awayTeamStats.possession}%` },
        { metric: 'Home Team Pass Accuracy', value: `${matchStats.homeTeamStats.passAccuracy}%` },
        { metric: 'Away Team Pass Accuracy', value: `${matchStats.awayTeamStats.passAccuracy}%` },
        { metric: 'Home Team Yellow Cards', value: matchStats.homeTeamStats.yellowCards.toString() },
        { metric: 'Away Team Yellow Cards', value: matchStats.awayTeamStats.yellowCards.toString() },
        { metric: 'Home Team Red Cards', value: matchStats.homeTeamStats.redCards.toString() },
        { metric: 'Away Team Red Cards', value: matchStats.awayTeamStats.redCards.toString() }
      ];
      
      // Add player statistics
      Object.keys(matchStats.playerStats).forEach(playerId => {
        const playerStat = matchStats.playerStats[playerId];
        records.push(
          { metric: `Player ${playerId} Goals`, value: playerStat.goals.toString() },
          { metric: `Player ${playerId} Assists`, value: playerStat.assists.toString() },
          { metric: `Player ${playerId} Shots`, value: playerStat.shots.toString() },
          { metric: `Player ${playerId} Passes`, value: playerStat.passes.toString() },
          { metric: `Player ${playerId} Passes Completed`, value: playerStat.passesCompleted.toString() },
          { metric: `Player ${playerId} Tackles`, value: playerStat.tackles.toString() },
          { metric: `Player ${playerId} Interceptions`, value: playerStat.interceptions.toString() }
        );
      });
      
      // Convert to CSV
      let csvData = 'Metric,Value\n';
      records.forEach(record => {
        csvData += `"${record.metric}","${record.value}"\n`;
      });
      
      return Buffer.from(csvData, 'utf8');
    } catch (error: any) {
      logger.error('Export match stats to CSV error', error);
      throw new ExportServiceError('Failed to export match statistics to CSV', 'CSV_EXPORT_ERROR', 500, error);
    }
  },
  
  // Export player statistics to PDF
  exportPlayerStatsToPDF: async (playerStats: PlayerStatistics, playerName?: string): Promise<Buffer> => {
    try {
      logger.info('Exporting player statistics to PDF', { playerId: playerStats.playerId });
      
      // Create a PDF document
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      
      // Capture PDF data
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {});
      
      // Add title
      doc.fontSize(20).text(`Player Statistics Report${playerName ? ` - ${playerName}` : ''}`, { align: 'center' });
      doc.moveDown();
      
      // Add basic information
      doc.fontSize(12);
      doc.text(`Player ID: ${playerStats.playerId}`);
      doc.text(`Sport: ${playerStats.sport}`);
      doc.text(`Matches Played: ${playerStats.matchesPlayed}`);
      doc.text(`Minutes Played: ${playerStats.minutesPlayed}`);
      doc.moveDown();
      
      // Add statistics
      doc.fontSize(14).text('Statistics:', { underline: true });
      doc.fontSize(12);
      doc.text(`Goals: ${playerStats.goals}`);
      doc.text(`Assists: ${playerStats.assists}`);
      doc.text(`Yellow Cards: ${playerStats.yellowCards}`);
      doc.text(`Red Cards: ${playerStats.redCards || 0}`);
      doc.text(`Total Points: ${playerStats.totalPoints}`);
      doc.moveDown();
      
      // Add sport-specific statistics
      if (playerStats.sport === 'FOOTBALL' && playerStats.football) {
        doc.fontSize(14).text('Football Statistics:', { underline: true });
        doc.fontSize(12);
        doc.text(`Clean Sheets: ${playerStats.football.cleanSheets || 0}`);
        doc.text(`Goals Conceded: ${playerStats.football.goalsConceded || 0}`);
        doc.text(`Saves: ${playerStats.football.saves || 0}`);
        doc.text(`Passes Completed: ${playerStats.football.passesCompleted || 0}`);
        doc.text(`Pass Accuracy: ${playerStats.football.passAccuracy || 0}%`);
        doc.text(`Tackles: ${playerStats.football.tackles || 0}`);
        doc.text(`Interceptions: ${playerStats.football.interceptions || 0}`);
      } else if (playerStats.sport === 'BASKETBALL' && playerStats.basketball) {
        doc.fontSize(14).text('Basketball Statistics:', { underline: true });
        doc.fontSize(12);
        doc.text(`Points: ${playerStats.basketball.points || 0}`);
        doc.text(`Rebounds: ${playerStats.basketball.rebounds || 0}`);
        doc.text(`Assists: ${playerStats.basketball.assists || 0}`);
        doc.text(`Steals: ${playerStats.basketball.steals || 0}`);
        doc.text(`Blocks: ${playerStats.basketball.blocks || 0}`);
        doc.text(`Field Goal %: ${playerStats.basketball.fieldGoalPercentage || 0}%`);
        doc.text(`Three Point %: ${playerStats.basketball.threePointPercentage || 0}%`);
      }
      
      // Finalize PDF
      doc.end();
      
      // Wait for PDF generation to complete
      return new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        
        doc.on('error', (error) => {
          reject(new ExportServiceError('Failed to generate PDF', 'PDF_EXPORT_ERROR', 500, error));
        });
      });
    } catch (error: any) {
      logger.error('Export player stats to PDF error', error);
      throw new ExportServiceError('Failed to export player statistics to PDF', 'PDF_EXPORT_ERROR', 500, error);
    }
  },
  
  // Export team statistics to PDF
  exportTeamStatsToPDF: async (teamStats: TeamStatistics, teamName?: string): Promise<Buffer> => {
    try {
      logger.info('Exporting team statistics to PDF', { teamId: teamStats.teamId });
      
      // Create a PDF document
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      
      // Capture PDF data
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {});
      
      // Add title
      doc.fontSize(20).text(`Team Statistics Report${teamName ? ` - ${teamName}` : ''}`, { align: 'center' });
      doc.moveDown();
      
      // Add basic information
      doc.fontSize(12);
      doc.text(`Team ID: ${teamStats.teamId}`);
      doc.text(`Sport: ${teamStats.sport}`);
      doc.text(`Matches Played: ${teamStats.matchesPlayed}`);
      doc.moveDown();
      
      // Add results
      doc.fontSize(14).text('Results:', { underline: true });
      doc.fontSize(12);
      doc.text(`Wins: ${teamStats.wins}`);
      doc.text(`Draws: ${teamStats.draws}`);
      doc.text(`Losses: ${teamStats.losses}`);
      doc.text(`Goals For: ${teamStats.goalsFor}`);
      doc.text(`Goals Against: ${teamStats.goalsAgainst}`);
      doc.text(`Goal Difference: ${teamStats.goalDifference}`);
      doc.text(`Points: ${teamStats.points}`);
      doc.text(`Win Percentage: ${teamStats.winPercentage.toFixed(2)}%`);
      doc.moveDown();
      
      // Add sport-specific statistics
      if (teamStats.sport === 'FOOTBALL' && teamStats.football) {
        doc.fontSize(14).text('Football Statistics:', { underline: true });
        doc.fontSize(12);
        doc.text(`Clean Sheets: ${teamStats.football.cleanSheets || 0}`);
        doc.text(`Goals Conceded: ${teamStats.football.goalsConceded || 0}`);
        doc.text(`Shots: ${teamStats.football.shots || 0}`);
        doc.text(`Shots On Target: ${teamStats.football.shotsOnTarget || 0}`);
        doc.text(`Possession: ${teamStats.football.possession || 0}%`);
        doc.text(`Pass Accuracy: ${teamStats.football.passAccuracy || 0}%`);
        doc.text(`Tackles: ${teamStats.football.tackles || 0}`);
        doc.text(`Interceptions: ${teamStats.football.interceptions || 0}`);
        doc.text(`Yellow Cards: ${teamStats.football.yellowCards || 0}`);
        doc.text(`Red Cards: ${teamStats.football.redCards || 0}`);
      } else if (teamStats.sport === 'BASKETBALL' && teamStats.basketball) {
        doc.fontSize(14).text('Basketball Statistics:', { underline: true });
        doc.fontSize(12);
        doc.text(`Points: ${teamStats.basketball.points || 0}`);
        doc.text(`Rebounds: ${teamStats.basketball.rebounds || 0}`);
        doc.text(`Assists: ${teamStats.basketball.assists || 0}`);
        doc.text(`Steals: ${teamStats.basketball.steals || 0}`);
        doc.text(`Blocks: ${teamStats.basketball.blocks || 0}`);
        doc.text(`Field Goal %: ${teamStats.basketball.fieldGoalPercentage || 0}%`);
        doc.text(`Three Point %: ${teamStats.basketball.threePointPercentage || 0}%`);
        doc.text(`Free Throw %: ${teamStats.basketball.freeThrowPercentage || 0}%`);
      }
      
      // Finalize PDF
      doc.end();
      
      // Wait for PDF generation to complete
      return new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        
        doc.on('error', (error) => {
          reject(new ExportServiceError('Failed to generate PDF', 'PDF_EXPORT_ERROR', 500, error));
        });
      });
    } catch (error: any) {
      logger.error('Export team stats to PDF error', error);
      throw new ExportServiceError('Failed to export team statistics to PDF', 'PDF_EXPORT_ERROR', 500, error);
    }
  },
  
  // Export player comparison to PDF
  exportPlayerComparisonToPDF: async (comparison: PlayerComparison, playerName?: string): Promise<Buffer> => {
    try {
      logger.info('Exporting player comparison to PDF');
      
      // Create a PDF document
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      
      // Capture PDF data
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {});
      
      // Add title
      doc.fontSize(20).text(`Player Comparison Report${playerName ? ` - ${playerName}` : ''}`, { align: 'center' });
      doc.moveDown();
      
      // Add comparison information
      doc.fontSize(12);
      doc.text(`Versus: ${comparison.comparison.versus}`);
      doc.moveDown();
      
      // Add metrics comparison
      doc.fontSize(14).text('Metrics Comparison:', { underline: true });
      doc.fontSize(12);
      
      Object.keys(comparison.comparison.metrics).forEach(metric => {
        const metricData = comparison.comparison.metrics[metric];
        doc.text(`${metric}:`);
        doc.text(`  Player: ${metricData.player}`);
        doc.text(`  Comparison: ${metricData.comparison}`);
        doc.text(`  Difference: ${metricData.difference}`);
        doc.text(`  Percentage: ${metricData.percentage}%`);
        doc.moveDown();
      });
      
      // Finalize PDF
      doc.end();
      
      // Wait for PDF generation to complete
      return new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        
        doc.on('error', (error) => {
          reject(new ExportServiceError('Failed to generate PDF', 'PDF_EXPORT_ERROR', 500, error));
        });
      });
    } catch (error: any) {
      logger.error('Export player comparison to PDF error', error);
      throw new ExportServiceError('Failed to export player comparison to PDF', 'PDF_EXPORT_ERROR', 500, error);
    }
  },
  
  // Export team comparison to PDF
  exportTeamComparisonToPDF: async (comparison: TeamComparison, teamName?: string): Promise<Buffer> => {
    try {
      logger.info('Exporting team comparison to PDF');
      
      // Create a PDF document
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      
      // Capture PDF data
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {});
      
      // Add title
      doc.fontSize(20).text(`Team Comparison Report${teamName ? ` - ${teamName}` : ''}`, { align: 'center' });
      doc.moveDown();
      
      // Add comparison information
      doc.fontSize(12);
      doc.text(`Versus: ${comparison.comparison.versus}`);
      doc.moveDown();
      
      // Add metrics comparison
      doc.fontSize(14).text('Metrics Comparison:', { underline: true });
      doc.fontSize(12);
      
      Object.keys(comparison.comparison.metrics).forEach(metric => {
        const metricData = comparison.comparison.metrics[metric];
        doc.text(`${metric}:`);
        doc.text(`  Team: ${metricData.team}`);
        doc.text(`  Comparison: ${metricData.comparison}`);
        doc.text(`  Difference: ${metricData.difference}`);
        doc.text(`  Percentage: ${metricData.percentage}%`);
        doc.moveDown();
      });
      
      // Finalize PDF
      doc.end();
      
      // Wait for PDF generation to complete
      return new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        
        doc.on('error', (error) => {
          reject(new ExportServiceError('Failed to generate PDF', 'PDF_EXPORT_ERROR', 500, error));
        });
      });
    } catch (error: any) {
      logger.error('Export team comparison to PDF error', error);
      throw new ExportServiceError('Failed to export team comparison to PDF', 'PDF_EXPORT_ERROR', 500, error);
    }
  },
  
  // Export match statistics to PDF
  exportMatchStatsToPDF: async (matchStats: RealTimeMatchStats, matchInfo?: { homeTeamName: string; awayTeamName: string }): Promise<Buffer> => {
    try {
      logger.info('Exporting match statistics to PDF', { matchId: matchStats.matchId });
      
      // Create a PDF document
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];
      
      // Capture PDF data
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {});
      
      // Add title
      doc.fontSize(20).text('Match Statistics Report', { align: 'center' });
      if (matchInfo) {
        doc.fontSize(16).text(`${matchInfo.homeTeamName} vs ${matchInfo.awayTeamName}`, { align: 'center' });
      }
      doc.moveDown();
      
      // Add basic match information
      doc.fontSize(12);
      doc.text(`Match ID: ${matchStats.matchId}`);
      doc.moveDown();
      
      // Add team statistics
      doc.fontSize(14).text('Home Team Statistics:', { underline: true });
      doc.fontSize(12);
      doc.text(`Goals: ${matchStats.homeTeamStats.goals}`);
      doc.text(`Shots: ${matchStats.homeTeamStats.shots}`);
      doc.text(`Shots On Target: ${matchStats.homeTeamStats.shotsOnTarget}`);
      doc.text(`Possession: ${matchStats.homeTeamStats.possession}%`);
      doc.text(`Pass Accuracy: ${matchStats.homeTeamStats.passAccuracy}%`);
      doc.text(`Yellow Cards: ${matchStats.homeTeamStats.yellowCards}`);
      doc.text(`Red Cards: ${matchStats.homeTeamStats.redCards}`);
      doc.moveDown();
      
      doc.fontSize(14).text('Away Team Statistics:', { underline: true });
      doc.fontSize(12);
      doc.text(`Goals: ${matchStats.awayTeamStats.goals}`);
      doc.text(`Shots: ${matchStats.awayTeamStats.shots}`);
      doc.text(`Shots On Target: ${matchStats.awayTeamStats.shotsOnTarget}`);
      doc.text(`Possession: ${matchStats.awayTeamStats.possession}%`);
      doc.text(`Pass Accuracy: ${matchStats.awayTeamStats.passAccuracy}%`);
      doc.text(`Yellow Cards: ${matchStats.awayTeamStats.yellowCards}`);
      doc.text(`Red Cards: ${matchStats.awayTeamStats.redCards}`);
      doc.moveDown();
      
      // Add player statistics summary
      doc.fontSize(14).text('Player Statistics Summary:', { underline: true });
      doc.fontSize(12);
      
      Object.keys(matchStats.playerStats).forEach(playerId => {
        const playerStat = matchStats.playerStats[playerId];
        doc.text(`Player ${playerId}:`);
        doc.text(`  Goals: ${playerStat.goals}`);
        doc.text(`  Assists: ${playerStat.assists}`);
        doc.text(`  Shots: ${playerStat.shots}`);
        doc.text(`  Passes: ${playerStat.passes} (${playerStat.passesCompleted} completed)`);
        doc.text(`  Tackles: ${playerStat.tackles}`);
        doc.text(`  Interceptions: ${playerStat.interceptions}`);
        doc.moveDown();
      });
      
      // Finalize PDF
      doc.end();
      
      // Wait for PDF generation to complete
      return new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        
        doc.on('error', (error) => {
          reject(new ExportServiceError('Failed to generate PDF', 'PDF_EXPORT_ERROR', 500, error));
        });
      });
    } catch (error: any) {
      logger.error('Export match stats to PDF error', error);
      throw new ExportServiceError('Failed to export match statistics to PDF', 'PDF_EXPORT_ERROR', 500, error);
    }
  }
};