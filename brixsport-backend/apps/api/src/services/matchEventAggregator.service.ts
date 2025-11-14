import { logger } from '../utils/logger';
import { supabaseService } from './supabase.service';
import { websocketService } from './websocket.service';
import { PlayerPerformanceMetrics, AdvancedPlayerMetrics } from '../types/performance.metrics';

// Define types based on what we know from the database structure
export interface MatchEvent {
  id: string;
  matchId: string;
  playerId?: string;
  teamId?: string;
  eventType: string;
  timestamp: string;
  minute?: number;
  second?: number;
  description?: string;
  additionalData?: any;
}

interface PlayerStats {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passesCompleted: number;
  tackles: number;
  interceptions: number;
  clearances: number;
  saves: number;
  foulsCommitted: number;
  foulsSuffered: number;
  minutesPlayed: number;
  substitutions: number;
  offside: number;
  possession: number;
  corners?: number;
  throwIns?: number;
  passAccuracy?: number;
  fouls?: number;
  offsides?: number;
}

interface TeamStats extends PlayerStats {
  substitutionsUsed: number;
  formation: string;
  possession: number;
  cornerKicks: number;
  goalAttempts: number;
  dangerousAttacks: number;
}

// Cache implementation for performance optimization
interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

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

  // Get cache statistics
  getStats(): { size: number; defaultTTL: number } {
    return {
      size: this.cache.size,
      defaultTTL: this.defaultTTL
    };
  }

  // Preload cache with initial data
  preload<T>(key: string, value: T, ttl?: number): void {
    const cacheItem: CacheItem<T> = {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    this.cache.set(key, cacheItem);
  }
}

const eventCache = new SimpleCache();

// Error types for better error handling
export class MatchEventAggregatorError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'MatchEventAggregatorError';
  }
}

export class EntityNotFoundError extends MatchEventAggregatorError {
  constructor(entityType: string, entityId: string) {
    super(`${entityType} not found: ${entityId}`, 'ENTITY_NOT_FOUND', 404, { entityType, entityId });
    this.name = 'EntityNotFoundError';
  }
}

export class ValidationError extends MatchEventAggregatorError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends MatchEventAggregatorError {
  constructor(message: string, originalError?: any) {
    super(message, 'DATABASE_ERROR', 500, originalError);
    this.name = 'DatabaseError';
  }
}

// Real-time match statistics interface
export interface RealTimeMatchStats {
  matchId: string;
  homeTeamStats: TeamStats;
  awayTeamStats: TeamStats;
  playerStats: Record<string, PlayerStats>;
  events: MatchEvent[];
  lastUpdated: Date;
}

// Match event aggregator service
export const matchEventAggregatorService = {
  // Enhanced cache management methods
  getCacheStats: (): { size: number; defaultTTL: number } => {
    return eventCache.getStats();
  },
  
  // Helper method to get player's team ID
  getPlayerTeamId: (playerId: string, matchId: string): string | null => {
    try {
      // In a real implementation, we would query the database to get the player's team
      // For now, we'll implement a basic version that could be expanded
      
      // First check if we have this information in our player stats
      // This is a simplified approach - a real implementation would query the database
      
      // Return null for now as we don't have access to the database in this context
      return null;
    } catch (error) {
      logger.error('Error getting player team ID', { playerId, matchId, error });
      return null;
    }
  },

  preloadMatchStats: (matchId: string, stats: RealTimeMatchStats, ttl?: number): void => {
    const cacheKey = `match_stats_${matchId}`;
    eventCache.preload(cacheKey, stats, ttl);
  },

  invalidateMatchCache: (matchId: string): boolean => {
    const cacheKey = `match_stats_${matchId}`;
    return eventCache.delete(cacheKey);
  },

  // Enhanced WebSocket integration methods
  emitMatchStatsUpdate: (matchId: string, stats: RealTimeMatchStats): void => {
    try {
      // Emit to match-specific room
      websocketService.emitToRoom(`match:${matchId}`, 'match:statsUpdate', {
        matchId,
        stats,
        timestamp: new Date()
      });
      
      logger.info('Emitted match stats update', { matchId });
    } catch (error: any) {
      logger.error('Error emitting match stats update', { error: error.message, matchId });
    }
  },

  emitPlayerStatsUpdate: (matchId: string, playerId: string, stats: PlayerStats): void => {
    try {
      // Emit to match-specific player stats room
      websocketService.emitToRoom(`match:${matchId}:player:${playerId}`, 'player:statsUpdate', {
        matchId,
        playerId,
        stats,
        timestamp: new Date()
      });
      
      logger.info('Emitted player stats update', { matchId, playerId });
    } catch (error: any) {
      logger.error('Error emitting player stats update', { error: error.message, matchId, playerId });
    }
  },

  emitTeamStatsUpdate: (matchId: string, teamId: string, stats: TeamStats, isHomeTeam: boolean): void => {
    try {
      // Emit to match-specific team stats room
      websocketService.emitToRoom(`match:${matchId}:team:${teamId}`, 'team:statsUpdate', {
        matchId,
        teamId,
        stats,
        isHomeTeam,
        timestamp: new Date()
      });
      
      logger.info('Emitted team stats update', { matchId, teamId, isHomeTeam });
    } catch (error: any) {
      logger.error('Error emitting team stats update', { error: error.message, matchId, teamId });
    }
  },

  emitEventWithStats: async (matchEvent: MatchEvent, updatedStats: RealTimeMatchStats): Promise<void> => {
    try {
      // Emit the match event
      websocketService.emitMatchEvent(matchEvent.matchId, matchEvent);
      
      // Emit updated statistics
      matchEventAggregatorService.emitMatchStatsUpdate(matchEvent.matchId, updatedStats);
      
      // Emit team-specific updates
      matchEventAggregatorService.emitTeamStatsUpdate(
        matchEvent.matchId, 
        matchEvent.teamId || '', 
        matchEvent.teamId === updatedStats.matchId ? updatedStats.homeTeamStats : updatedStats.awayTeamStats,
        matchEvent.teamId === updatedStats.matchId
      );
      
      // Emit player-specific update if player ID is available
      if (matchEvent.playerId && updatedStats.playerStats[matchEvent.playerId]) {
        matchEventAggregatorService.emitPlayerStatsUpdate(
          matchEvent.matchId, 
          matchEvent.playerId, 
          updatedStats.playerStats[matchEvent.playerId]
        );
      }
      
      logger.info('Emitted event with stats', { matchId: matchEvent.matchId, eventType: matchEvent.eventType });
    } catch (error: any) {
      logger.error('Error emitting event with stats', { error: error.message, matchId: matchEvent.matchId });
    }
  },

  // Process a new match event and update statistics
  processMatchEvent: async (matchEvent: MatchEvent): Promise<RealTimeMatchStats> => {
    try {
      logger.info('Processing match event', { matchEvent });
      
      // Validate the event
      if (!matchEvent.matchId) {
        throw new ValidationError('Match ID is required');
      }
      
      if (!matchEvent.eventType) {
        throw new ValidationError('Event type is required');
      }
      
      // Get current match stats from cache or database
      const cacheKey = `match_stats_${matchEvent.matchId}`;
      let matchStats = eventCache.get<RealTimeMatchStats>(cacheKey);
      
      if (!matchStats) {
        matchStats = await matchEventAggregatorService.getMatchStats(matchEvent.matchId);
        eventCache.set(cacheKey, matchStats);
      }
      
      // Process the event based on its type
      if (matchStats) {
        switch (matchEvent.eventType) {
          case 'goal':
            matchStats = matchEventAggregatorService.processGoalEvent(matchStats, matchEvent);
            break;
          case 'card':
          case 'yellow_card':
          case 'red_card':
            matchStats = matchEventAggregatorService.processCardEvent(matchStats, matchEvent);
            break;
          case 'substitution':
            matchStats = matchEventAggregatorService.processSubstitutionEvent(matchStats, matchEvent);
            break;
          case 'foul':
            matchStats = matchEventAggregatorService.processFoulEvent(matchStats, matchEvent);
            break;
          case 'injury':
            matchStats = matchEventAggregatorService.processInjuryEvent(matchStats, matchEvent);
            break;
          case 'VAR':
            matchStats = matchEventAggregatorService.processVAREvent(matchStats, matchEvent);
            break;
          case 'penalty':
            matchStats = matchEventAggregatorService.processPenaltyEvent(matchStats, matchEvent);
            break;
          case 'kick-off':
            matchStats = matchEventAggregatorService.processKickOffEvent(matchStats, matchEvent);
            break;
          case 'half-time':
            matchStats = matchEventAggregatorService.processHalfTimeEvent(matchStats, matchEvent);
            break;
          case 'full-time':
            matchStats = matchEventAggregatorService.processFullTimeEvent(matchStats, matchEvent);
            break;
          case 'shot_on_target':
            matchStats = matchEventAggregatorService.processShotOnTargetEvent(matchStats, matchEvent);
            break;
          case 'shot_off_target':
            matchStats = matchEventAggregatorService.processShotOffTargetEvent(matchStats, matchEvent);
            break;
          case 'corner':
            matchStats = matchEventAggregatorService.processCornerEvent(matchStats, matchEvent);
            break;
          case 'offside':
            matchStats = matchEventAggregatorService.processOffsideEvent(matchStats, matchEvent);
            break;
          case 'throw_in':
            matchStats = matchEventAggregatorService.processThrowInEvent(matchStats, matchEvent);
            break;
          case 'free_kick':
            matchStats = matchEventAggregatorService.processFreeKickEvent(matchStats, matchEvent);
            break;
          case 'goal_kick':
            matchStats = matchEventAggregatorService.processGoalKickEvent(matchStats, matchEvent);
            break;
          default:
            logger.warn('Unknown event type', { eventType: matchEvent.eventType });
        }
        
        // Add the event to the events list
        matchStats.events.push(matchEvent);
        
        // Update calculated statistics
        matchStats = matchEventAggregatorService.updateCalculatedStatistics(matchStats);
        
        // Update last updated timestamp
        matchStats.lastUpdated = new Date();
        
        // Cache the updated stats with a shorter TTL for active matches
        const isLiveMatch = matchStats.events.some(event => 
          ['kick-off', 'half-time', 'full-time'].includes(event.eventType)
        );
        const ttl = isLiveMatch ? 30 * 1000 : 5 * 60 * 1000; // 30 seconds for live matches, 5 minutes for completed
        eventCache.set(cacheKey, matchStats, ttl);
        
        // Emit real-time update via WebSocket
        await matchEventAggregatorService.emitEventWithStats(matchEvent, matchStats);
        
        return matchStats;
      } else {
        throw new DatabaseError('Failed to retrieve match statistics');
      }
    } catch (error: any) {
      logger.error('Process match event error', error);
      if (error instanceof MatchEventAggregatorError) {
        throw error;
      }
      throw new DatabaseError('Failed to process match event', error);
    }
  },
  
  // Get current match statistics
  getMatchStats: async (matchId: string): Promise<RealTimeMatchStats> => {
    try {
      logger.info('Fetching match statistics', { matchId });
      
      // Check cache first
      const cacheKey = `match_stats_${matchId}`;
      const cached = eventCache.get<RealTimeMatchStats>(cacheKey);
      if (cached) {
        logger.info('Returning cached match statistics', { matchId });
        return cached;
      }
      
      // Get match data from database
      const matchResult = await supabaseService.getMatch(matchId);
      if (!matchResult.success) {
        throw new EntityNotFoundError('Match', matchId);
      }
      
      const match = matchResult.data;
      
      // Get match events from database
      const eventsResult = await supabaseService.getMatchEventsByMatch(matchId);
      if (!eventsResult.success) {
        throw new DatabaseError('Failed to fetch match events');
      }
      
      const events = eventsResult.data || [];
      
      // Initialize statistics
      const homeTeamStats: TeamStats = {
        goals: (match as any).homeScore || 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        shots: 0,
        shotsOnTarget: 0,
        passes: 0,
        passesCompleted: 0,
        tackles: 0,
        interceptions: 0,
        clearances: 0,
        saves: 0,
        foulsCommitted: 0,
        foulsSuffered: 0,
        minutesPlayed: 0,
        substitutions: 0,
        offside: 0,
        possession: 50, // Default to 50-50
        substitutionsUsed: 0,
        formation: '',
        cornerKicks: 0,
        goalAttempts: 0,
        dangerousAttacks: 0,
        passAccuracy: 0
      };
      
      const awayTeamStats: TeamStats = {
        goals: (match as any).awayScore || 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        shots: 0,
        shotsOnTarget: 0,
        passes: 0,
        passesCompleted: 0,
        tackles: 0,
        interceptions: 0,
        clearances: 0,
        saves: 0,
        foulsCommitted: 0,
        foulsSuffered: 0,
        minutesPlayed: 0,
        substitutions: 0,
        offside: 0,
        possession: 50, // Default to 50-50
        substitutionsUsed: 0,
        formation: '',
        cornerKicks: 0,
        goalAttempts: 0,
        dangerousAttacks: 0,
        passAccuracy: 0
      };
      
      const playerStats: Record<string, PlayerStats> = {};
      
      // Process all events to build current statistics
      for (const event of events) {
        switch (event.eventType) {
          case 'goal':
            matchEventAggregatorService.processGoalEvent(
              { matchId, homeTeamStats, awayTeamStats, playerStats, events: [], lastUpdated: new Date() },
              event
            );
            break;
          case 'card':
            matchEventAggregatorService.processCardEvent(
              { matchId, homeTeamStats, awayTeamStats, playerStats, events: [], lastUpdated: new Date() },
              event
            );
            break;
          case 'substitution':
            matchEventAggregatorService.processSubstitutionEvent(
              { matchId, homeTeamStats, awayTeamStats, playerStats, events: [], lastUpdated: new Date() },
              event
            );
            break;
          case 'foul':
            matchEventAggregatorService.processFoulEvent(
              { matchId, homeTeamStats, awayTeamStats, playerStats, events: [], lastUpdated: new Date() },
              event
            );
            break;
          case 'shot_on_target':
            matchEventAggregatorService.processShotOnTargetEvent(
              { matchId, homeTeamStats, awayTeamStats, playerStats, events: [], lastUpdated: new Date() },
              event
            );
            break;
          case 'shot_off_target':
            matchEventAggregatorService.processShotOffTargetEvent(
              { matchId, homeTeamStats, awayTeamStats, playerStats, events: [], lastUpdated: new Date() },
              event
            );
            break;
          case 'corner':
            matchEventAggregatorService.processCornerEvent(
              { matchId, homeTeamStats, awayTeamStats, playerStats, events: [], lastUpdated: new Date() },
              event
            );
            break;
          case 'offside':
            matchEventAggregatorService.processOffsideEvent(
              { matchId, homeTeamStats, awayTeamStats, playerStats, events: [], lastUpdated: new Date() },
              event
            );
            break;
          case 'throw_in':
            matchEventAggregatorService.processThrowInEvent(
              { matchId, homeTeamStats, awayTeamStats, playerStats, events: [], lastUpdated: new Date() },
              event
            );
            break;
          case 'free_kick':
            matchEventAggregatorService.processFreeKickEvent(
              { matchId, homeTeamStats, awayTeamStats, playerStats, events: [], lastUpdated: new Date() },
              event
            );
            break;
          case 'goal_kick':
            matchEventAggregatorService.processGoalKickEvent(
              { matchId, homeTeamStats, awayTeamStats, playerStats, events: [], lastUpdated: new Date() },
              event
            );
            break;
        }
      }
      
      let matchStats: RealTimeMatchStats = {
        matchId,
        homeTeamStats,
        awayTeamStats,
        playerStats,
        events,
        lastUpdated: new Date()
      };
      
      // Update calculated statistics
      matchStats = matchEventAggregatorService.updateCalculatedStatistics(matchStats);
      
      // Cache the result with appropriate TTL based on match status
      const isCompleted = events.some(event => event.eventType === 'full-time');
      const ttl = isCompleted ? 30 * 60 * 1000 : 60 * 1000; // 30 minutes for completed matches, 1 minute for active
      eventCache.set(cacheKey, matchStats, ttl);
      
      return matchStats;
    } catch (error: any) {
      logger.error('Get match stats error', error);
      if (error instanceof MatchEventAggregatorError) {
        throw error;
      }
      throw new DatabaseError('Failed to get match statistics', error);
    }
  },
  
  // Process goal event
  processGoalEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing goal event', { event });
      
      // Increment team goals
      if (event.teamId === matchStats.matchId) {
        matchStats.homeTeamStats.goals += 1;
        matchStats.homeTeamStats.goalAttempts += 1;
        matchStats.homeTeamStats.shots += 1;
        matchStats.homeTeamStats.shotsOnTarget += 1;
      } else {
        matchStats.awayTeamStats.goals += 1;
        matchStats.awayTeamStats.goalAttempts += 1;
        matchStats.awayTeamStats.shots += 1;
        matchStats.awayTeamStats.shotsOnTarget += 1;
      }
      
      // Update player stats if player ID is provided
      if (event.playerId) {
        if (!matchStats.playerStats[event.playerId]) {
          matchStats.playerStats[event.playerId] = matchEventAggregatorService.initializePlayerStats();
        }
        matchStats.playerStats[event.playerId].goals += 1;
        matchStats.playerStats[event.playerId].shots += 1;
        matchStats.playerStats[event.playerId].shotsOnTarget += 1;
      }
      
      // Update assist stats if secondary player ID is provided
      if (event.additionalData?.secondaryPlayerId) {
        if (!matchStats.playerStats[event.additionalData.secondaryPlayerId]) {
          matchStats.playerStats[event.additionalData.secondaryPlayerId] = matchEventAggregatorService.initializePlayerStats();
        }
        matchStats.playerStats[event.additionalData.secondaryPlayerId].assists += 1;
      }
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process goal event error', error);
      return matchStats;
    }
  },
  
  // Process card event
  processCardEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing card event', { event });
      
      // Determine card type from additionalData
      const cardType = event.additionalData?.cardType || 'yellow';
      
      // Update team stats
      if (event.teamId === matchStats.matchId) {
        if (cardType === 'yellow') {
          matchStats.homeTeamStats.yellowCards += 1;
          matchStats.homeTeamStats.foulsCommitted += 1;
        } else if (cardType === 'red') {
          matchStats.homeTeamStats.redCards += 1;
          matchStats.homeTeamStats.foulsCommitted += 1;
        }
      } else {
        if (cardType === 'yellow') {
          matchStats.awayTeamStats.yellowCards += 1;
          matchStats.awayTeamStats.foulsCommitted += 1;
        } else if (cardType === 'red') {
          matchStats.awayTeamStats.redCards += 1;
          matchStats.awayTeamStats.foulsCommitted += 1;
        }
      }
      
      // Update player stats if player ID is provided
      if (event.playerId) {
        if (!matchStats.playerStats[event.playerId]) {
          matchStats.playerStats[event.playerId] = matchEventAggregatorService.initializePlayerStats();
        }
        
        if (cardType === 'yellow') {
          matchStats.playerStats[event.playerId].yellowCards += 1;
          matchStats.playerStats[event.playerId].foulsCommitted += 1;
        } else if (cardType === 'red') {
          matchStats.playerStats[event.playerId].redCards += 1;
          matchStats.playerStats[event.playerId].foulsCommitted += 1;
        }
      }
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process card event error', error);
      return matchStats;
    }
  },
  
  // Process substitution event
  processSubstitutionEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing substitution event', { event });
      
      // Update team stats
      if (event.teamId === matchStats.matchId) {
        matchStats.homeTeamStats.substitutions += 1;
        matchStats.homeTeamStats.substitutionsUsed += 1;
      } else {
        matchStats.awayTeamStats.substitutions += 1;
        matchStats.awayTeamStats.substitutionsUsed += 1;
      }
      
      // Update player stats for outgoing player
      if (event.playerId) {
        if (!matchStats.playerStats[event.playerId]) {
          matchStats.playerStats[event.playerId] = matchEventAggregatorService.initializePlayerStats();
        }
        matchStats.playerStats[event.playerId].substitutions += 1;
      }
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process substitution event error', error);
      return matchStats;
    }
  },
  
  // Process foul event
  processFoulEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing foul event', { event });
      
      // Update team stats
      if (event.teamId === matchStats.matchId) {
        matchStats.homeTeamStats.foulsCommitted += 1;
      } else {
        matchStats.awayTeamStats.foulsCommitted += 1;
      }
      
      // Update player stats if player ID is provided
      if (event.playerId) {
        if (!matchStats.playerStats[event.playerId]) {
          matchStats.playerStats[event.playerId] = matchEventAggregatorService.initializePlayerStats();
        }
        matchStats.playerStats[event.playerId].foulsCommitted += 1;
      }
      
      // Update fouled player stats if secondary player ID is provided
      if (event.additionalData?.secondaryPlayerId) {
        if (!matchStats.playerStats[event.additionalData.secondaryPlayerId]) {
          matchStats.playerStats[event.additionalData.secondaryPlayerId] = matchEventAggregatorService.initializePlayerStats();
        }
        matchStats.playerStats[event.additionalData.secondaryPlayerId].foulsSuffered += 1;
      }
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process foul event error', error);
      return matchStats;
    }
  },
  
  // Process injury event
  processInjuryEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing injury event', { event });
      
      // For now, just log the injury event
      // In a full implementation, this might affect player availability or substitution decisions
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process injury event error', error);
      return matchStats;
    }
  },
  
  // Process VAR event
  processVAREvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing VAR event', { event });
      
      // For now, just log the VAR event
      // In a full implementation, this might affect previous events or decisions
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process VAR event error', error);
      return matchStats;
    }
  },
  
  // Process penalty event
  processPenaltyEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing penalty event', { event });
      
      // A penalty is a type of goal or foul, so we'll treat it as such
      // If it resulted in a goal, it would also trigger a goal event
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process penalty event error', error);
      return matchStats;
    }
  },
  
  // Process kick-off event
  processKickOffEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing kick-off event', { event });
      
      // Kick-off starts the match, so we might want to initialize some stats
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process kick-off event error', error);
      return matchStats;
    }
  },
  
  // Process half-time event
  processHalfTimeEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing half-time event', { event });
      
      // Half-time is a status change, update match status if needed
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process half-time event error', error);
      return matchStats;
    }
  },
  
  // Process full-time event
  processFullTimeEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing full-time event', { event });
      
      // Full-time ends the match, update match status if needed
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process full-time event error', error);
      return matchStats;
    }
  },
  
  // Process shot on target event
  processShotOnTargetEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing shot on target event', { event });
      
      // Update team stats
      if (event.teamId === matchStats.matchId) {
        matchStats.homeTeamStats.shots += 1;
        matchStats.homeTeamStats.shotsOnTarget += 1;
        matchStats.homeTeamStats.goalAttempts += 1;
      } else {
        matchStats.awayTeamStats.shots += 1;
        matchStats.awayTeamStats.shotsOnTarget += 1;
        matchStats.awayTeamStats.goalAttempts += 1;
      }
      
      // Update player stats if player ID is provided
      if (event.playerId) {
        if (!matchStats.playerStats[event.playerId]) {
          matchStats.playerStats[event.playerId] = matchEventAggregatorService.initializePlayerStats();
        }
        matchStats.playerStats[event.playerId].shots += 1;
        matchStats.playerStats[event.playerId].shotsOnTarget += 1;
      }
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process shot on target event error', error);
      return matchStats;
    }
  },
  
  // Process shot off target event
  processShotOffTargetEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing shot off target event', { event });
      
      // Update team stats
      if (event.teamId === matchStats.matchId) {
        matchStats.homeTeamStats.shots += 1;
        matchStats.homeTeamStats.goalAttempts += 1;
      } else {
        matchStats.awayTeamStats.shots += 1;
        matchStats.awayTeamStats.goalAttempts += 1;
      }
      
      // Update player stats if player ID is provided
      if (event.playerId) {
        if (!matchStats.playerStats[event.playerId]) {
          matchStats.playerStats[event.playerId] = matchEventAggregatorService.initializePlayerStats();
        }
        matchStats.playerStats[event.playerId].shots += 1;
      }
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process shot off target event error', error);
      return matchStats;
    }
  },
  
  // Process corner event
  processCornerEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing corner event', { event });
      
      // Update team stats
      if (event.teamId === matchStats.matchId) {
        matchStats.homeTeamStats.cornerKicks += 1;
      } else {
        matchStats.awayTeamStats.cornerKicks += 1;
      }
      
      // Update player stats if player ID is provided
      if (event.playerId) {
        if (!matchStats.playerStats[event.playerId]) {
          matchStats.playerStats[event.playerId] = matchEventAggregatorService.initializePlayerStats();
        }
        if (matchStats.playerStats[event.playerId].corners !== undefined) {
          matchStats.playerStats[event.playerId].corners! += 1;
        }
      }
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process corner event error', error);
      return matchStats;
    }
  },
  
  // Process offside event
  processOffsideEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing offside event', { event });
      
      // Update team stats
      if (event.teamId === matchStats.matchId) {
        matchStats.homeTeamStats.offside += 1;
      } else {
        matchStats.awayTeamStats.offside += 1;
      }
      
      // Update player stats if player ID is provided
      if (event.playerId) {
        if (!matchStats.playerStats[event.playerId]) {
          matchStats.playerStats[event.playerId] = matchEventAggregatorService.initializePlayerStats();
        }
        matchStats.playerStats[event.playerId].offside += 1;
        if (matchStats.playerStats[event.playerId].offsides !== undefined) {
          matchStats.playerStats[event.playerId].offsides! += 1;
        }
      }
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process offside event error', error);
      return matchStats;
    }
  },
  
  // Process throw-in event
  processThrowInEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing throw-in event', { event });
      
      // Update team stats
      if (event.teamId === matchStats.matchId) {
        if (matchStats.homeTeamStats.throwIns !== undefined) {
          matchStats.homeTeamStats.throwIns! += 1;
        }
      } else {
        if (matchStats.awayTeamStats.throwIns !== undefined) {
          matchStats.awayTeamStats.throwIns! += 1;
        }
      }
      
      // Update player stats if player ID is provided
      if (event.playerId) {
        if (!matchStats.playerStats[event.playerId]) {
          matchStats.playerStats[event.playerId] = matchEventAggregatorService.initializePlayerStats();
        }
        if (matchStats.playerStats[event.playerId].throwIns !== undefined) {
          matchStats.playerStats[event.playerId].throwIns! += 1;
        }
      }
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process throw-in event error', error);
      return matchStats;
    }
  },
  
  // Process free kick event
  processFreeKickEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing free kick event', { event });
      
      // Update player stats if player ID is provided
      if (event.playerId) {
        if (!matchStats.playerStats[event.playerId]) {
          matchStats.playerStats[event.playerId] = matchEventAggregatorService.initializePlayerStats();
        }
        // Free kicks can lead to shots, so we'll track them as such
        matchStats.playerStats[event.playerId].shots += 1;
      }
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process free kick event error', error);
      return matchStats;
    }
  },
  
  // Process goal kick event
  processGoalKickEvent: (matchStats: RealTimeMatchStats, event: MatchEvent): RealTimeMatchStats => {
    try {
      logger.info('Processing goal kick event', { event });
      
      // Update player stats if player ID is provided
      if (event.playerId) {
        if (!matchStats.playerStats[event.playerId]) {
          matchStats.playerStats[event.playerId] = matchEventAggregatorService.initializePlayerStats();
        }
        // Track goal kicks as clearances
        matchStats.playerStats[event.playerId].clearances += 1;
      }
      
      return matchStats;
    } catch (error: any) {
      logger.error('Process goal kick event error', error);
      return matchStats;
    }
  },
  
  // Initialize player stats
  initializePlayerStats: (): PlayerStats => {
    return {
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      shots: 0,
      shotsOnTarget: 0,
      passes: 0,
      passesCompleted: 0,
      tackles: 0,
      interceptions: 0,
      clearances: 0,
      saves: 0,
      foulsCommitted: 0,
      foulsSuffered: 0,
      minutesPlayed: 0,
      substitutions: 0,
      offside: 0,
      possession: 0,
      corners: 0,
      throwIns: 0,
      passAccuracy: 0,
      fouls: 0,
      offsides: 0
    };
  },
  
  // Clear cache for a specific match
  clearMatchCache: (matchId: string): void => {
    const cacheKey = `match_stats_${matchId}`;
    eventCache.delete(cacheKey);
  },
  
  // Clear all cache
  clearAllCache: (): void => {
    eventCache.clear();
  },
  
  // Calculate possession percentage for both teams
  calculatePossession: (matchStats: RealTimeMatchStats): { homePossession: number, awayPossession: number } => {
    try {
      // For now, we'll use a simple approximation based on passes and shots
      // In a real implementation, this would be based on actual possession events
      const homeTotalActions = matchStats.homeTeamStats.passes + matchStats.homeTeamStats.shots + 
                              matchStats.homeTeamStats.tackles + matchStats.homeTeamStats.interceptions;
      const awayTotalActions = matchStats.awayTeamStats.passes + matchStats.awayTeamStats.shots + 
                              matchStats.awayTeamStats.tackles + matchStats.awayTeamStats.interceptions;
      const totalActions = homeTotalActions + awayTotalActions;
      
      if (totalActions === 0) {
        return { homePossession: 50, awayPossession: 50 };
      }
      
      const homePossession = Math.round((homeTotalActions / totalActions) * 100);
      const awayPossession = 100 - homePossession;
      
      return { homePossession, awayPossession };
    } catch (error: any) {
      logger.error('Calculate possession error', error);
      // Return default 50-50 possession
      return { homePossession: 50, awayPossession: 50 };
    }
  },
  
  // Enhanced possession calculation algorithm based on event data
  calculatePossessionFromEvents: (matchStats: RealTimeMatchStats, events: MatchEvent[]): { homePossession: number, awayPossession: number } => {
    try {
      // Initialize possession counters
      let homeTouches = 0;
      let awayTouches = 0;
      
      // Process events to calculate possession based on touches
      events.forEach(event => {
        // Count touches based on event types that indicate ball possession
        switch (event.eventType) {
          case 'pass':
          case 'pass_completed':
          case 'pass_incomplete':
          case 'shot_on_target':
          case 'shot_off_target':
          case 'goal':
          case 'corner':
          case 'throw_in':
          case 'free_kick':
          case 'goal_kick':
          case 'clearance':
          case 'tackle':
          case 'interception':
          case 'foul':
            // Assign touch to the team based on teamId
            if (event.teamId === matchStats.matchId) {
              homeTouches++;
            } else if (event.teamId) {
              awayTouches++;
            }
            break;
          
          // Special handling for events with player-specific data
          case 'goal':
          case 'assist':
          case 'shot_on_target':
          case 'shot_off_target':
          case 'corner':
          case 'throw_in':
          case 'free_kick':
          case 'goal_kick':
          case 'clearance':
          case 'tackle':
          case 'interception':
          case 'foul':
          case 'yellow_card':
          case 'red_card':
            // If we have player data, we can infer team from player stats
            if (event.playerId && matchStats.playerStats[event.playerId]) {
              // In a real implementation, we'd need player-team mapping
              // Check if we have player-team mapping in our system
              if (matchStats.playerStats[event.playerId]) {
                // We could query the database for the player's team, but for performance,
                // we'll check if the player exists in either team's known players
                // In a real implementation, this would be an async call
                // For now, we'll use a simplified approach without async/await
                homeTouches++; // Default to home for now
              } else {
                // Fallback to existing logic if player not found
                homeTouches++; // Default to home for now
              }
            }
            break;
        }
      });
      
      // Calculate possession percentages
      const totalTouches = homeTouches + awayTouches;
      
      if (totalTouches === 0) {
        // Return default 50-50 possession if no touches recorded
        return { homePossession: 50, awayPossession: 50 };
      }
      
      const homePossession = Math.round((homeTouches / totalTouches) * 100);
      const awayPossession = 100 - homePossession;
      
      return { homePossession, awayPossession };
    } catch (error: any) {
      logger.error('Calculate possession from events error', error);
      // Return default 50-50 possession on error
      return { homePossession: 50, awayPossession: 50 };
    }
  },

  // Advanced possession calculation using time-based estimation
  calculatePossessionFromTime: (
    matchStats: RealTimeMatchStats, 
    events: MatchEvent[],
    matchStartTime?: Date,
    currentTime?: Date
  ): { homePossession: number, awayPossession: number } => {
    try {
      // If we don't have time data, fall back to event-based calculation
      if (!matchStartTime || !currentTime) {
        return matchEventAggregatorService.calculatePossessionFromEvents(matchStats, events);
      }
      
      // Initialize time possession counters (in seconds)
      let homePossessionTime = 0;
      let awayPossessionTime = 0;
      let unknownPossessionTime = 0;
      
      // Sort events by timestamp
      const sortedEvents = [...events].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      // Calculate time between events to estimate possession
      let lastEventTime = matchStartTime;
      
      for (let i = 0; i < sortedEvents.length; i++) {
        const event = sortedEvents[i];
        const eventTime = new Date(event.timestamp);
        
        // Calculate time since last event
        const timeSinceLastEvent = (eventTime.getTime() - lastEventTime.getTime()) / 1000; // Convert to seconds
        
        // Assign possession time based on event type and team
        if (timeSinceLastEvent > 0) {
          switch (event.eventType) {
            // Events that clearly indicate possession change
            case 'goal':
            case 'shot_on_target':
            case 'shot_off_target':
            case 'corner':
            case 'throw_in':
            case 'free_kick':
            case 'goal_kick':
            case 'clearance':
            case 'tackle_won':
            case 'interception_won':
              if (event.teamId === matchStats.matchId) {
                homePossessionTime += timeSinceLastEvent;
              } else if (event.teamId) {
                awayPossessionTime += timeSinceLastEvent;
              } else {
                unknownPossessionTime += timeSinceLastEvent;
              }
              break;
              
            // Neutral events that don't clearly indicate possession
            case 'foul':
            case 'yellow_card':
            case 'red_card':
            case 'injury':
            case 'substitution':
              // Distribute time to unknown for neutral events
              unknownPossessionTime += timeSinceLastEvent;
              break;
              
            // Events that maintain possession
            case 'pass':
            case 'pass_completed':
              if (event.teamId === matchStats.matchId) {
                homePossessionTime += timeSinceLastEvent;
              } else if (event.teamId) {
                awayPossessionTime += timeSinceLastEvent;
              } else {
                unknownPossessionTime += timeSinceLastEvent;
              }
              break;
              
            case 'pass_incomplete':
              // Incomplete pass might indicate possession change
              if (event.teamId === matchStats.matchId) {
                // Home team lost possession, so away team gets credit
                awayPossessionTime += timeSinceLastEvent;
              } else if (event.teamId) {
                // Away team lost possession, so home team gets credit
                homePossessionTime += timeSinceLastEvent;
              } else {
                unknownPossessionTime += timeSinceLastEvent;
              }
              break;
              
            default:
              // For unknown events, assign to unknown possession
              unknownPossessionTime += timeSinceLastEvent;
          }
        }
        
        lastEventTime = eventTime;
      }
      
      // Account for time since last event to current time
      const timeSinceLastEvent = (currentTime.getTime() - lastEventTime.getTime()) / 1000;
      if (timeSinceLastEvent > 0) {
        unknownPossessionTime += timeSinceLastEvent;
      }
      
      // Total calculated time
      const totalTime = homePossessionTime + awayPossessionTime + unknownPossessionTime;
      
      if (totalTime === 0) {
        return { homePossession: 50, awayPossession: 50 };
      }
      
      // Distribute unknown time proportionally based on known possession
      let homeRatio = 0;
      let awayRatio = 0;
      
      if (homePossessionTime + awayPossessionTime > 0) {
        homeRatio = homePossessionTime / (homePossessionTime + awayPossessionTime);
        awayRatio = awayPossessionTime / (homePossessionTime + awayPossessionTime);
      } else {
        // If no known possession, split equally
        homeRatio = 0.5;
        awayRatio = 0.5;
      }
      
      const homePossession = Math.round(
        ((homePossessionTime + unknownPossessionTime * homeRatio) / totalTime) * 100
      );
      const awayPossession = 100 - homePossession;
      
      return { homePossession, awayPossession };
    } catch (error: any) {
      logger.error('Calculate possession from time error', error);
      // Fall back to event-based calculation
      return matchEventAggregatorService.calculatePossessionFromEvents(matchStats, events);
    }
  },

  // Enhanced possession calculation that combines multiple methods
  calculateEnhancedPossession: (
    matchStats: RealTimeMatchStats, 
    events: MatchEvent[],
    matchStartTime?: Date,
    currentTime?: Date
  ): { homePossession: number, awayPossession: number } => {
    try {
      // Try time-based calculation first if we have time data
      if (matchStartTime && currentTime) {
        return matchEventAggregatorService.calculatePossessionFromTime(
          matchStats, 
          events, 
          matchStartTime, 
          currentTime
        );
      }
      
      // Fall back to event-based calculation
      return matchEventAggregatorService.calculatePossessionFromEvents(matchStats, events);
    } catch (error: any) {
      logger.error('Calculate enhanced possession error', error);
      // Return default 50-50 possession on error
      return { homePossession: 50, awayPossession: 50 };
    }
  },

  // Calculate pass accuracy for a team
  calculatePassAccuracy: (teamStats: TeamStats): number => {
    try {
      if (teamStats.passes === 0) {
        return 0;
      }
      
      return Math.round((teamStats.passesCompleted / teamStats.passes) * 100);
    } catch (error: any) {
      logger.error('Calculate pass accuracy error', error);
      return 0;
    }
  },
  
  // Calculate dangerous attacks for a team
  calculateDangerousAttacks: (teamStats: TeamStats): number => {
    try {
      // Approximate dangerous attacks based on shots, corners, and other attacking actions
      return teamStats.shots + Math.floor(teamStats.cornerKicks / 2) + 
             Math.floor(teamStats.goalAttempts / 3);
    } catch (error: any) {
      logger.error('Calculate dangerous attacks error', error);
      return 0;
    }
  },
  
  // Calculate shots on target percentage
  calculateShotsOnTargetPercentage: (teamStats: TeamStats): number => {
    try {
      if (teamStats.shots === 0) {
        return 0;
      }
      
      return Math.round((teamStats.shotsOnTarget / teamStats.shots) * 100);
    } catch (error: any) {
      logger.error('Calculate shots on target percentage error', error);
      return 0;
    }
  },
  
  // Calculate goal conversion rate
  calculateGoalConversionRate: (teamStats: TeamStats): number => {
    try {
      if (teamStats.shots === 0) {
        return 0;
      }
      
      return Math.round((teamStats.goals / teamStats.shots) * 100);
    } catch (error: any) {
      logger.error('Calculate goal conversion rate error', error);
      return 0;
    }
  },
  
  // Calculate player performance rating
  calculatePlayerPerformanceRating: (playerStats: PlayerStats): number => {
    try {
      // Simple performance rating based on positive contributions minus negative ones
      const positiveContributions = playerStats.goals * 3 + playerStats.assists * 2 + 
                                   playerStats.passesCompleted * 0.1 + playerStats.tackles * 0.5 + 
                                   playerStats.interceptions * 0.5 + playerStats.clearances * 0.3;
      const negativeContributions = playerStats.yellowCards * 0.5 + playerStats.redCards * 2 + 
                                   playerStats.foulsCommitted * 0.3 + (playerStats.offsides || 0) * 0.2;
      
      // Normalize to a 0-100 scale
      let rating = 50 + positiveContributions - negativeContributions;
      
      // Ensure rating is between 0 and 100
      rating = Math.max(0, Math.min(100, rating));
      
      return Math.round(rating);
    } catch (error: any) {
      logger.error('Calculate player performance rating error', error);
      return 50; // Default average rating
    }
  },
  
  // Update all calculated statistics with enhanced possession calculation
  updateCalculatedStatistics: (matchStats: RealTimeMatchStats): RealTimeMatchStats => {
    try {
      // Update possession using enhanced algorithm
      const possession = matchEventAggregatorService.calculateEnhancedPossession(
        matchStats, 
        matchStats.events
      );
      matchStats.homeTeamStats.possession = possession.homePossession;
      matchStats.awayTeamStats.possession = possession.awayPossession;
      
      // Update pass accuracy
      matchStats.homeTeamStats.passAccuracy = matchEventAggregatorService.calculatePassAccuracy(matchStats.homeTeamStats);
      matchStats.awayTeamStats.passAccuracy = matchEventAggregatorService.calculatePassAccuracy(matchStats.awayTeamStats);
      
      // Update dangerous attacks
      matchStats.homeTeamStats.dangerousAttacks = matchEventAggregatorService.calculateDangerousAttacks(matchStats.homeTeamStats);
      matchStats.awayTeamStats.dangerousAttacks = matchEventAggregatorService.calculateDangerousAttacks(matchStats.awayTeamStats);
      
      // Update shots on target percentage
      const homeShotsOnTargetPercentage = matchEventAggregatorService.calculateShotsOnTargetPercentage(matchStats.homeTeamStats);
      const awayShotsOnTargetPercentage = matchEventAggregatorService.calculateShotsOnTargetPercentage(matchStats.awayTeamStats);
      
      // Update goal conversion rate
      const homeGoalConversionRate = matchEventAggregatorService.calculateGoalConversionRate(matchStats.homeTeamStats);
      const awayGoalConversionRate = matchEventAggregatorService.calculateGoalConversionRate(matchStats.awayTeamStats);
      
      // Update player performance ratings
      for (const playerId in matchStats.playerStats) {
        const rating = matchEventAggregatorService.calculatePlayerPerformanceRating(matchStats.playerStats[playerId]);
        // We could store this in a separate field if needed
      }
      
      return matchStats;
    } catch (error: any) {
      logger.error('Update calculated statistics error', error);
      return matchStats;
    }
  },
  
  // Enhanced player performance metrics calculation
  calculatePlayerPerformanceMetrics: (playerStats: PlayerStats, matchEvents: MatchEvent[] = []): PlayerPerformanceMetrics => {
    try {
      // Calculate basic performance rating
      const basicRating = matchEventAggregatorService.calculatePlayerPerformanceRating(playerStats);
      
      // Calculate additional metrics
      const metrics: PlayerPerformanceMetrics = {
        // Basic rating (0-100 scale)
        performanceRating: basicRating,
        
        // Efficiency metrics
        goalConversionRate: playerStats.shots > 0 ? 
          Math.round((playerStats.goals / playerStats.shots) * 100) : 0,
        passAccuracy: playerStats.passes > 0 ? 
          Math.round((playerStats.passesCompleted / playerStats.passes) * 100) : 0,
        shotAccuracy: playerStats.shots > 0 ? 
          Math.round((playerStats.shotsOnTarget / playerStats.shots) * 100) : 0,
        
        // Contribution metrics
        goalInvolvement: playerStats.goals + playerStats.assists,
        defensiveActions: playerStats.tackles + playerStats.interceptions + playerStats.clearances,
        disciplinaryRating: Math.max(0, 100 - (playerStats.yellowCards * 5 + (playerStats.redCards || 0) * 20)),
        
        // Work rate metrics
        actionsPerMinute: playerStats.minutesPlayed > 0 ? 
          parseFloat(((playerStats.passes + playerStats.shots + playerStats.tackles + playerStats.interceptions) / playerStats.minutesPlayed).toFixed(2)) : 0,
        
        // Impact metrics
        keyPasses: Math.floor(playerStats.passes * 0.1), // Estimate key passes as 10% of total passes
        chancesCreated: playerStats.assists + Math.floor(playerStats.shots * 0.2), // Estimate chances created
        
        // Consistency metrics
        consistencyRating: matchEventAggregatorService.calculatePlayerConsistency(playerStats, matchEvents),
        
        // Positional metrics (simplified - would need actual position data)
        positionalRating: 75, // Default value
        
        // Updated at timestamp
        updatedAt: new Date()
      };
      
      return metrics;
    } catch (error: any) {
      logger.error('Calculate player performance metrics error', error);
      // Return default metrics on error
      return {
        performanceRating: 50,
        goalConversionRate: 0,
        passAccuracy: 0,
        shotAccuracy: 0,
        goalInvolvement: 0,
        defensiveActions: 0,
        disciplinaryRating: 100,
        actionsPerMinute: 0,
        keyPasses: 0,
        chancesCreated: 0,
        consistencyRating: 50,
        positionalRating: 75,
        updatedAt: new Date()
      };
    }
  },

  // Calculate player consistency based on performance variations
  calculatePlayerConsistency: (playerStats: PlayerStats, matchEvents: MatchEvent[]): number => {
    try {
      // If no match events, return default consistency
      if (matchEvents.length === 0) {
        return 50;
      }
      
      // Group events by match to calculate per-match performance
      const matchPerformances: number[] = [];
      const matches: Record<string, MatchEvent[]> = {};
      
      // Group events by match ID (assuming matchId is in event data)
      matchEvents.forEach(event => {
        const matchId = event.matchId || 'unknown';
        if (!matches[matchId]) {
          matches[matchId] = [];
        }
        matches[matchId].push(event);
      });
      
      // Calculate performance rating for each match
      Object.keys(matches).forEach(matchId => {
        // Create temporary player stats for this match
        const tempStats: PlayerStats = {
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          shots: 0,
          shotsOnTarget: 0,
          passes: 0,
          passesCompleted: 0,
          tackles: 0,
          interceptions: 0,
          clearances: 0,
          saves: 0,
          foulsCommitted: 0,
          foulsSuffered: 0,
          minutesPlayed: 0,
          substitutions: 0,
          offside: 0,
          possession: 0,
          corners: 0,
          throwIns: 0,
          passAccuracy: 0,
          fouls: 0,
          offsides: 0
        };
        
        // Count events for this match
        matches[matchId].forEach(event => {
          switch (event.eventType) {
            case 'goal':
              tempStats.goals++;
              break;
            case 'assist':
              tempStats.assists++;
              break;
            case 'yellow_card':
              tempStats.yellowCards++;
              break;
            case 'red_card':
              tempStats.redCards++;
              break;
            case 'shot_on_target':
              tempStats.shots++;
              tempStats.shotsOnTarget++;
              break;
            case 'shot_off_target':
              tempStats.shots++;
              break;
            case 'pass_completed':
              tempStats.passes++;
              tempStats.passesCompleted++;
              break;
            case 'pass_incomplete':
              tempStats.passes++;
              break;
            case 'tackle':
              tempStats.tackles++;
              break;
            case 'interception':
              tempStats.interceptions++;
              break;
            case 'clearance':
              tempStats.clearances++;
              break;
          }
        });
        
        // Calculate performance rating for this match
        const matchRating = matchEventAggregatorService.calculatePlayerPerformanceRating(tempStats);
        matchPerformances.push(matchRating);
      });
      
      // Calculate consistency as the inverse of performance variation
      if (matchPerformances.length === 0) {
        return 50;
      }
      
      // Calculate mean performance
      const meanPerformance = matchPerformances.reduce((sum, rating) => sum + rating, 0) / matchPerformances.length;
      
      // Calculate standard deviation
      const variance = matchPerformances.reduce((sum, rating) => sum + Math.pow(rating - meanPerformance, 2), 0) / matchPerformances.length;
      const standardDeviation = Math.sqrt(variance);
      
      // Convert to consistency rating (0-100 scale)
      // Lower standard deviation = higher consistency
      const maxStdDev = 25; // Maximum expected standard deviation
      const consistencyRating = Math.max(0, Math.min(100, 100 - (standardDeviation / maxStdDev) * 100));
      
      return Math.round(consistencyRating);
    } catch (error: any) {
      logger.error('Calculate player consistency error', error);
      return 50; // Default consistency rating
    }
  },

  // Calculate advanced player performance metrics
  calculateAdvancedPlayerMetrics: (
    playerStats: PlayerStats, 
    teamStats: TeamStats, 
    opponentStats: TeamStats,
    matchEvents: MatchEvent[] = []
  ): AdvancedPlayerMetrics => {
    try {
      // Get basic metrics
      const basicMetrics = matchEventAggregatorService.calculatePlayerPerformanceMetrics(playerStats, matchEvents);
      
      // Calculate team-relative metrics
      const teamGoals = teamStats.goals;
      const teamShots = teamStats.shots;
      const teamPasses = teamStats.passes;
      
      const advancedMetrics: AdvancedPlayerMetrics = {
        ...basicMetrics,
        
        // Team-relative metrics
        goalsPerTeamGoal: teamGoals > 0 ? 
          parseFloat((playerStats.goals / teamGoals).toFixed(2)) : 0,
        shotsPerTeamShot: teamShots > 0 ? 
          parseFloat((playerStats.shots / teamShots).toFixed(2)) : 0,
        passesPerTeamPass: teamPasses > 0 ? 
          parseFloat((playerStats.passes / teamPasses).toFixed(2)) : 0,
        
        // Opponent-relative metrics (using available properties)
        goalsAgainstPerGame: 0, // Would need additional data
        
        // Advanced efficiency metrics
        expectedGoals: matchEventAggregatorService.calculateExpectedGoals(playerStats, matchEvents),
        expectedAssists: matchEventAggregatorService.calculateExpectedAssists(playerStats, matchEvents),
        
        // Defensive impact metrics
        defensiveImpact: parseFloat(((playerStats.tackles * 0.5 + playerStats.interceptions * 0.3 + playerStats.clearances * 0.2)).toFixed(2)),
        
        // Creative metrics
        creativityIndex: parseFloat(((playerStats.assists * 2 + basicMetrics.keyPasses * 0.5)).toFixed(2)),
        
        // Physical metrics
        workRate: parseFloat((basicMetrics.actionsPerMinute * 10).toFixed(2)),
        
        // Calculated at timestamp
        updatedAt: new Date()
      };
      
      return advancedMetrics;
    } catch (error: any) {
      logger.error('Calculate advanced player metrics error', error);
      // Return basic metrics on error
      return {
        ...matchEventAggregatorService.calculatePlayerPerformanceMetrics(playerStats, matchEvents),
        goalsPerTeamGoal: 0,
        shotsPerTeamShot: 0,
        passesPerTeamPass: 0,
        goalsAgainstPerGame: 0,
        expectedGoals: 0,
        expectedAssists: 0,
        defensiveImpact: 0,
        creativityIndex: 0,
        workRate: 0,
        updatedAt: new Date()
      };
    }
  },

  // Calculate expected goals (xG) based on shot quality
  calculateExpectedGoals: (playerStats: PlayerStats, matchEvents: MatchEvent[]): number => {
    try {
      // Simplified xG calculation based on shot types
      let expectedGoals = 0;
      
      // Count different types of shots
      let shotsOnTarget = playerStats.shotsOnTarget;
      let shotsOffTarget = playerStats.shots - playerStats.shotsOnTarget;
      
      // Apply basic xG values (simplified model)
      expectedGoals += shotsOnTarget * 0.3; // 30% chance of goal for shots on target
      expectedGoals += shotsOffTarget * 0.05; // 5% chance of goal for shots off target
      
      return parseFloat(expectedGoals.toFixed(2));
    } catch (error: any) {
      logger.error('Calculate expected goals error', error);
      return 0;
    }
  },

  // Calculate expected assists (xA) based on pass quality and outcome
  calculateExpectedAssists: (playerStats: PlayerStats, matchEvents: MatchEvent[]): number => {
    try {
      // Simplified xA calculation
      let expectedAssists = 0;
      
      // Estimate key passes that lead to shots
      const keyPasses = Math.floor(playerStats.passes * 0.1); // Estimate 10% of passes are key passes
      const passesCompleted = playerStats.passesCompleted;
      
      // Apply basic xA values
      expectedAssists += keyPasses * 0.1; // 10% chance of assist from key pass
      expectedAssists += (passesCompleted - keyPasses) * 0.01; // 1% chance of assist from other passes
      
      return parseFloat(expectedAssists.toFixed(2));
    } catch (error: any) {
      logger.error('Calculate expected assists error', error);
      return 0;
    }
  }
};