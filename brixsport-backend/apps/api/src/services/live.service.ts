import { logger } from '../utils/logger';
import { supabaseService } from './supabase.service';

interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  [key: string]: any; // For other properties we might not need to type explicitly
}

export const liveService = {
  // Live Match State
  getMatchState: async (matchId: string) => {
    try {
      logger.info('Fetching match state', { matchId });
      
      // Get match state from Supabase
      const matchResult = await supabaseService.getMatch(matchId);
      if (!matchResult.success) {
        throw new Error('Match not found');
      }
      
      return {
        success: true,
        data: matchResult.data
      };
    } catch (error: any) {
      logger.error('Get match state error', error);
      throw error;
    }
  },
  
  updateMatchState: async (matchId: string, data: any) => {
    try {
      logger.info('Updating match state', { matchId, data });
      
      // Update match state in Supabase
      const result = await (supabaseService as any).updateMatch(matchId, data);
      
      return result;
    } catch (error: any) {
      logger.error('Update match state error', error);
      throw error;
    }
  },
  
  startMatch: async (matchId: string) => {
    try {
      logger.info('Starting match', { matchId });
      
      const result = await liveService.updateMatchState(matchId, { 
        status: 'live',
        startTime: new Date()
      });
      
      return result;
    } catch (error: any) {
      logger.error('Start match error', error);
      throw error;
    }
  },
  
  pauseMatch: async (matchId: string) => {
    try {
      logger.info('Pausing match', { matchId });
      
      const result = await liveService.updateMatchState(matchId, { 
        status: 'paused'
      });
      
      return result;
    } catch (error: any) {
      logger.error('Pause match error', error);
      throw error;
    }
  },
  
  resumeMatch: async (matchId: string) => {
    try {
      logger.info('Resuming match', { matchId });
      
      const result = await liveService.updateMatchState(matchId, { 
        status: 'live'
      });
      
      return result;
    } catch (error: any) {
      logger.error('Resume match error', error);
      throw error;
    }
  },
  
  endMatch: async (matchId: string) => {
    try {
      logger.info('Ending match', { matchId });
      
      const result = await liveService.updateMatchState(matchId, { 
        status: 'finished',
        endTime: new Date()
      });
      
      return result;
    } catch (error: any) {
      logger.error('End match error', error);
      throw error;
    }
  },
  
  // Live Events
  getMatchEvents: async (matchId: string) => {
    try {
      logger.info('Fetching match events', { matchId });
      
      // Get match events from Supabase
      const eventsResult = await supabaseService.getMatchEventsByMatch(matchId);
      
      return eventsResult;
    } catch (error: any) {
      logger.error('Get match events error', error);
      throw error;
    }
  },
  
  addEvent: async (matchId: string, eventData: any) => {
    try {
      logger.info('Adding match event', { matchId, eventData });
      
      // Add event to Supabase
      const result = await (supabaseService as any).createMatchEvent({
        matchId,
        ...eventData,
        timestamp: new Date(),
        createdAt: new Date()
      });
      
      return result;
    } catch (error: any) {
      logger.error('Add event error', error);
      throw error;
    }
  },
  
  updateEvent: async (matchId: string, eventId: string, eventData: any) => {
    try {
      logger.info('Updating match event', { matchId, eventId, eventData });
      
      // Update event in Supabase
      // This would require an update method in supabaseService
      throw new Error('Not implemented: Update event method not available in supabaseService');
    } catch (error: any) {
      logger.error('Update event error', error);
      throw error;
    }
  },
  
  deleteEvent: async (matchId: string, eventId: string) => {
    try {
      logger.info('Deleting match event', { matchId, eventId });
      
      // Delete event from Supabase
      // This would require a delete method in supabaseService
      throw new Error('Not implemented: Delete event method not available in supabaseService');
    } catch (error: any) {
      logger.error('Delete event error', error);
      throw error;
    }
  },
  
  // Commentary
  getCommentary: async (matchId: string) => {
    try {
      logger.info('Fetching commentary', { matchId });
      
      // Get commentary from Supabase
      // This would require a commentary table and method in supabaseService
      return {
        success: true,
        data: []
      };
    } catch (error: any) {
      logger.error('Get commentary error', error);
      throw error;
    }
  },
  
  addCommentary: async (matchId: string, commentaryData: any) => {
    try {
      logger.info('Adding commentary', { matchId, commentaryData });
      
      // Add commentary to Supabase
      // This would require a commentary table and method in supabaseService
      return {
        success: true,
        data: {
          id: Date.now().toString(),
          matchId,
          ...commentaryData,
          timestamp: new Date(),
          createdAt: new Date()
        }
      };
    } catch (error: any) {
      logger.error('Add commentary error', error);
      throw error;
    }
  },
  
  // Live Stats
  getMatchStats: async (matchId: string) => {
    try {
      logger.info('Fetching live match stats', { matchId });
      
      // Get real-time match statistics from the database
      // Calculate current stats based on match events and current state
      
      // Get match details
      const matchResult = await supabaseService.getMatch(matchId);
      if (!matchResult.success) {
        throw new Error('Match not found');
      }
      
      const match = matchResult.data as Match;
      
      // Get match events
      const eventsResult = await supabaseService.getMatchEventsByMatch(matchId);
      if (!eventsResult.success) {
        throw new Error('Failed to fetch match events');
      }
      
      const events = eventsResult.data;
      
      // Calculate real-time statistics
      const homeTeamEvents = events.filter((event: any) => event.teamId === match.home_team_id);
      const awayTeamEvents = events.filter((event: any) => event.teamId === match.away_team_id);
      
      // Calculate goals
      const homeGoals = homeTeamEvents.filter((e: any) => e.eventType === 'goal').length;
      const awayGoals = awayTeamEvents.filter((e: any) => e.eventType === 'goal').length;
      
      // Calculate shots (goals + shots on target + shots off target)
      const homeShots = homeTeamEvents.filter((e: any) => 
        e.eventType === 'goal' || e.eventType === 'shot_on_target' || e.eventType === 'shot_off_target'
      ).length;
      
      const awayShots = awayTeamEvents.filter((e: any) => 
        e.eventType === 'goal' || e.eventType === 'shot_on_target' || e.eventType === 'shot_off_target'
      ).length;
      
      // Calculate approximate possession (simplified calculation)
      const totalEvents = events.length;
      const homePossession = totalEvents > 0 ? 
        Math.round((homeTeamEvents.length / totalEvents) * 100) : 50;
      const awayPossession = 100 - homePossession;
      
      return {
        success: true,
        data: {
          matchId,
          homeTeam: {
            goals: homeGoals,
            shots: homeShots,
            possession: homePossession
          },
          awayTeam: {
            goals: awayGoals,
            shots: awayShots,
            possession: awayPossession
          }
        }
      };
    } catch (error: any) {
      logger.error('Get match stats error', error);
      throw error;
    }
  }
};