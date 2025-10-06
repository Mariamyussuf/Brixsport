import { logger } from '../utils/logger';
import { supabaseService } from './supabase.service';
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
import { Player, Team } from '../types/team.types';

// Cache implementation
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

// Simple cache implementation for statistics
interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

class StatisticsCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL: number = 10 * 60 * 1000; // 10 minutes

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  get<T>(key: string): T | null {
    this.cleanupExpiredCache();
    const cached = this.cache.get(key);
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp <= cached.ttl) {
        return cached.value;
      } else {
        this.cache.delete(key);
      }
    }
    return null;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    this.cleanupExpiredCache();
    const cacheItem: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    this.cache.set(key, cacheItem);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const statisticsCache = new StatisticsCache();

// Error types for better error handling
export class StatisticsServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'StatisticsServiceError';
  }
}

export class EntityNotFoundError extends StatisticsServiceError {
  constructor(entityType: string, entityId: string) {
    super(`${entityType} not found: ${entityId}`, 'ENTITY_NOT_FOUND', 404, { entityType, entityId });
    this.name = 'EntityNotFoundError';
  }
}

export class ValidationError extends StatisticsServiceError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends StatisticsServiceError {
  constructor(message: string, originalError?: any) {
    super(message, 'DATABASE_ERROR', 500, originalError);
    this.name = 'DatabaseError';
  }
}

// Filter interfaces for configurable parameters
export interface PlayerStatisticsFilters {
  season?: string;
  competitionId?: string;
  startDate?: Date;
  endDate?: Date;
  includeInactive?: boolean;
}

export interface TeamStatisticsFilters {
  season?: string;
  competitionId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CompetitionStatisticsFilters {
  season?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface StandingsFilters {
  season?: string;
  sortBy?: 'points' | 'goalsFor' | 'goalDifference' | 'wins';
  sortOrder?: 'ASC' | 'DESC';
}

export interface TopPerformersFilters {
  season?: string;
  competitionId?: string;
  category?: 'goals' | 'assists' | 'points' | 'minutesPlayed';
  limit?: number;
  minAppearances?: number;
}

export const statisticsService = {
  // Player Statistics Methods
  getPlayerStatistics: async (playerId: string, filters?: PlayerStatisticsFilters): Promise<PlayerStatistics> => {
    try {
      logger.info('Fetching player statistics', { playerId, filters });
      
      // Check cache first
      const cacheKey = `player_stats_${playerId}_${JSON.stringify(filters || {})}`;
      const cached = statisticsCache.get<PlayerStatistics>(cacheKey);
      if (cached) {
        logger.info('Returning cached player statistics', { playerId });
        return cached;
      }
      
      // Get player data from database
      const playerResult = await supabaseService.getPlayer(playerId);
      if (!playerResult.success) {
        throw new EntityNotFoundError('Player', playerId);
      }
      
      const player = playerResult.data;
      
      // Build query for match events with filters
      let matchEventsQuery = supabase
        .from('MatchEvent')
        .select(`
          *,
          match:Match(startTime, status, competitionId)
        `)
        .eq('playerId', playerId);
      
      // Apply date filters if provided
      if (filters?.startDate) {
        matchEventsQuery = matchEventsQuery.gte('createdAt', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        matchEventsQuery = matchEventsQuery.lte('createdAt', filters.endDate.toISOString());
      }
      if (filters?.competitionId) {
        matchEventsQuery = matchEventsQuery.eq('match.competitionId', filters.competitionId);
      }
      
      const { data: matchEvents, error: eventsError } = await matchEventsQuery;
      if (eventsError) {
        throw new DatabaseError('Failed to fetch player match events', eventsError);
      }
      
      // Get team matches with filters
      let teamMatchesQuery = supabase
        .from('Match')
        .select('*')
        .or(`homeTeamId.eq.${player.teamId},awayTeamId.eq.${player.teamId}`);
      
      if (filters?.startDate) {
        teamMatchesQuery = teamMatchesQuery.gte('startTime', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        teamMatchesQuery = teamMatchesQuery.lte('startTime', filters.endDate.toISOString());
      }
      if (filters?.competitionId) {
        teamMatchesQuery = teamMatchesQuery.eq('competitionId', filters.competitionId);
      }
      
      const { data: teamMatches, error: matchesError } = await teamMatchesQuery;
      if (matchesError) {
        throw new DatabaseError('Failed to fetch team matches', matchesError);
      }
      
      // Calculate common statistics
      let goals = 0;
      let assists = 0;
      let yellowCards = 0;
      let redCards = 0;
      let minutesPlayed = 0;
      
      matchEvents?.forEach((event: any) => {
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
      
      // Calculate minutes played (simplified)
      const completedMatches = teamMatches?.filter((match: any) => match.status === 'COMPLETED') || [];
      minutesPlayed = completedMatches.length * 90; // Assuming 90 minutes per match
      
      // Create base player statistics
      const playerStats: PlayerStatistics = {
        id: `player-stats-${playerId}`,
        playerId,
        sport: player.sport || 'FOOTBALL', // Default to FOOTBALL if not specified
        matchesPlayed: completedMatches.length,
        minutesPlayed,
        goals,
        assists,
        yellowCards,
        redCards,
        totalPoints: goals * 3 + assists, // Simplified point calculation
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add sport-specific statistics
      switch (playerStats.sport) {
        case 'FOOTBALL':
          playerStats.football = {
            goals,
            assists,
            cleanSheets: 0, // Would need to calculate based on matches where team didn't concede
            goalsConceded: 0, // Only for goalkeepers/defenders
            saves: 0, // Only for goalkeepers
            passesCompleted: 0,
            passAccuracy: 0,
            tackles: 0,
            interceptions: 0,
            foulsCommitted: 0,
            foulsSuffered: 0
          };
          break;
          
        case 'BASKETBALL':
          playerStats.basketball = {
            points: goals * 2, // Simplified
            rebounds: 0,
            assists,
            steals: 0,
            blocks: 0,
            fieldGoalsMade: 0,
            fieldGoalsAttempted: 0,
            fieldGoalPercentage: 0,
            threePointersMade: 0,
            threePointersAttempted: 0,
            threePointPercentage: 0,
            freeThrowsMade: 0,
            freeThrowsAttempted: 0,
            freeThrowPercentage: 0,
            turnovers: 0,
            personalFouls: yellowCards
          };
          break;
          
        case 'TRACK':
          playerStats.track = {
            eventsParticipated: completedMatches.length,
            firstPlaceFinishes: 0,
            secondPlaceFinishes: 0,
            thirdPlaceFinishes: 0,
            personalBests: []
          };
          break;
      }
      
      // Cache the result for 10 minutes
      statisticsCache.set(cacheKey, playerStats, 10 * 60 * 1000);
      
      return playerStats;
    } catch (error: any) {
      logger.error('Get player statistics error', error);
      if (error instanceof StatisticsServiceError) {
        throw error;
      }
      throw new DatabaseError('Failed to get player statistics', error);
    }
  },
  
  getPlayerTrends: async (playerId: string, period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEASON' = 'MONTHLY', limit: number = 12, filters?: PlayerStatisticsFilters): Promise<PerformanceTrend[]> => {
    try {
      logger.info('Fetching player performance trends', { playerId, period, limit, filters });
      
      // Check cache first
      const cacheKey = `player_trends_${playerId}_${period}_${limit}_${JSON.stringify(filters || {})}`;
      const cached = statisticsCache.get<PerformanceTrend[]>(cacheKey);
      if (cached) {
        logger.info('Returning cached player trends', { playerId });
        return cached;
      }
      
      // Get player data from database
      const playerResult = await supabaseService.getPlayer(playerId);
      if (!playerResult.success) {
        throw new EntityNotFoundError('Player', playerId);
      }
      
      // Calculate trends based on actual match data
      const trends: PerformanceTrend[] = [];
      const now = new Date();
      
      for (let i = 0; i < Math.min(limit, 12); i++) {
        // Calculate date range for this period
        const startDate = new Date(now);
        const endDate = new Date(now);
        
        switch (period) {
          case 'DAILY':
            startDate.setDate(now.getDate() - i);
            endDate.setDate(now.getDate() - i);
            break;
          case 'WEEKLY':
            startDate.setDate(now.getDate() - (i * 7));
            endDate.setDate(now.getDate() - (i * 7) + 6);
            break;
          case 'MONTHLY':
            startDate.setMonth(now.getMonth() - i);
            startDate.setDate(1);
            endDate.setMonth(now.getMonth() - i + 1);
            endDate.setDate(0);
            break;
          case 'SEASON':
            startDate.setMonth(now.getMonth() - (i * 3));
            endDate.setMonth(now.getMonth() - (i * 3) + 3);
            break;
        }
        
        // Query actual match events for this period
        let eventsQuery = supabase
          .from('MatchEvent')
          .select('*')
          .eq('playerId', playerId)
          .gte('createdAt', startDate.toISOString())
          .lte('createdAt', endDate.toISOString());
        
        if (filters?.competitionId) {
          eventsQuery = eventsQuery.eq('match.competitionId', filters.competitionId);
        }
        
        const { data: periodEvents, error: eventsError } = await eventsQuery;
        if (eventsError) {
          logger.warn('Error fetching events for period', { period: i, error: eventsError });
          continue;
        }
        
        // Calculate metrics from actual data
        let goals = 0;
        let assists = 0;
        periodEvents?.forEach((event: any) => {
          if (event.eventType === 'goal') goals++;
          if (event.eventType === 'assist') assists++;
        });
        
        const formRating = Math.floor(Math.random() * 40) + 60; // Keep some randomization for now
        const performanceScore = Math.floor(Math.random() * 30) + 70;
        const improvementRate = (Math.random() * 20 - 10);
        const consistencyRating = Math.floor(Math.random() * 40) + 60;
        const ranking = Math.floor(Math.random() * 10) + 1;
        const rankingChange = Math.floor(Math.random() * 5) - 2;
        const comparisonWithAverage = (Math.random() * 40 - 20);
        
        trends.push({
          id: `trend-${playerId}-${i}`,
          entityId: playerId,
          entityType: 'PLAYER',
          period,
          formRating,
          performanceScore,
          improvementRate,
          consistencyRating,
          ranking,
          rankingChange,
          comparisonWithAverage,
          sportMetrics: {
            goals,
            assists
          },
          startDate,
          endDate,
          createdAt: new Date()
        });
      }
      
      // Cache the result for 15 minutes
      statisticsCache.set(cacheKey, trends, 15 * 60 * 1000);
      
      return trends;
    } catch (error: any) {
      logger.error('Get player trends error', error);
      if (error instanceof StatisticsServiceError) {
        throw error;
      }
      throw new DatabaseError('Failed to get player trends', error);
    }
  },
  
  comparePlayers: async (playerId: string, compareWith: string, metrics?: string[], filters?: PlayerStatisticsFilters): Promise<PlayerComparison> => {
    try {
      logger.info('Comparing player with others', { playerId, compareWith, metrics, filters });
      
      // Get player statistics with filters
      const playerStats = await statisticsService.getPlayerStatistics(playerId, filters);
      
      // Get player data for comparison context
      const playerResult = await supabaseService.getPlayer(playerId);
      if (!playerResult.success) {
        throw new EntityNotFoundError('Player', playerId);
      }
      
      const player = playerResult.data;
      
      // Get comparison data based on compareWith parameter
      let comparisonValue: number;
      let comparisonName: string;
      
      if (compareWith === 'league_average') {
        // Calculate league average from team competition
        if (filters?.competitionId) {
          const { data: competitionPlayers, error } = await supabase
            .from('Player')
            .select('id')
            .eq('team.competitionId', filters.competitionId);
          
          if (!error && competitionPlayers && competitionPlayers.length > 0) {
            // Calculate average stats from competition players
            let totalGoals = 0;
            let totalAssists = 0;
            let playerCount = 0;
            
            for (const compPlayer of competitionPlayers.slice(0, 20)) { // Limit to 20 for performance
              try {
                const stats = await statisticsService.getPlayerStatistics(compPlayer.id, filters);
                totalGoals += stats.goals;
                totalAssists += stats.assists;
                playerCount++;
              } catch (error) {
                // Skip players with errors
              }
            }
            
            comparisonValue = playerCount > 0 ? ((totalGoals + totalAssists) / playerCount) : 1.5;
          } else {
            comparisonValue = 1.5; // Default fallback
          }
        } else {
          comparisonValue = 1.5; // Mock league average
        }
        comparisonName = 'League Average';
      } else if (compareWith.startsWith('player_')) {
        // Compare with specific player
        const otherPlayerId = compareWith.replace('player_', '');
        try {
          const otherPlayerStats = await statisticsService.getPlayerStatistics(otherPlayerId, filters);
          comparisonValue = otherPlayerStats.goals + otherPlayerStats.assists * 0.5; // Weighted comparison
          comparisonName = `Player ${otherPlayerId}`;
        } catch (error) {
          comparisonValue = 2.1; // Fallback
          comparisonName = 'Other Player';
        }
      } else {
        // Compare with team average or other category
        comparisonValue = 2.1; // Mock value
        comparisonName = compareWith.replace('_', ' ').toUpperCase();
      }
      
      // Define default metrics if not provided
      const defaultMetrics = ['goals', 'assists', 'minutesPlayed'];
      const selectedMetrics = metrics && metrics.length > 0 ? metrics : defaultMetrics;
      
      // Build comparison object
      const comparisonMetrics: { [key: string]: any } = {};
      
      selectedMetrics.forEach(metric => {
        let playerValue = 0;
        
        // Get player value for this metric
        switch (metric) {
          case 'goals':
            playerValue = playerStats.goals;
            break;
          case 'assists':
            playerValue = playerStats.assists;
            break;
          case 'minutesPlayed':
            playerValue = playerStats.minutesPlayed;
            break;
          case 'yellowCards':
            playerValue = playerStats.yellowCards;
            break;
          case 'redCards':
            playerValue = playerStats.redCards;
            break;
          case 'totalPoints':
            playerValue = playerStats.totalPoints;
            break;
          default:
            playerValue = 0;
        }
        
        // For league average, calculate based on metric type
        let adjustedComparisonValue = comparisonValue;
        if (compareWith === 'league_average') {
          switch (metric) {
            case 'goals':
              adjustedComparisonValue = comparisonValue * 0.8; // Goals are rarer
              break;
            case 'assists':
              adjustedComparisonValue = comparisonValue * 0.6; // Assists are less common
              break;
            case 'minutesPlayed':
              adjustedComparisonValue = playerStats.minutesPlayed * 0.9; // Similar playing time
              break;
            default:
              adjustedComparisonValue = comparisonValue;
          }
        }
        
        comparisonMetrics[metric] = {
          player: playerValue,
          comparison: adjustedComparisonValue,
          difference: playerValue - adjustedComparisonValue,
          percentage: adjustedComparisonValue > 0 ? (playerValue / adjustedComparisonValue) * 100 : 0
        };
      });
      
      return {
        player: playerStats,
        comparison: {
          versus: comparisonName,
          metrics: comparisonMetrics
        }
      };
    } catch (error: any) {
      logger.error('Compare players error', error);
      if (error instanceof StatisticsServiceError) {
        throw error;
      }
      throw new DatabaseError('Failed to compare players', error);
    }
  },
  
  // Team Statistics Methods
  getTeamStatistics: async (teamId: string, filters?: TeamStatisticsFilters): Promise<TeamStatistics> => {
    try {
      logger.info('Fetching team statistics', { teamId, filters });
      
      // Check cache first
      const cacheKey = `team_stats_${teamId}_${JSON.stringify(filters || {})}`;
      const cached = statisticsCache.get<TeamStatistics>(cacheKey);
      if (cached) {
        logger.info('Returning cached team statistics', { teamId });
        return cached;
      }
      
      // Get team data from database
      const teamResult = await supabaseService.getTeam(teamId);
      if (!teamResult.success) {
        throw new EntityNotFoundError('Team', teamId);
      }
      
      const team = teamResult.data;
      
      // Get team matches with filters
      let matchesQuery = supabase
        .from('Match')
        .select('*')
        .or(`homeTeamId.eq.${teamId},awayTeamId.eq.${teamId}`);
      
      // Apply date filters if provided
      if (filters?.startDate) {
        matchesQuery = matchesQuery.gte('startTime', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        matchesQuery = matchesQuery.lte('startTime', filters.endDate.toISOString());
      }
      if (filters?.competitionId) {
        matchesQuery = matchesQuery.eq('competitionId', filters.competitionId);
      }
      
      const { data: teamMatches, error: matchesError } = await matchesQuery;
      if (matchesError) {
        throw new DatabaseError('Failed to fetch team matches', matchesError);
      }
      
      // Calculate performance metrics from actual match data
      let wins = 0;
      let losses = 0;
      let draws = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      let yellowCards = 0;
      let redCards = 0;
      
      const completedMatches = teamMatches?.filter((match: any) => match.status === 'COMPLETED') || [];
      
      completedMatches.forEach((match: any) => {
        if (match.homeTeamId === teamId) {
          goalsFor += match.homeScore || 0;
          goalsAgainst += match.awayScore || 0;
          
          if (match.homeScore > match.awayScore) {
            wins++;
          } else if (match.homeScore < match.awayScore) {
            losses++;
          } else {
            draws++;
          }
        } else {
          goalsFor += match.awayScore || 0;
          goalsAgainst += match.homeScore || 0;
          
          if (match.awayScore > match.homeScore) {
            wins++;
          } else if (match.awayScore < match.homeScore) {
            losses++;
          } else {
            draws++;
          }
        }
      });
      
      // Get disciplinary cards from match events
      for (const match of completedMatches) {
        const { data: matchEvents, error: eventsError } = await supabase
          .from('MatchEvent')
          .select('*')
          .eq('matchId', match.id)
          .eq('teamId', teamId);
        
        if (!eventsError && matchEvents) {
          matchEvents.forEach((event: any) => {
            if (event.eventType === 'yellow_card') yellowCards++;
            if (event.eventType === 'red_card') redCards++;
          });
        }
      }
      
      // Create base team statistics
      const teamStats: TeamStatistics = {
        id: `team-stats-${teamId}`,
        teamId,
        sport: team.sport || 'FOOTBALL',
        matchesPlayed: completedMatches.length,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: wins * 3 + draws, // Standard football points system
        winPercentage: completedMatches.length > 0 ? 
          (wins / completedMatches.length) * 100 : 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add sport-specific statistics
      switch (teamStats.sport) {
        case 'FOOTBALL':
          teamStats.football = {
            cleanSheets: completedMatches.filter((match: any) => {
              if (match.homeTeamId === teamId) {
                return match.awayScore === 0;
              } else {
                return match.homeScore === 0;
              }
            }).length,
            goalsConceded: goalsAgainst,
            shots: 0, // Would need additional match event data
            shotsOnTarget: 0,
            possession: 0,
            passesCompleted: 0,
            passAccuracy: 0,
            tackles: 0,
            interceptions: 0,
            foulsCommitted: 0,
            yellowCards: yellowCards,
            redCards: redCards
          };
          break;
          
        case 'BASKETBALL':
          teamStats.basketball = {
            points: goalsFor,
            rebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            fieldGoalsMade: 0,
            fieldGoalsAttempted: 0,
            fieldGoalPercentage: 0,
            threePointersMade: 0,
            threePointersAttempted: 0,
            threePointPercentage: 0,
            freeThrowsMade: 0,
            freeThrowsAttempted: 0,
            freeThrowPercentage: 0,
            turnovers: 0,
            personalFouls: yellowCards + redCards
          };
          break;
          
        case 'TRACK':
          teamStats.track = {
            eventsParticipated: completedMatches.length,
            goldMedals: 0,
            silverMedals: 0,
            bronzeMedals: 0,
            totalMedals: 0,
            bestPerformances: []
          };
          break;
      }
      
      // Cache the result for 10 minutes
      statisticsCache.set(cacheKey, teamStats, 10 * 60 * 1000);
      
      return teamStats;
    } catch (error: any) {
      logger.error('Get team statistics error', error);
      if (error instanceof StatisticsServiceError) {
        throw error;
      }
      throw new DatabaseError('Failed to get team statistics', error);
    }
  },
  
  getTeamTrends: async (teamId: string, period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'SEASON' = 'MONTHLY', limit: number = 12, filters?: TeamStatisticsFilters): Promise<PerformanceTrend[]> => {
    try {
      logger.info('Fetching team performance trends', { teamId, period, limit, filters });
      
      // Check cache first
      const cacheKey = `team_trends_${teamId}_${period}_${limit}_${JSON.stringify(filters || {})}`;
      const cached = statisticsCache.get<PerformanceTrend[]>(cacheKey);
      if (cached) {
        logger.info('Returning cached team trends', { teamId });
        return cached;
      }
      
      // Get team data from database
      const teamResult = await supabaseService.getTeam(teamId);
      if (!teamResult.success) {
        throw new EntityNotFoundError('Team', teamId);
      }
      
      // Calculate trends based on actual match data
      const trends: PerformanceTrend[] = [];
      const now = new Date();
      
      for (let i = 0; i < Math.min(limit, 12); i++) {
        // Calculate date range for this period
        const startDate = new Date(now);
        const endDate = new Date(now);
        
        switch (period) {
          case 'DAILY':
            startDate.setDate(now.getDate() - i);
            endDate.setDate(now.getDate() - i);
            break;
          case 'WEEKLY':
            startDate.setDate(now.getDate() - (i * 7));
            endDate.setDate(now.getDate() - (i * 7) + 6);
            break;
          case 'MONTHLY':
            startDate.setMonth(now.getMonth() - i);
            startDate.setDate(1);
            endDate.setMonth(now.getMonth() - i + 1);
            endDate.setDate(0);
            break;
          case 'SEASON':
            startDate.setMonth(now.getMonth() - (i * 3));
            endDate.setMonth(now.getMonth() - (i * 3) + 3);
            break;
        }
        
        // Query actual matches for this period
        let matchesQuery = supabase
          .from('Match')
          .select('*')
          .or(`homeTeamId.eq.${teamId},awayTeamId.eq.${teamId}`)
          .gte('startTime', startDate.toISOString())
          .lte('startTime', endDate.toISOString())
          .eq('status', 'COMPLETED');
        
        if (filters?.competitionId) {
          matchesQuery = matchesQuery.eq('competitionId', filters.competitionId);
        }
        
        const { data: periodMatches, error: matchesError } = await matchesQuery;
        if (matchesError) {
          logger.warn('Error fetching matches for period', { period: i, error: matchesError });
          continue;
        }
        
        // Calculate metrics from actual match data
        let wins = 0;
        let goals = 0;
        periodMatches?.forEach((match: any) => {
          if (match.homeTeamId === teamId) {
            if (match.homeScore > match.awayScore) wins++;
            goals += match.homeScore || 0;
          } else {
            if (match.awayScore > match.homeScore) wins++;
            goals += match.awayScore || 0;
          }
        });
        
        const formRating = Math.floor(Math.random() * 40) + 60; // Keep some randomization for now
        const performanceScore = Math.floor(Math.random() * 30) + 70;
        const improvementRate = (Math.random() * 20 - 10);
        const consistencyRating = Math.floor(Math.random() * 40) + 60;
        const ranking = Math.floor(Math.random() * 10) + 1;
        const rankingChange = Math.floor(Math.random() * 5) - 2;
        const comparisonWithAverage = (Math.random() * 40 - 20);
        
        trends.push({
          id: `trend-${teamId}-${i}`,
          entityId: teamId,
          entityType: 'TEAM',
          period,
          formRating,
          performanceScore,
          improvementRate,
          consistencyRating,
          ranking,
          rankingChange,
          comparisonWithAverage,
          sportMetrics: {
            wins,
            goals
          },
          startDate,
          endDate,
          createdAt: new Date()
        });
      }
      
      // Cache the result for 15 minutes
      statisticsCache.set(cacheKey, trends, 15 * 60 * 1000);
      
      return trends;
    } catch (error: any) {
      logger.error('Get team trends error', error);
      if (error instanceof StatisticsServiceError) {
        throw error;
      }
      throw new DatabaseError('Failed to get team trends', error);
    }
  },
  
  compareTeams: async (teamId: string, compareWith: string, metrics?: string[], filters?: TeamStatisticsFilters): Promise<TeamComparison> => {
    try {
      logger.info('Comparing team with others', { teamId, compareWith, metrics, filters });
      
      // Get team statistics with filters
      const teamStats = await statisticsService.getTeamStatistics(teamId, filters);
      
      // Get team data for comparison context
      const teamResult = await supabaseService.getTeam(teamId);
      if (!teamResult.success) {
        throw new EntityNotFoundError('Team', teamId);
      }
      
      const team = teamResult.data;
      
      // Get comparison data based on compareWith parameter
      let comparisonValue: number;
      let comparisonName: string;
      
      if (compareWith === 'league_average') {
        // Calculate league average from team competition
        if (filters?.competitionId) {
          const { data: competitionTeams, error } = await supabase
            .from('Team')
            .select('id')
            .eq('competitionId', filters.competitionId);
          
          if (!error && competitionTeams && competitionTeams.length > 0) {
            // Calculate average stats from competition teams
            let totalWins = 0;
            let totalGoals = 0;
            let totalPoints = 0;
            let teamCount = 0;
            
            for (const compTeam of competitionTeams.slice(0, 20)) { // Limit to 20 for performance
              try {
                const stats = await statisticsService.getTeamStatistics(compTeam.id, filters);
                totalWins += stats.wins;
                totalGoals += stats.goalsFor;
                totalPoints += stats.points;
                teamCount++;
              } catch (error) {
                // Skip teams with errors
              }
            }
            
            // Use the appropriate metric for comparison
            if (metrics?.includes('wins')) {
              comparisonValue = teamCount > 0 ? totalWins / teamCount : 2.5;
            } else if (metrics?.includes('goalsFor')) {
              comparisonValue = teamCount > 0 ? totalGoals / teamCount : 15;
            } else {
              comparisonValue = teamCount > 0 ? totalPoints / teamCount : 12;
            }
          } else {
            comparisonValue = 2.5; // Default fallback
          }
        } else {
          comparisonValue = 2.5; // Mock league average
        }
        comparisonName = 'League Average';
      } else if (compareWith.startsWith('team_')) {
        // Compare with specific team
        const otherTeamId = compareWith.replace('team_', '');
        try {
          const otherTeamStats = await statisticsService.getTeamStatistics(otherTeamId, filters);
          comparisonValue = otherTeamStats.wins + otherTeamStats.goalsFor * 0.1; // Weighted comparison
          comparisonName = `Team ${otherTeamId}`;
        } catch (error) {
          comparisonValue = 3.1; // Fallback
          comparisonName = 'Other Team';
        }
      } else {
        // Compare with league average or other category
        comparisonValue = 3.1; // Mock value
        comparisonName = compareWith.replace('_', ' ').toUpperCase();
      }
      
      // Define default metrics if not provided
      const defaultMetrics = ['wins', 'goalsFor', 'points'];
      const selectedMetrics = metrics && metrics.length > 0 ? metrics : defaultMetrics;
      
      // Build comparison object
      const comparisonMetrics: { [key: string]: any } = {};
      
      selectedMetrics.forEach(metric => {
        let teamValue = 0;
        
        // Get team value for this metric
        switch (metric) {
          case 'wins':
            teamValue = teamStats.wins;
            break;
          case 'goalsFor':
            teamValue = teamStats.goalsFor;
            break;
          case 'points':
            teamValue = teamStats.points;
            break;
          case 'goalsAgainst':
            teamValue = teamStats.goalsAgainst;
            break;
          case 'goalDifference':
            teamValue = teamStats.goalDifference;
            break;
          default:
            teamValue = 0;
        }
        
        comparisonMetrics[metric] = {
          team: teamValue,
          comparison: comparisonValue,
          difference: teamValue - comparisonValue,
          percentage: comparisonValue > 0 ? (teamValue / comparisonValue) * 100 : 0
        };
      });
      
      return {
        team: teamStats,
        comparison: {
          versus: comparisonName,
          metrics: comparisonMetrics
        }
      };
    } catch (error: any) {
      logger.error('Compare teams error', error);
      if (error instanceof StatisticsServiceError) {
        throw error;
      }
      throw new DatabaseError('Failed to compare teams', error);
    }
  },
  
  // Competition Statistics Methods
  getCompetitionStatistics: async (competitionId: string, filters?: CompetitionStatisticsFilters): Promise<CompetitionStatistics> => {
    try {
      logger.info('Fetching competition statistics', { competitionId, filters });
      
      // Check cache first
      const cacheKey = `competition_stats_${competitionId}_${JSON.stringify(filters || {})}`;
      const cached = statisticsCache.get<CompetitionStatistics>(cacheKey);
      if (cached) {
        logger.info('Returning cached competition statistics', { competitionId });
        return cached;
      }
      
      // Get competition teams from database
      const { data: competitionTeams, error: teamsError } = await supabase
        .from('Team')
        .select('*')
        .eq('competitionId', competitionId);
      
      if (teamsError) {
        throw new DatabaseError('Failed to fetch competition teams', teamsError);
      }
      
      // Get performance data for all teams
      const teamPerformances: TeamStatistics[] = [];
      const teamLimit = competitionTeams?.slice(0, 20) || []; // Limit for performance
      
      for (const team of teamLimit) {
        try {
          const performance = await statisticsService.getTeamStatistics(team.id, {
            competitionId,
            startDate: filters?.startDate,
            endDate: filters?.endDate,
            season: filters?.season
          });
          teamPerformances.push(performance);
        } catch (error) {
          logger.warn('Error fetching stats for team', { teamId: team.id, error });
        }
      }
      
      // Calculate competition statistics
      const totalMatches = teamPerformances.reduce((sum, team) => 
        sum + team.matchesPlayed, 0
      );
      
      const totalGoals = teamPerformances.reduce((sum, team) => 
        sum + team.goalsFor, 0
      );
      
      const totalYellowCards = teamPerformances.reduce((sum, team) => 
        sum + (team.football?.yellowCards || 0), 0
      );
      
      const totalRedCards = teamPerformances.reduce((sum, team) => 
        sum + (team.football?.redCards || 0), 0
      );
      
      const totalTeams = teamPerformances.length;
      
      // Create base competition statistics
      const competitionStats: CompetitionStatistics = {
        id: `competition-stats-${competitionId}`,
        competitionId,
        sport: 'FOOTBALL', // Default sport
        totalMatches,
        totalTeams,
        totalPlayers: totalTeams * 15, // Assume 15 players per team
        totalGoals,
        averageGoalsPerMatch: totalMatches > 0 ? totalGoals / totalMatches : 0,
        totalYellowCards,
        totalRedCards,
        monthlyTrends: [], // Would be populated with actual data
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add sport-specific statistics
      competitionStats.football = {
        totalCleanSheets: teamPerformances.reduce((sum, team) => 
          sum + (team.football?.cleanSheets || 0), 0
        ),
        totalGoalsConceded: teamPerformances.reduce((sum, team) => 
          sum + team.goalsAgainst, 0
        ),
        averagePossession: 0,
        totalShots: 0,
        totalShotsOnTarget: 0,
        passAccuracy: 0
      };
      
      // Generate monthly trends from actual data
      const now = new Date();
      for (let i = 0; i < 6; i++) { // Last 6 months
        const monthDate = new Date(now);
        monthDate.setMonth(now.getMonth() - i);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        
        // Get matches for this month
        let monthMatches = 0;
        let monthGoals = 0;
        let monthCards = 0;
        
        for (const team of teamLimit) {
          const { data: teamMatches, error } = await supabase
            .from('Match')
            .select('*, homeScore, awayScore')
            .or(`homeTeamId.eq.${team.id},awayTeamId.eq.${team.id}`)
            .gte('startTime', monthStart.toISOString())
            .lte('startTime', monthEnd.toISOString())
            .eq('status', 'COMPLETED');
          
          if (!error && teamMatches) {
            monthMatches += teamMatches.length;
            teamMatches.forEach((match: any) => {
              if (match.homeTeamId === team.id) {
                monthGoals += match.homeScore || 0;
              } else {
                monthGoals += match.awayScore || 0;
              }
            });
          }
        }
        
        competitionStats.monthlyTrends.push({
          month: monthDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
          matches: monthMatches,
          goals: monthGoals,
          cards: Math.floor(monthCards / 2) // Rough estimate
        });
      }
      
      // Cache the result for 10 minutes
      statisticsCache.set(cacheKey, competitionStats, 10 * 60 * 1000);
      
      return competitionStats;
    } catch (error: any) {
      logger.error('Get competition statistics error', error);
      if (error instanceof StatisticsServiceError) {
        throw error;
      }
      throw new DatabaseError('Failed to get competition statistics', error);
    }
  },
  
  getCompetitionStandings: async (competitionId: string, sortBy: string = 'points', sortOrder: 'ASC' | 'DESC' = 'DESC'): Promise<Standing[]> => {
    try {
      logger.info('Fetching competition standings', { competitionId, sortBy, sortOrder });
      
      // Get teams for this competition
      const { data: competitionTeams, error: teamsError } = await supabase
        .from('Team')
        .select('id, name, logoUrl')
        .eq('competitionId', competitionId);
      
      if (teamsError) {
        throw new DatabaseError('Failed to fetch competition teams', teamsError);
      }
      
      if (!competitionTeams || competitionTeams.length === 0) {
        return []; // No teams in competition
      }
      
      // Get performance data for all teams
      const teamPerformances: any[] = [];
      for (const team of competitionTeams) {
        try {
          const performance = await statisticsService.getTeamStatistics(team.id);
          teamPerformances.push({
            team: {
              id: team.id,
              name: team.name,
              logoUrl: team.logoUrl
            },
            performance
          });
        } catch (error) {
          logger.warn('Error fetching stats for team', { teamId: team.id, error });
          // Add team with zero stats if stats fetch fails
          teamPerformances.push({
            team: {
              id: team.id,
              name: team.name,
              logoUrl: team.logoUrl
            },
            performance: {
              wins: 0,
              draws: 0,
              losses: 0,
              goalsFor: 0,
              goalsAgainst: 0,
              goalDifference: 0,
              points: 0,
              matchesPlayed: 0
            }
          });
        }
      }
      
      // Sort teams based on the specified criteria
      teamPerformances.sort((a: any, b: any) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'points':
            comparison = a.performance.points - b.performance.points;
            break;
          case 'goalsFor':
            comparison = a.performance.goalsFor - b.performance.goalsFor;
            break;
          case 'goalDifference':
            comparison = a.performance.goalDifference - b.performance.goalDifference;
            break;
          case 'wins':
            comparison = a.performance.wins - b.performance.wins;
            break;
          default:
            comparison = a.performance.points - b.performance.points;
        }
        
        return sortOrder === 'DESC' ? -comparison : comparison;
      });
      
      // Generate standings
      const standings: Standing[] = teamPerformances.map((teamData: any, index: number) => ({
        team: teamData.team,
        position: index + 1,
        played: teamData.performance.matchesPlayed,
        won: teamData.performance.wins,
        drawn: teamData.performance.draws,
        lost: teamData.performance.losses,
        goalsFor: teamData.performance.goalsFor,
        goalsAgainst: teamData.performance.goalsAgainst,
        goalDifference: teamData.performance.goalDifference,
        points: teamData.performance.points
      }));
      
      return standings;
    } catch (error: any) {
      logger.error('Get competition standings error', error);
      throw error;
    }
  },
  
  getTopPerformers: async (competitionId: string, category: string, limit: number = 10): Promise<TopPerformer[]> => {
    try {
      logger.info('Fetching top performers', { competitionId, category, limit });
      
      // Get teams for this competition
      const { data: competitionTeams, error: teamsError } = await supabase
        .from('Team')
        .select('id, name, logoUrl')
        .eq('competitionId', competitionId);
      
      if (teamsError) {
        throw new DatabaseError('Failed to fetch competition teams', teamsError);
      }
      
      if (!competitionTeams || competitionTeams.length === 0) {
        return []; // No teams in competition
      }
      
      // Get all players from these teams
      const competitionPlayers: any[] = [];
      for (const team of competitionTeams) {
        const { data: teamPlayers, error: playersError } = await supabase
          .from('Player')
          .select('id, firstName, lastName, displayName, profilePictureUrl, teamId')
          .eq('teamId', team.id);
        
        if (!playersError && teamPlayers) {
          competitionPlayers.push(...teamPlayers);
        }
      }
      
      // Get player statistics for all players
      const playerStats: any[] = [];
      for (const player of competitionPlayers) {
        try {
          const stats = await statisticsService.getPlayerStatistics(player.id);
          playerStats.push({
            player: {
              id: player.id,
              firstName: player.firstName,
              lastName: player.lastName,
              displayName: player.displayName,
              profilePictureUrl: player.profilePictureUrl
            },
            team: {
              id: player.teamId || '',
              name: competitionTeams.find((t: any) => t.id === player.teamId)?.name || 'Unknown Team',
              logoUrl: competitionTeams.find((t: any) => t.id === player.teamId)?.logoUrl
            },
            stats
          });
        } catch (error) {
          // Skip players with errors
          logger.warn('Error fetching stats for player', { playerId: player.id, error });
        }
      }
      
      // Sort players based on the specified category
      playerStats.sort((a: any, b: any) => {
        let aValue = 0;
        let bValue = 0;
        
        switch (category) {
          case 'goals':
            aValue = a.stats.goals;
            bValue = b.stats.goals;
            break;
          case 'assists':
            aValue = a.stats.assists;
            bValue = b.stats.assists;
            break;
          case 'points':
            aValue = a.stats.totalPoints;
            bValue = b.stats.totalPoints;
            break;
          default:
            aValue = a.stats.goals;
            bValue = b.stats.goals;
        }
        
        return bValue - aValue; // Descending order
      });
      
      // Take top performers
      const topPerformers: TopPerformer[] = playerStats
        .slice(0, Math.min(limit, playerStats.length))
        .map((playerData: any, index: number) => ({
          player: playerData.player,
          team: playerData.team,
          value: (() => {
            switch (category) {
              case 'goals': return playerData.stats.goals;
              case 'assists': return playerData.stats.assists;
              case 'points': return playerData.stats.totalPoints;
              default: return playerData.stats.goals;
            }
          })()
        }));
      
      return topPerformers;
    } catch (error: any) {
      logger.error('Get top performers error', error);
      throw error;
    }
  },
  
  // Analytics and Reports
  getPlayerAnalyticsReport: async (playerId: string, timeRange: string = 'season', startDate?: Date, endDate?: Date): Promise<PlayerAnalyticsReport> => {
    try {
      logger.info('Generating player analytics report', { playerId, timeRange, startDate, endDate });
      
      // Get the player from database
      const playerResult = await supabaseService.getPlayer(playerId);
      if (!playerResult.success) {
        throw new EntityNotFoundError('Player', playerId);
      }
      
      const player = playerResult.data;
      
      // Get player statistics
      const playerStats = await statisticsService.getPlayerStatistics(playerId);
      
      // Generate mock report data
      const now = new Date();
      let reportStartDate = new Date(now);
      let reportEndDate = new Date(now);
      
      switch (timeRange) {
        case 'week':
          reportStartDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          reportStartDate.setMonth(now.getMonth() - 1);
          break;
        case 'season':
          reportStartDate.setMonth(now.getMonth() - 3);
          break;
        case 'custom':
          if (startDate && endDate) {
            reportStartDate = startDate;
            reportEndDate = endDate;
          } else {
            reportStartDate.setMonth(now.getMonth() - 3);
          }
          break;
        default:
          reportStartDate.setMonth(now.getMonth() - 3);
      }
      
      // Generate mock analytics report
      const report = {
        period: {
          startDate: reportStartDate,
          endDate: reportEndDate
        },
        performance: {
          overallRating: Math.floor(Math.random() * 40) + 60, // 60-100
          form: ['Excellent', 'Good', 'Average', 'Poor'][Math.floor(Math.random() * 4)],
          improvement: (Math.random() * 20 - 10), // -10% to +10%
          consistency: Math.floor(Math.random() * 40) + 60 // 60-100
        },
        keyMetrics: {
          goals: {
            value: playerStats.goals,
            rank: Math.floor(Math.random() * 10) + 1,
            percentile: Math.floor(Math.random() * 50) + 50 // 50-100
          },
          assists: {
            value: playerStats.assists,
            rank: Math.floor(Math.random() * 10) + 1,
            percentile: Math.floor(Math.random() * 50) + 50 // 50-100
          }
        },
        trends: {
          goalsPerMatch: [1, 2, 1, 0, 2, 1, 3, 2],
          minutesPlayed: [90, 90, 45, 0, 90, 90, 90, 90]
        }
      };
      
      return {
        player: {
          id: player.id,
          firstName: player.firstName,
          lastName: player.lastName,
          displayName: player.displayName,
          profilePictureUrl: player.profilePictureUrl
        },
        report
      };
    } catch (error: any) {
      logger.error('Get player analytics report error', error);
      throw error;
    }
  },
  
  getTeamAnalyticsReport: async (teamId: string, timeRange: string = 'season', startDate?: Date, endDate?: Date): Promise<TeamAnalyticsReport> => {
    try {
      logger.info('Generating team analytics report', { teamId, timeRange, startDate, endDate });
      
      // Get the team from database
      const teamResult = await supabaseService.getTeam(teamId);
      if (!teamResult.success) {
        throw new EntityNotFoundError('Team', teamId);
      }
      
      const team = teamResult.data;
      
      // Get team statistics
      const teamStats = await statisticsService.getTeamStatistics(teamId);
      
      // Generate mock report data
      const now = new Date();
      let reportStartDate = new Date(now);
      let reportEndDate = new Date(now);
      
      switch (timeRange) {
        case 'week':
          reportStartDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          reportStartDate.setMonth(now.getMonth() - 1);
          break;
        case 'season':
          reportStartDate.setMonth(now.getMonth() - 3);
          break;
        case 'custom':
          if (startDate && endDate) {
            reportStartDate = startDate;
            reportEndDate = endDate;
          } else {
            reportStartDate.setMonth(now.getMonth() - 3);
          }
          break;
        default:
          reportStartDate.setMonth(now.getMonth() - 3);
      }
      
      // Generate mock analytics report
      const report = {
        period: {
          startDate: reportStartDate,
          endDate: reportEndDate
        },
        performance: {
          overallRating: Math.floor(Math.random() * 40) + 60, // 60-100
          form: ['Excellent', 'Good', 'Average', 'Poor'][Math.floor(Math.random() * 4)],
          improvement: (Math.random() * 20 - 10), // -10% to +10%
          consistency: Math.floor(Math.random() * 40) + 60 // 60-100
        },
        keyMetrics: {
          winRate: {
            value: teamStats.winPercentage,
            rank: Math.floor(Math.random() * 10) + 1,
            percentile: Math.floor(Math.random() * 50) + 50 // 50-100
          },
          goalsFor: {
            value: teamStats.goalsFor,
            rank: Math.floor(Math.random() * 10) + 1,
            percentile: Math.floor(Math.random() * 50) + 50 // 50-100
          }
        },
        trends: {
          pointsPerMatch: [3, 1, 3, 0, 3, 3, 1, 3],
          goalDifference: [2, 1, 3, -1, 2, 4, 0, 2]
        }
      };
      
      return {
        team: {
          id: team.id,
          name: team.name,
          logoUrl: team.logoUrl
        },
        report
      };
    } catch (error: any) {
      logger.error('Get team analytics report error', error);
      throw error;
    }
  },
  
  compareEntities: async (type: 'PLAYER' | 'TEAM' | 'COMPETITION', ids: string[], metrics: string[]): Promise<ComparisonResult> => {
    try {
      logger.info('Comparing entities', { type, ids, metrics });
      
      // Validate input
      if (!ids || ids.length < 2) {
        throw new Error('At least two entity IDs are required for comparison');
      }
      
      if (!metrics || metrics.length === 0) {
        throw new Error('At least one metric is required for comparison');
      }
      
      // Get entity data based on type
      const entities: any[] = [];
      
      for (const id of ids) {
        let entityData: any = null;
        let entityName = 'Unknown';
        
        switch (type) {
          case 'PLAYER':
            try {
              const playerResult = await supabaseService.getPlayer(id);
              if (playerResult.success) {
                const player = playerResult.data;
                const stats = await statisticsService.getPlayerStatistics(id);
                entityData = stats;
                entityName = `${player.firstName} ${player.lastName}`;
              }
            } catch (error) {
              logger.warn('Error fetching player stats for comparison', { playerId: id, error });
            }
            break;
            
          case 'TEAM':
            try {
              const teamResult = await supabaseService.getTeam(id);
              if (teamResult.success) {
                const team = teamResult.data;
                const stats = await statisticsService.getTeamStatistics(id);
                entityData = stats;
                entityName = team.name;
              }
            } catch (error) {
              logger.warn('Error fetching team stats for comparison', { teamId: id, error });
            }
            break;
            
          case 'COMPETITION':
            try {
              const stats = await statisticsService.getCompetitionStatistics(id);
              entityData = stats;
              entityName = `Competition ${id}`;
            } catch (error) {
              logger.warn('Error fetching competition stats for comparison', { competitionId: id, error });
            }
            break;
        }
        
        if (entityData) {
          entities.push({
            id,
            name: entityName,
            data: entityData
          });
        }
      }
      
      // Build metrics comparison
      const comparisonEntities: any[] = [];
      
      entities.forEach(entity => {
        const entityMetrics: { [key: string]: number } = {};
        
        metrics.forEach(metric => {
          let value = 0;
          
          // Extract metric value based on entity type
          switch (type) {
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
                  value = entity.data.totalMatches;
                  break;
                case 'totalGoals':
                  value = entity.data.totalGoals;
                  break;
                case 'averageGoalsPerMatch':
                  value = entity.data.averageGoalsPerMatch;
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
      throw error;
    }
  }
};