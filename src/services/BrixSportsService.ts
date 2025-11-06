import { homeEndpoints } from '@/lib/apiEndpoints';
import { APIResponse } from '@/types/api';
import { BrixSportsHomeData, Match, TrackEvent, LiveMatchesResponse, MatchWithEvents, Team, Player, CreateTeamPayload, LiveEvent, CreateTrackEventPayload, TrackResult, UpdateScorePayload, LiveEventPayload } from '@/types/brixsports';
import { databaseService } from '@/lib/databaseService';

class BrixSportsService {
  async getHomeData(options?: { signal?: AbortSignal; authToken?: string }): Promise<APIResponse<BrixSportsHomeData>> {
    try {
      // Fetch data in parallel using databaseService
      const [
        liveFootball,
        upcomingFootball,
        liveBasketball
      ] = await Promise.all([
        databaseService.getMatchesBySport('football'),
        databaseService.getMatchesBySport('football'),
        databaseService.getMatchesBySport('basketball')
      ]);

      // For track events, we'll return an empty array since there's no method in databaseService
      const trackEvents: TrackEvent[] = [];

      // Construct the home data object
      const homeData: BrixSportsHomeData = {
        liveFootball,
        upcomingFootball,
        liveBasketball,
        trackEvents,
        featuredContent: {},
        userStats: {}
      };
      
      return {
        success: true,
        data: homeData
      };
    } catch (error) {
      console.error('Failed to fetch home data:', error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to fetch home data' 
        } 
      };
    }
  }

  async getMatches(
    status: 'all' | 'scheduled' | 'live' | 'completed' = 'all',
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<Match[]>> {
    try {
      let matches: Match[] = [];
      
      const allMatches = await databaseService.getMatches();
      
      if (status === 'all') {
        matches = allMatches;
      } else {
        // Filter matches by status
        matches = allMatches.filter(match => match.status === status);
      }
      
      return {
        success: true,
        data: matches
      };
    } catch (error) {
      console.error(`Failed to fetch matches with status ${status}:`, error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to fetch matches' 
        } 
      };
    }
  }

  async getMatchById(
    id: number,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<MatchWithEvents>> {
    try {
      // Since there's no getMatchById in databaseService, we'll fetch all matches and filter
      const allMatches = await databaseService.getMatches();
      const match = allMatches.find(m => m.id === id);
      
      if (!match) {
        return {
          success: false,
          error: {
            message: 'Match not found'
          }
        };
      }

      const matchWithEvents: MatchWithEvents = {
        ...match,
        events: []
      };

      return {
        success: true,
        data: matchWithEvents
      };
    } catch (error) {
      console.error(`Failed to fetch match with id ${id}:`, error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to fetch match details' 
        } 
      };
    }
  }

  async createTeam(
    payload: CreateTeamPayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<Team>> {
    try {
      // For now, we'll just return a mock response since we don't have team creation in databaseService
      // In a real implementation, you would add this to databaseService
      const mockTeam: Team = {
        id: Date.now(),
        name: payload.name,
        logo_url: payload.logo_url || '',
        founded_year: payload.founded_year || new Date().getFullYear(),
        stadium: payload.stadium || 'Default Stadium',
        city: payload.city || 'Default City',
        country: payload.country || 'Default Country',
        color_primary: payload.color_primary || '#000000',
        color_secondary: payload.color_secondary || '#FFFFFF'
      };
      
      return {
        success: true,
        data: mockTeam
      };
    } catch (error) {
      console.error('Failed to create team:', error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to create team' 
        } 
      };
    }
  }

  async getTeamById(
    id: number,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<{ team: Team, players: Player[] }>> {
    try {
      // For now, we'll just return a mock response since we don't have team fetching in databaseService
      // In a real implementation, you would add this to databaseService
      const mockTeamData = {
        team: {
          id,
          name: 'Team Name',
          logo_url: '',
          founded_year: 1900,
          stadium: 'Default Stadium',
          city: 'Default City',
          country: 'Default Country',
          color_primary: '#000000',
          color_secondary: '#FFFFFF'
        } as Team,
        players: [] as Player[]
      };
      
      return {
        success: true,
        data: mockTeamData
      };
    } catch (error) {
      console.error(`Failed to fetch team with id ${id}:`, error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to fetch team details' 
        } 
      };
    }
  }

  async getMatchesBySport(
    sport: string,
    status: string = 'all',
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<Match[]>> {
    try {
      let matches: Match[] = [];
      
      const allMatches = await databaseService.getMatchesBySport(sport);
      
      if (status === 'all') {
        matches = allMatches;
      } else {
        // Filter matches by status
        matches = allMatches.filter(match => match.status === status);
      }
      
      return {
        success: true,
        data: matches
      };
    } catch (error: unknown) {
      const isAbortError = error instanceof DOMException && error.name === 'AbortError';
      const errorMessage = (error as Error)?.message || `Failed to fetch ${sport} matches`;
      
      // Don't log AbortErrors as they're expected during navigation
      if (!isAbortError) {
        console.error(`Failed to fetch ${sport} matches with status ${status}:`, error);
      }
      
      return { 
        success: false, 
        error: { 
          message: errorMessage,
          isAbortError
        } 
      };
    }
  }
  
  async getLiveMatches(options?: { signal?: AbortSignal; authToken?: string }): Promise<APIResponse<LiveMatchesResponse>> {
    try {
      const liveMatches = await databaseService.getLiveMatches();
      
      // Convert to the expected format
      const response: LiveMatchesResponse = {
        football: liveMatches.football,
        basketball: liveMatches.basketball,
        track: [] // Track events are not supported in databaseService
      };
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Failed to fetch live matches:', error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to fetch live matches' 
        } 
      };
    }
  }
  
  async updateLiveMatchScore(
    matchId: number,
    payload: UpdateScorePayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<Match>> {
    try {
      // For now, we'll just return a mock response since we don't have this in databaseService
      // In a real implementation, you would add this to databaseService
      const mockMatch: Match = {
        id: matchId,
        competition_id: 1,
        home_team_id: 1,
        away_team_id: 2,
        match_date: new Date().toISOString(),
        venue: 'Default Venue',
        status: payload.status || 'live',
        home_score: payload.home_score,
        away_score: payload.away_score,
        current_minute: payload.current_minute || 45,
        period: payload.period || '1H',
        created_at: new Date().toISOString()
      };
      
      return {
        success: true,
        data: mockMatch
      };
    } catch (error) {
      console.error(`Failed to update match score for match ${matchId}:`, error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to update match score' 
        } 
      };
    }
  }
  
  async addLiveEvent(
    payload: LiveEventPayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<LiveEvent>> {
    try {
      // For now, we'll just return a mock response since we don't have this in databaseService
      // In a real implementation, you would add this to databaseService
      const mockEvent: LiveEvent = {
        id: Date.now(),
        match_id: payload.match_id,
        player_id: payload.player_id || 0,
        event_type: payload.event_type || 'goal',
        minute: payload.minute || 45,
        description: payload.description,
        created_at: new Date().toISOString()
      };
      
      return {
        success: true,
        data: mockEvent
      };
    } catch (error) {
      console.error('Failed to add live event:', error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to add live event' 
        } 
      };
    }
  }
  
  async createTrackEvent(
    payload: CreateTrackEventPayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<TrackEvent>> {
    try {
      // For now, we'll just return a mock response since we don't have this in databaseService
      // In a real implementation, you would add this to databaseService
      const mockTrackEvent: TrackEvent = {
        id: Date.now(),
        competition_id: payload.competition_id,
        event_name: payload.event_name,
        event_type: payload.event_type,
        gender: payload.gender,
        scheduled_time: payload.scheduled_time,
        status: 'upcoming'
      };
      
      return {
        success: true,
        data: mockTrackEvent
      };
    } catch (error) {
      console.error('Failed to create track event:', error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to create track event' 
        } 
      };
    }
  }
  
  async updateTrackEventStatus(
    id: number,
    status: string,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<TrackEvent>> {
    try {
      // For now, we'll just return a mock response since we don't have this in databaseService
      // In a real implementation, you would add this to databaseService
      const mockTrackEvent: TrackEvent = {
        id,
        competition_id: 1,
        event_name: 'Track Event',
        event_type: '100m',
        gender: 'male',
        scheduled_time: new Date().toISOString(),
        status
      };
      
      return {
        success: true,
        data: mockTrackEvent
      };
    } catch (error) {
      console.error(`Failed to update track event status for event ${id}:`, error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to update track event status' 
        } 
      };
    }
  }
  
  async getTrackEventById(
    id: number,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<TrackEvent>> {
    try {
      // For now, we'll just return a mock response since we don't have this in databaseService
      // In a real implementation, you would add this to databaseService
      const mockTrackEvent: TrackEvent = {
        id,
        competition_id: 1,
        event_name: 'Track Event',
        event_type: '100m',
        gender: 'male',
        scheduled_time: new Date().toISOString(),
        status: 'upcoming'
      };
      
      return {
        success: true,
        data: mockTrackEvent
      };
    } catch (error) {
      console.error(`Failed to fetch track event with id ${id}:`, error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to fetch track event details' 
        } 
      };
    }
  }

  async getTrackEvents(options?: { signal?: AbortSignal; authToken?: string }): Promise<APIResponse<TrackEvent[]>> {
    try {
      // For now, we'll just return an empty array since we don't have this in databaseService
      // In a real implementation, you would add this to databaseService
      const trackEvents: TrackEvent[] = [];
      
      return {
        success: true,
        data: trackEvents
      };
    } catch (error: unknown) {
      const isAbortError = error instanceof DOMException && error.name === 'AbortError';
      const errorMessage = (error as Error)?.message || 'Failed to fetch track events';
      
      // Don't log AbortErrors as they're expected during navigation
      if (!isAbortError) {
        console.error('Failed to fetch track events:', error);
      }
      
      return { 
        success: false, 
        error: { 
          message: errorMessage,
          isAbortError
        } 
      };
    }
  }
}

export default new BrixSportsService();