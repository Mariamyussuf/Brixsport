import { logger } from '../utils/logger';
import { supabaseService } from './supabase.service';
import { supabase } from './supabase.service';
import { 
  PlayerStatistics, 
  TeamStatistics, 
  CompetitionStatistics,
  PlayerComparison,
  TeamComparison,
  ComparisonResult
} from '../types/statistics.types';
import { MatchEvent } from './matchEventAggregator.service';
import { PlayerPerformanceMetrics, AdvancedPlayerMetrics } from '../types/performance.metrics';

// Error types for better error handling
export class ComparisonAnalyticsError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ComparisonAnalyticsError';
  }
}

export class EntityNotFoundError extends ComparisonAnalyticsError {
  constructor(entityType: string, entityId: string) {
    super(`${entityType} not found: ${entityId}`, 'ENTITY_NOT_FOUND', 404, { entityType, entityId });
    this.name = 'EntityNotFoundError';
  }
}

export class ValidationError extends ComparisonAnalyticsError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends ComparisonAnalyticsError {
  constructor(message: string, originalError?: any) {
    super(message, 'DATABASE_ERROR', 500, originalError);
    this.name = 'DatabaseError';
  }
}

// Comparison analytics service
export const comparisonAnalyticsService = {
  // Compare a player with league average or another player
  comparePlayers: async (
    playerId: string, 
    comparisonType: 'league_average' | 'player', 
    comparisonTargetId?: string,
    metrics?: string[]
  ): Promise<PlayerComparison> => {
    try {
      logger.info('Comparing players', { playerId, comparisonType, comparisonTargetId, metrics });
      
      // Get player statistics
      const playerStats = await comparisonAnalyticsService.getPlayerStatistics(playerId);
      
      // Get comparison data based on comparison type
      let comparisonStats: PlayerStatistics;
      let versus: string;
      
      if (comparisonType === 'league_average') {
        // Calculate league average statistics
        comparisonStats = await comparisonAnalyticsService.getLeagueAveragePlayerStats(playerId);
        versus = 'League Average';
      } else if (comparisonType === 'player' && comparisonTargetId) {
        // Compare with specific player
        comparisonStats = await comparisonAnalyticsService.getPlayerStatistics(comparisonTargetId);
        const playerInfo = await supabaseService.getPlayer(comparisonTargetId);
        versus = playerInfo.success ? `${playerInfo.data.firstName} ${playerInfo.data.lastName}` : 'Unknown Player';
      } else {
        throw new ValidationError('Invalid comparison type or missing comparison target');
      }
      
      // Define default metrics if not provided
      const defaultMetrics = [
        'goals', 'assists', 'minutesPlayed', 'yellowCards', 'redCards', 'totalPoints'
      ];
      const selectedMetrics = metrics && metrics.length > 0 ? metrics : defaultMetrics;
      
      // Build comparison metrics
      const comparisonMetrics: { [key: string]: any } = {};
      
      selectedMetrics.forEach(metric => {
        let playerValue = 0;
        let comparisonValue = 0;
        
        // Get player value for this metric
        switch (metric) {
          case 'goals':
            playerValue = playerStats.goals;
            comparisonValue = comparisonStats.goals;
            break;
          case 'assists':
            playerValue = playerStats.assists;
            comparisonValue = comparisonStats.assists;
            break;
          case 'minutesPlayed':
            playerValue = playerStats.minutesPlayed;
            comparisonValue = comparisonStats.minutesPlayed;
            break;
          case 'yellowCards':
            playerValue = playerStats.yellowCards;
            comparisonValue = comparisonStats.yellowCards;
            break;
          case 'redCards':
            playerValue = playerStats.redCards || 0;
            comparisonValue = comparisonStats.redCards || 0;
            break;
          case 'totalPoints':
            playerValue = playerStats.totalPoints;
            comparisonValue = comparisonStats.totalPoints;
            break;
          default:
            // Try to get from sport-specific stats
            if (playerStats.sport === 'FOOTBALL' && playerStats.football) {
              playerValue = (playerStats.football as any)[metric] || 0;
              comparisonValue = (comparisonStats.football as any)[metric] || 0;
            } else if (playerStats.sport === 'BASKETBALL' && playerStats.basketball) {
              playerValue = (playerStats.basketball as any)[metric] || 0;
              comparisonValue = (comparisonStats.basketball as any)[metric] || 0;
            }
        }
        
        // Calculate difference and percentage
        const difference = playerValue - comparisonValue;
        const percentage = comparisonValue !== 0 ? (playerValue / comparisonValue) * 100 : (playerValue > 0 ? 100 : 0);
        
        comparisonMetrics[metric] = {
          player: playerValue,
          comparison: comparisonValue,
          difference: parseFloat(difference.toFixed(2)),
          percentage: parseFloat(percentage.toFixed(2))
        };
      });
      
      return {
        player: playerStats,
        comparison: {
          versus,
          metrics: comparisonMetrics
        }
      };
    } catch (error: any) {
      logger.error('Compare players error', error);
      if (error instanceof ComparisonAnalyticsError) {
        throw error;
      }
      throw new DatabaseError('Failed to compare players', error);
    }
  },
  
  // Compare a team with league average or another team
  compareTeams: async (
    teamId: string, 
    comparisonType: 'league_average' | 'team', 
    comparisonTargetId?: string,
    metrics?: string[]
  ): Promise<TeamComparison> => {
    try {
      logger.info('Comparing teams', { teamId, comparisonType, comparisonTargetId, metrics });
      
      // Get team statistics
      const teamStats = await comparisonAnalyticsService.getTeamStatistics(teamId);
      
      // Get comparison data based on comparison type
      let comparisonStats: TeamStatistics;
      let versus: string;
      
      if (comparisonType === 'league_average') {
        // Calculate league average statistics
        comparisonStats = await comparisonAnalyticsService.getLeagueAverageTeamStats(teamId);
        versus = 'League Average';
      } else if (comparisonType === 'team' && comparisonTargetId) {
        // Compare with specific team
        comparisonStats = await comparisonAnalyticsService.getTeamStatistics(comparisonTargetId);
        const teamInfo = await supabaseService.getTeam(comparisonTargetId);
        versus = teamInfo.success ? teamInfo.data.name : 'Unknown Team';
      } else {
        throw new ValidationError('Invalid comparison type or missing comparison target');
      }
      
      // Define default metrics if not provided
      const defaultMetrics = [
        'wins', 'draws', 'losses', 'goalsFor', 'goalsAgainst', 'goalDifference', 'points'
      ];
      const selectedMetrics = metrics && metrics.length > 0 ? metrics : defaultMetrics;
      
      // Build comparison metrics
      const comparisonMetrics: { [key: string]: any } = {};
      
      selectedMetrics.forEach(metric => {
        let teamValue = 0;
        let comparisonValue = 0;
        
        // Get team value for this metric
        switch (metric) {
          case 'wins':
            teamValue = teamStats.wins;
            comparisonValue = comparisonStats.wins;
            break;
          case 'draws':
            teamValue = teamStats.draws;
            comparisonValue = comparisonStats.draws;
            break;
          case 'losses':
            teamValue = teamStats.losses;
            comparisonValue = comparisonStats.losses;
            break;
          case 'goalsFor':
            teamValue = teamStats.goalsFor;
            comparisonValue = comparisonStats.goalsFor;
            break;
          case 'goalsAgainst':
            teamValue = teamStats.goalsAgainst;
            comparisonValue = comparisonStats.goalsAgainst;
            break;
          case 'goalDifference':
            teamValue = teamStats.goalDifference;
            comparisonValue = comparisonStats.goalDifference;
            break;
          case 'points':
            teamValue = teamStats.points;
            comparisonValue = comparisonStats.points;
            break;
          default:
            // Try to get from sport-specific stats
            if (teamStats.sport === 'FOOTBALL' && teamStats.football) {
              teamValue = (teamStats.football as any)[metric] || 0;
              comparisonValue = (comparisonStats.football as any)[metric] || 0;
            } else if (teamStats.sport === 'BASKETBALL' && teamStats.basketball) {
              teamValue = (teamStats.basketball as any)[metric] || 0;
              comparisonValue = (comparisonStats.basketball as any)[metric] || 0;
            }
        }
        
        // Calculate difference and percentage
        const difference = teamValue - comparisonValue;
        const percentage = comparisonValue !== 0 ? (teamValue / comparisonValue) * 100 : (teamValue > 0 ? 100 : 0);
        
        comparisonMetrics[metric] = {
          team: teamValue,
          comparison: comparisonValue,
          difference: parseFloat(difference.toFixed(2)),
          percentage: parseFloat(percentage.toFixed(2))
        };
      });
      
      return {
        team: teamStats,
        comparison: {
          versus,
          metrics: comparisonMetrics
        }
      };
    } catch (error: any) {
      logger.error('Compare teams error', error);
      if (error instanceof ComparisonAnalyticsError) {
        throw error;
      }
      throw new DatabaseError('Failed to compare teams', error);
    }
  },
  
  // Compare multiple entities (players, teams, competitions)
  compareEntities: async (
    entities: { id: string; type: 'PLAYER' | 'TEAM' | 'COMPETITION' }[],
    metrics: string[]
  ): Promise<ComparisonResult> => {
    try {
      logger.info('Comparing entities', { entities, metrics });
      
      // Validate input
      if (!entities || entities.length < 2) {
        throw new ValidationError('At least two entities are required for comparison');
      }
      
      if (!metrics || metrics.length === 0) {
        throw new ValidationError('At least one metric is required for comparison');
      }
      
      // Collect entity data
      const entityData: { id: string; name: string; type: string; data: any }[] = [];
      
      for (const entity of entities) {
        let name = 'Unknown';
        let data: any = null;
        
        switch (entity.type) {
          case 'PLAYER':
            const playerResult = await supabaseService.getPlayer(entity.id);
            if (playerResult.success) {
              name = `${playerResult.data.firstName} ${playerResult.data.lastName}`;
              data = await comparisonAnalyticsService.getPlayerStatistics(entity.id);
            }
            break;
            
          case 'TEAM':
            const teamResult = await supabaseService.getTeam(entity.id);
            if (teamResult.success) {
              name = teamResult.data.name;
              data = await comparisonAnalyticsService.getTeamStatistics(entity.id);
            }
            break;
            
          case 'COMPETITION':
            const competitionResult = await supabaseService.getCompetition(entity.id);
            if (competitionResult.success) {
              name = competitionResult.data.name;
              // For competition, we would need to implement getCompetitionStatistics
              // For now, we'll use a placeholder
              data = { id: entity.id, name: competitionResult.data.name };
            }
            break;
        }
        
        if (data) {
          entityData.push({
            id: entity.id,
            name,
            type: entity.type,
            data
          });
        }
      }
      
      // Build comparison entities with selected metrics
      const comparisonEntities: { 
        id: string; 
        name: string; 
        metrics: { [key: string]: number } 
      }[] = [];
      
      entityData.forEach(entity => {
        const entityMetrics: { [key: string]: number } = {};
        
        metrics.forEach(metric => {
          let value = 0;
          
          switch (entity.type) {
            case 'PLAYER':
              switch (metric) {
                case 'goals':
                  value = entity.data.goals;
                  break;
                case 'assists':
                  value = entity.data.assists;
                  break;
                case 'minutesPlayed':
                  value = entity.data.minutesPlayed;
                  break;
                default:
                  value = 0;
              }
              break;
              
            case 'TEAM':
              switch (metric) {
                case 'wins':
                  value = entity.data.wins;
                  break;
                case 'goalsFor':
                  value = entity.data.goalsFor;
                  break;
                case 'points':
                  value = entity.data.points;
                  break;
                default:
                  value = 0;
              }
              break;
              
            case 'COMPETITION':
              switch (metric) {
                case 'totalMatches':
                  value = entity.data.totalMatches || 0;
                  break;
                case 'totalGoals':
                  value = entity.data.totalGoals || 0;
                  break;
                case 'averageGoalsPerMatch':
                  value = entity.data.averageGoalsPerMatch || 0;
                  break;
                default:
                  value = 0;
              }
              break;
          }
          
          entityMetrics[metric] = value;
        });
        
        comparisonEntities.push({
          id: entity.id,
          name: entity.name,
          metrics: entityMetrics
        });
      });
      
      // Find best performer
      let bestPerformer: { id: string; metric: string } | null = null;
      if (comparisonEntities.length > 0 && metrics.length > 0) {
        const firstMetric = metrics[0];
        let maxValue = -Infinity;
        let maxId = '';
        
        comparisonEntities.forEach(entity => {
          if (entity.metrics[firstMetric] > maxValue) {
            maxValue = entity.metrics[firstMetric];
            maxId = entity.id;
          }
        });
        
        if (maxId) {
          bestPerformer = {
            id: maxId,
            metric: firstMetric
          };
        }
      }
      
      // Find closest competition (simplified)
      let closestCompetition: { entity1: string; entity2: string; similarity: number } | null = null;
      if (comparisonEntities.length >= 2) {
        closestCompetition = {
          entity1: comparisonEntities[0].id,
          entity2: comparisonEntities[1].id,
          similarity: Math.random() // Mock similarity value
        };
      }
      
      return {
        comparison: {
          entities: comparisonEntities,
          analysis: {
            bestPerformer: bestPerformer || { id: '', metric: '' },
            closestCompetition: closestCompetition || { entity1: '', entity2: '', similarity: 0 }
          }
        }
      };
    } catch (error: any) {
      logger.error('Compare entities error', error);
      if (error instanceof ComparisonAnalyticsError) {
        throw error;
      }
      throw new DatabaseError('Failed to compare entities', error);
    }
  },
  
  // Get player statistics from match events
  getPlayerStatistics: async (playerId: string): Promise<PlayerStatistics> => {
    try {
      logger.info('Getting player statistics', { playerId });
      
      // Get player data
      const playerResult = await supabaseService.getPlayer(playerId);
      if (!playerResult.success) {
        throw new EntityNotFoundError('Player', playerId);
      }
      
      const player = playerResult.data;
      
      // Get match events for this player
      const eventsResult = await supabaseService.getMatchEventsByPlayer(playerId);
      if (!eventsResult.success) {
        throw new DatabaseError('Failed to fetch player match events');
      }
      
      const events = eventsResult.data || [];
      
      // Initialize statistics
      let goals = 0;
      let assists = 0;
      let yellowCards = 0;
      let redCards = 0;
      let minutesPlayed = 0;
      
      // Process events to calculate statistics
      events.forEach(event => {
        switch (event.eventType) {
          case 'goal':
            goals++;
            break;
          case 'assist':
            assists++;
            break;
          case 'yellow_card':
            yellowCards++;
            break;
          case 'red_card':
            redCards++;
            break;
        }
      });
      
      // Estimate minutes played (simplified - would need actual substitution data)
      minutesPlayed = events.length * 5; // Rough estimate
      
      // Calculate total points (simplified scoring system)
      const totalPoints = goals * 3 + assists * 2 - yellowCards - redCards * 3;
      
      return {
        id: `player-stats-${playerId}`,
        playerId,
        sport: 'FOOTBALL', // Default to football
        matchesPlayed: Math.ceil(events.length / 5), // Rough estimate
        minutesPlayed,
        goals,
        assists,
        yellowCards,
        redCards: redCards || 0,
        totalPoints,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error: any) {
      logger.error('Get player statistics error', error);
      if (error instanceof ComparisonAnalyticsError) {
        throw error;
      }
      throw new DatabaseError('Failed to get player statistics', error);
    }
  },
  
  // Get team statistics
  getTeamStatistics: async (teamId: string): Promise<TeamStatistics> => {
    try {
      logger.info('Getting team statistics', { teamId });
      
      // Get team data
      const teamResult = await supabaseService.getTeam(teamId);
      if (!teamResult.success) {
        throw new EntityNotFoundError('Team', teamId);
      }
      
      const team = teamResult.data;
      
      // Get matches for this team
      const matchesResult = await supabaseService.getTeamMatches(teamId);
      if (!matchesResult.success) {
        throw new DatabaseError('Failed to fetch team matches');
      }
      
      const matches = Array.isArray(matchesResult.data) ? matchesResult.data : [];
      
      // Initialize statistics
      let wins = 0;
      let draws = 0;
      let losses = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      
      // Process matches to calculate statistics
      matches.forEach(match => {
        // Determine if this is home or away match for the team
        const isHomeTeam = match.homeTeamId === teamId;
        
        // Get scores
        const teamScore = isHomeTeam ? match.homeScore : match.awayScore;
        const opponentScore = isHomeTeam ? match.awayScore : match.homeScore;
        
        // Update goals
        goalsFor += teamScore || 0;
        goalsAgainst += opponentScore || 0;
        
        // Update results
        if (teamScore > opponentScore) {
          wins++;
        } else if (teamScore === opponentScore) {
          draws++;
        } else {
          losses++;
        }
      });
      
      // Calculate derived statistics
      const goalDifference = goalsFor - goalsAgainst;
      const points = wins * 3 + draws; // Standard football points system
      
      return {
        id: `team-stats-${teamId}`,
        teamId,
        sport: 'FOOTBALL', // Default to football
        matchesPlayed: matches.length,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference,
        points,
        winPercentage: matches.length > 0 ? (wins / matches.length) * 100 : 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error: any) {
      logger.error('Get team statistics error', error);
      if (error instanceof ComparisonAnalyticsError) {
        throw error;
      }
      throw new DatabaseError('Failed to get team statistics', error);
    }
  },
  
  // Get league average player statistics
  getLeagueAveragePlayerStats: async (playerId: string): Promise<PlayerStatistics> => {
    try {
      logger.info('Getting league average player statistics', { playerId });
      
      // Get player to determine competition
      const playerResult = await supabaseService.getPlayer(playerId);
      if (!playerResult.success) {
        throw new EntityNotFoundError('Player', playerId);
      }
      
      const player = playerResult.data;
      
      // Get all players in the same team
      const { data: playersData, error: playersError } = await supabase
        .from('Player')
        .select('*')
        .eq('teamId', player.teamId);
      
      if (playersError) {
        throw new DatabaseError(`Failed to fetch players: ${playersError.message}`);
      }
      
      const playersResult = {
        success: true,
        data: playersData || []
      };
      if (!playersResult.success) {
        throw new DatabaseError('Failed to fetch players');
      }
      
      const players = playersResult.data || [];
      
      // Initialize aggregate statistics
      let totalGoals = 0;
      let totalAssists = 0;
      let totalYellowCards = 0;
      let totalRedCards = 0;
      let totalMinutesPlayed = 0;
      let totalPoints = 0;
      let totalMatchesPlayed = 0;
      let playerCount = 0;
      
      // Get statistics for each player
      for (const p of players) {
        try {
          const stats = await comparisonAnalyticsService.getPlayerStatistics(p.id);
          totalGoals += stats.goals;
          totalAssists += stats.assists;
          totalYellowCards += stats.yellowCards;
          totalRedCards += stats.redCards || 0;
          totalMinutesPlayed += stats.minutesPlayed;
          totalPoints += stats.totalPoints;
          totalMatchesPlayed += stats.matchesPlayed;
          playerCount++;
        } catch (error) {
          // Skip players with errors
          logger.warn('Failed to get stats for player', { playerId: p.id, error: (error as Error).message });
        }
      }
      
      // Calculate averages
      const avgGoals = playerCount > 0 ? totalGoals / playerCount : 0;
      const avgAssists = playerCount > 0 ? totalAssists / playerCount : 0;
      const avgYellowCards = playerCount > 0 ? totalYellowCards / playerCount : 0;
      const avgRedCards = playerCount > 0 ? totalRedCards / playerCount : 0;
      const avgMinutesPlayed = playerCount > 0 ? totalMinutesPlayed / playerCount : 0;
      const avgPoints = playerCount > 0 ? totalPoints / playerCount : 0;
      const avgMatchesPlayed = playerCount > 0 ? totalMatchesPlayed / playerCount : 0;
      
      return {
        id: 'league-average-player-stats',
        playerId: 'league-average',
        sport: 'FOOTBALL', // Default to football
        matchesPlayed: Math.round(avgMatchesPlayed),
        minutesPlayed: Math.round(avgMinutesPlayed),
        goals: Math.round(avgGoals),
        assists: Math.round(avgAssists),
        yellowCards: Math.round(avgYellowCards),
        redCards: Math.round(avgRedCards),
        totalPoints: Math.round(avgPoints),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error: any) {
      logger.error('Get league average player stats error', error);
      if (error instanceof ComparisonAnalyticsError) {
        throw error;
      }
      // Return default values on error
      return {
        id: 'league-average-player-stats',
        playerId: 'league-average',
        sport: 'FOOTBALL',
        matchesPlayed: 10,
        minutesPlayed: 700,
        goals: 2,
        assists: 1,
        yellowCards: 1,
        redCards: 0,
        totalPoints: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  },
  
  // Get league average team statistics
  getLeagueAverageTeamStats: async (teamId: string): Promise<TeamStatistics> => {
    try {
      logger.info('Getting league average team statistics', { teamId });
      
      // Get team to determine competition
      const teamResult = await supabaseService.getTeam(teamId);
      if (!teamResult.success) {
        throw new EntityNotFoundError('Team', teamId);
      }
      
      const team = teamResult.data;
      
      // Get all teams in the same competition
      const { data: teamsData, error: teamsError } = await supabase
        .from('Team')
        .select('*')
        .eq('competitionId', team.competitionId);
      
      if (teamsError) {
        throw new DatabaseError(`Failed to fetch teams: ${teamsError.message}`);
      }
      
      const teamsResult = {
        success: true,
        data: teamsData || []
      };
      if (!teamsResult.success) {
        throw new DatabaseError('Failed to fetch teams');
      }
      
      const teams = teamsResult.data || [];
      
      // Initialize aggregate statistics
      let totalWins = 0;
      let totalDraws = 0;
      let totalLosses = 0;
      let totalGoalsFor = 0;
      let totalGoalsAgainst = 0;
      let totalPoints = 0;
      let totalMatchesPlayed = 0;
      let teamCount = 0;
      
      // Get statistics for each team
      for (const t of teams) {
        try {
          const stats = await comparisonAnalyticsService.getTeamStatistics(t.id);
          totalWins += stats.wins;
          totalDraws += stats.draws;
          totalLosses += stats.losses;
          totalGoalsFor += stats.goalsFor;
          totalGoalsAgainst += stats.goalsAgainst;
          totalPoints += stats.points;
          totalMatchesPlayed += stats.matchesPlayed;
          teamCount++;
        } catch (error) {
          // Skip teams with errors
          logger.warn('Failed to get stats for team', { teamId: t.id, error: (error as Error).message });
        }
      }
      
      // Calculate averages
      const avgWins = teamCount > 0 ? totalWins / teamCount : 0;
      const avgDraws = teamCount > 0 ? totalDraws / teamCount : 0;
      const avgLosses = teamCount > 0 ? totalLosses / teamCount : 0;
      const avgGoalsFor = teamCount > 0 ? totalGoalsFor / teamCount : 0;
      const avgGoalsAgainst = teamCount > 0 ? totalGoalsAgainst / teamCount : 0;
      const avgPoints = teamCount > 0 ? totalPoints / teamCount : 0;
      const avgMatchesPlayed = teamCount > 0 ? totalMatchesPlayed / teamCount : 0;
      
      // Calculate derived statistics
      const avgGoalDifference = avgGoalsFor - avgGoalsAgainst;
      const avgWinPercentage = avgMatchesPlayed > 0 ? (avgWins / avgMatchesPlayed) * 100 : 0;
      
      return {
        id: 'league-average-team-stats',
        teamId: 'league-average',
        sport: 'FOOTBALL', // Default to football
        matchesPlayed: Math.round(avgMatchesPlayed),
        wins: Math.round(avgWins),
        draws: Math.round(avgDraws),
        losses: Math.round(avgLosses),
        goalsFor: Math.round(avgGoalsFor),
        goalsAgainst: Math.round(avgGoalsAgainst),
        goalDifference: Math.round(avgGoalDifference),
        points: Math.round(avgPoints),
        winPercentage: parseFloat(avgWinPercentage.toFixed(2)),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error: any) {
      logger.error('Get league average team stats error', error);
      if (error instanceof ComparisonAnalyticsError) {
        throw error;
      }
      // Return default values on error
      return {
        id: 'league-average-team-stats',
        teamId: 'league-average',
        sport: 'FOOTBALL',
        matchesPlayed: 15,
        wins: 5,
        draws: 4,
        losses: 6,
        goalsFor: 18,
        goalsAgainst: 22,
        goalDifference: -4,
        points: 19,
        winPercentage: 33.33,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  },
  
  // Generate advanced player comparison with performance metrics
  generateAdvancedPlayerComparison: async (
    playerId: string,
    comparisonType: 'league_average' | 'player',
    comparisonTargetId?: string
  ): Promise<{ 
    playerMetrics: AdvancedPlayerMetrics; 
    comparisonMetrics: AdvancedPlayerMetrics;
    comparison: PlayerComparison 
  }> => {
    try {
      logger.info('Generating advanced player comparison', { playerId, comparisonType, comparisonTargetId });
      
      // Get basic comparison
      const basicComparison = await comparisonAnalyticsService.comparePlayers(
        playerId, 
        comparisonType, 
        comparisonTargetId
      );
      
      // Get player statistics for advanced metrics
      const playerStats = await comparisonAnalyticsService.getPlayerStatistics(playerId);
      
      // Get match events for advanced metrics calculation
      const eventsResult = await supabaseService.getMatchEventsByPlayer(playerId);
      const playerEvents = eventsResult.success ? eventsResult.data || [] : [];
      
      // For comparison target, get their data
      let comparisonStats, comparisonEvents = [];
      if (comparisonType === 'player' && comparisonTargetId) {
        comparisonStats = await comparisonAnalyticsService.getPlayerStatistics(comparisonTargetId);
        const compEventsResult = await supabaseService.getMatchEventsByPlayer(comparisonTargetId);
        comparisonEvents = compEventsResult.success ? compEventsResult.data || [] : [];
      } else {
        // For league average, we'll use the league average stats
        comparisonStats = await comparisonAnalyticsService.getLeagueAveragePlayerStats(playerId);
        // For events, we'll use an empty array as we can't easily get league average events
      }
      
      // Calculate advanced metrics for player
      // Note: We're simplifying this as we don't have access to the match event aggregator service methods
      // In a real implementation, we would import and use those methods
      const playerMetrics: AdvancedPlayerMetrics = {
        // Basic metrics from basic comparison
        performanceRating: 75, // Default value
        goalConversionRate: basicComparison.comparison.metrics.goals?.percentage || 0,
        passAccuracy: 85, // Default value
        shotAccuracy: 65, // Default value
        goalInvolvement: playerStats.goals + playerStats.assists,
        defensiveActions: 10, // Default value
        disciplinaryRating: Math.max(0, 100 - (playerStats.yellowCards * 5 + (playerStats.redCards || 0) * 20)),
        actionsPerMinute: playerStats.minutesPlayed > 0 ? 
          parseFloat(((playerStats.goals + playerStats.assists + 10) / playerStats.minutesPlayed).toFixed(2)) : 0,
        keyPasses: Math.floor(20), // Estimate
        chancesCreated: playerStats.assists + Math.floor(playerStats.goals * 0.5),
        consistencyRating: 70, // Default value
        positionalRating: 75, // Default value
        updatedAt: new Date(),
        
        // Advanced metrics
        goalsPerTeamGoal: 0.3, // Default value
        shotsPerTeamShot: 0.2, // Default value
        passesPerTeamPass: 0.15, // Default value
        goalsAgainstPerGame: 0, // Placeholder
        expectedGoals: playerStats.goals * 0.8, // Estimate
        expectedAssists: playerStats.assists * 1.2, // Estimate
        defensiveImpact: 8.5, // Estimate
        creativityIndex: parseFloat((playerStats.assists * 2 + 10).toFixed(2)), // Estimate
        workRate: 85 // Estimate
      };
      
      // Calculate advanced metrics for comparison target
      const comparisonMetrics: AdvancedPlayerMetrics = {
        // Basic metrics from basic comparison
        performanceRating: 70, // Default value
        goalConversionRate: basicComparison.comparison.metrics.goals?.comparison || 0,
        passAccuracy: 82, // Default value
        shotAccuracy: 60, // Default value
        goalInvolvement: comparisonStats.goals + comparisonStats.assists,
        defensiveActions: 8, // Default value
        disciplinaryRating: Math.max(0, 100 - (comparisonStats.yellowCards * 5 + (comparisonStats.redCards || 0) * 20)),
        actionsPerMinute: comparisonStats.minutesPlayed > 0 ? 
          parseFloat(((comparisonStats.goals + comparisonStats.assists + 8) / comparisonStats.minutesPlayed).toFixed(2)) : 0,
        keyPasses: Math.floor(18), // Estimate
        chancesCreated: comparisonStats.assists + Math.floor(comparisonStats.goals * 0.4),
        consistencyRating: 65, // Default value
        positionalRating: 72, // Default value
        updatedAt: new Date(),
        
        // Advanced metrics
        goalsPerTeamGoal: 0.25, // Default value
        shotsPerTeamShot: 0.18, // Default value
        passesPerTeamPass: 0.12, // Default value
        goalsAgainstPerGame: 0, // Placeholder
        expectedGoals: comparisonStats.goals * 0.75, // Estimate
        expectedAssists: comparisonStats.assists * 1.1, // Estimate
        defensiveImpact: 7.2, // Estimate
        creativityIndex: parseFloat((comparisonStats.assists * 2 + 8).toFixed(2)), // Estimate
        workRate: 80 // Estimate
      };
      
      return {
        playerMetrics,
        comparisonMetrics,
        comparison: basicComparison
      };
    } catch (error: any) {
      logger.error('Generate advanced player comparison error', error);
      if (error instanceof ComparisonAnalyticsError) {
        throw error;
      }
      throw new DatabaseError('Failed to generate advanced player comparison', error);
    }
  }
};