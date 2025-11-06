import { logger } from '../utils/logger';
import { createClient } from '@supabase/supabase-js';
import { NotFoundError, ValidationError } from './error.handler.service';

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://db.rhtwjgvljbapkfmtuqdq.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const matchService = {
  // List matches by sport with filtering and pagination
  listMatches: async (filters: any = {}) => {
    try {
      logger.info('Listing matches by sport', { filters });
      
      // Set default pagination values
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      
      let query = supabase
        .from('Match')
        .select(`
          *,
          homeTeam:Team!homeTeamId(name, logo),
          awayTeam:Team!awayTeamId(name, logo),
          competition:Competition(name, sportType)
        `);
      
      // Apply sport filter if provided by joining with Competition table
      if (filters.sport) {
        query = query.eq('competition.sportType', filters.sport);
      }
      
      // Apply status filter if provided
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1);
      
      // Order by match date
      query = query.order('scheduled_at', { ascending: true });
      
      const { data, error, count } = await query;
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      // Transform data to match frontend expectations
      const matches = data.map((match: any) => ({
        id: match.id,
        sport: match.competition?.sportType,
        competition_id: match.competitionId,
        home_team_id: match.homeTeamId,
        away_team_id: match.awayTeamId,
        match_date: match.scheduled_at,
        venue: match.venue,
        status: match.status,
        home_score: match.homeScore,
        away_score: match.awayScore,
        current_minute: match.currentMinute || 0,
        period: match.period,
        home_team_name: match.homeTeam?.name,
        home_team_logo: match.homeTeam?.logo,
        away_team_name: match.awayTeam?.name,
        away_team_logo: match.awayTeam?.logo,
        competition_name: match.competition?.name
      }));
      
      return {
        success: true,
        data: matches,
        pagination: {
          limit,
          offset,
          total: count || 0
        }
      };
    } catch (error: any) {
      logger.error('List matches error', { error: error.message, stack: error.stack });
      throw error;
    }
  },
  
  // Get live matches by sport
  getLiveMatches: async (sport?: string) => {
    try {
      logger.info('Fetching live matches by sport', { sport });
      
      let query = supabase
        .from('Match')
        .select(`
          *,
          homeTeam:Team!homeTeamId(name, logo),
          awayTeam:Team!awayTeamId(name, logo),
          competition:Competition(name, sportType)
        `)
        .eq('status', 'live');
      
      // Apply sport filter if provided by joining with Competition table
      if (sport) {
        query = query.eq('competition.sportType', sport);
      }
      
      // Order by match date
      query = query.order('scheduled_at', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      // Group matches by sport type
      const groupedMatches: any = {
        football: [],
        basketball: [],
        track: []
      };
      
      // Transform and group data
      data.forEach((match: any) => {
        const matchData = {
          id: match.id,
          competition_id: match.competitionId,
          home_team_id: match.homeTeamId,
          away_team_id: match.awayTeamId,
          match_date: match.scheduled_at,
          venue: match.venue,
          status: match.status,
          home_score: match.homeScore,
          away_score: match.awayScore,
          current_minute: match.currentMinute || 0,
          period: match.period,
          home_team_name: match.homeTeam?.name,
          home_team_logo: match.homeTeam?.logo,
          away_team_name: match.awayTeam?.name,
          away_team_logo: match.awayTeam?.logo,
          competition_name: match.competition?.name
        };
        
        // Add sport-specific fields
        if (match.competition?.sportType === 'football') {
          groupedMatches.football.push(matchData);
        } else if (match.competition?.sportType === 'basketball') {
          // Add basketball-specific period values
          matchData.period = match.period || 'Q1';
          groupedMatches.basketball.push(matchData);
        } else if (match.competition?.sportType === 'track') {
          // For track events, we need different data structure
          const trackEvent = {
            id: match.id,
            competition_id: match.competitionId,
            event_name: match.eventName || 'Track Event',
            event_type: match.eventType || 'sprint',
            gender: match.gender || 'male',
            scheduled_time: match.scheduled_at,
            status: match.status,
            results: match.results || []
          };
          groupedMatches.track.push(trackEvent);
        }
      });
      
      return {
        success: true,
        data: groupedMatches
      };
    } catch (error: any) {
      logger.error('Get live matches error', { error: error.message, stack: error.stack });
      throw error;
    }
  },
  
  // Get match details
  getMatchDetails: async (id: string) => {
    try {
      logger.info('Fetching match details', { id });
      
      const { data, error } = await supabase
        .from('Match')
        .select(`
          *,
          homeTeam:Team!homeTeamId(name, logo),
          awayTeam:Team!awayTeamId(name, logo),
          competition:Competition(name, sportType)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      if (!data) {
        throw new NotFoundError('Match not found');
      }
      
      // Transform data to match frontend expectations
      const match = {
        id: data.id,
        sport: data.competition?.sportType,
        competition_id: data.competitionId,
        home_team_id: data.homeTeamId,
        away_team_id: data.awayTeamId,
        match_date: data.scheduled_at,
        venue: data.venue,
        status: data.status,
        home_score: data.homeScore,
        away_score: data.awayScore,
        current_minute: data.currentMinute || 0,
        period: data.period,
        home_team_name: data.homeTeam?.name,
        home_team_logo: data.homeTeam?.logo,
        away_team_name: data.awayTeam?.name,
        away_team_logo: data.awayTeam?.logo,
        competition_name: data.competition?.name,
        // Additional match details
        events: data.events || [],
        statistics: data.statistics || {
          possession: {
            home: 0,
            away: 0
          },
          shots: {
            home: 0,
            away: 0
          }
        }
      };
      
      return {
        success: true,
        data: match
      };
    } catch (error: any) {
      logger.error('Get match details error', { error: error.message, stack: error.stack });
      throw error;
    }
  },
  
  // Get football match details with extensions
  getFootballMatchDetails: async (id: string) => {
    try {
      logger.info('Fetching football match details', { id });
      
      const { data, error } = await supabase
        .from('Match')
        .select(`
          *,
          homeTeam:Team!homeTeamId(name, logo),
          awayTeam:Team!awayTeamId(name, logo),
          competition:Competition(name, sportType)
        `)
        .eq('id', id)
        .eq('competition.sportType', 'football')
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      if (!data) {
        throw new NotFoundError('Match not found');
      }
      
      // Transform data to match frontend expectations
      const match = {
        id: data.id,
        sport: data.competition?.sportType,
        competition_id: data.competitionId,
        home_team_id: data.homeTeamId,
        away_team_id: data.awayTeamId,
        match_date: data.scheduled_at,
        venue: data.venue,
        status: data.status,
        home_score: data.homeScore,
        away_score: data.awayScore,
        current_minute: data.currentMinute || 0,
        period: data.period,
        home_team_name: data.homeTeam?.name,
        home_team_logo: data.homeTeam?.logo,
        away_team_name: data.awayTeam?.name,
        away_team_logo: data.awayTeam?.logo,
        competition_name: data.competition?.name,
        // Football-specific extensions
        formation: data.formation || '',
        referee: data.referee || '',
        weather: data.weather || '',
        attendance: data.attendance || 0,
        // Additional match details
        events: data.events || [],
        statistics: data.statistics || {
          possession: {
            home: 0,
            away: 0
          },
          shots: {
            home: 0,
            away: 0
          }
        }
      };
      
      return {
        success: true,
        data: match
      };
    } catch (error: any) {
      logger.error('Get football match details error', { error: error.message, stack: error.stack });
      throw error;
    }
  },
  
  // Get basketball match details with extensions
  getBasketballMatchDetails: async (id: string) => {
    try {
      logger.info('Fetching basketball match details', { id });
      
      const { data, error } = await supabase
        .from('Match')
        .select(`
          *,
          homeTeam:Team!homeTeamId(name, logo),
          awayTeam:Team!awayTeamId(name, logo),
          competition:Competition(name, sportType)
        `)
        .eq('id', id)
        .eq('competition.sportType', 'basketball')
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      if (!data) {
        throw new NotFoundError('Match not found');
      }
      
      // Transform data to match frontend expectations
      const match = {
        id: data.id,
        sport: data.competition?.sportType,
        competition_id: data.competitionId,
        home_team_id: data.homeTeamId,
        away_team_id: data.awayTeamId,
        match_date: data.scheduled_at,
        venue: data.venue,
        status: data.status,
        home_score: data.homeScore,
        away_score: data.awayScore,
        current_minute: data.currentMinute || 0,
        period: data.period || 'Q1',
        home_team_name: data.homeTeam?.name,
        home_team_logo: data.homeTeam?.logo,
        away_team_name: data.awayTeam?.name,
        away_team_logo: data.awayTeam?.logo,
        competition_name: data.competition?.name,
        // Basketball-specific extensions
        quarter: data.quarter || 1,
        quarter_time: data.quarterTime || '12:00',
        fouls_home: data.foulsHome || 0,
        fouls_away: data.foulsAway || 0,
        // Additional match details
        events: data.events || [],
        statistics: data.statistics || {
          possession: {
            home: 0,
            away: 0
          },
          shots: {
            home: 0,
            away: 0
          }
        }
      };
      
      return {
        success: true,
        data: match
      };
    } catch (error: any) {
      logger.error('Get basketball match details error', { error: error.message, stack: error.stack });
      throw error;
    }
  }
};