import APIService from './APIService';
import { homeEndpoints } from '@/lib/apiEndpoints';
import { APIResponse } from '@/types/api';
import { BrixSportsHomeData, Match, TrackEvent, LiveMatchesResponse } from '@/types/brixsports';

class BrixSportsService {
  async getHomeData(options?: { signal?: AbortSignal; authToken?: string }): Promise<APIResponse<BrixSportsHomeData>> {
    return APIService.request(homeEndpoints.getHomeData, undefined, undefined, options);
  }

  async getMatches(
    status: 'all' | 'scheduled' | 'live' | 'completed' = 'all',
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<Match[]>> {
    try {
      return await APIService.request(
        homeEndpoints.getMatches(status),
        undefined,
        undefined,
        options
      );
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
  ): Promise<APIResponse<import('@/types/brixsports').MatchWithEvents>> {
    try {
      return await APIService.request(
        homeEndpoints.getMatchById(id),
        undefined,
        undefined,
        options
      );
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
    payload: import('@/types/brixsports').CreateTeamPayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<import('@/types/brixsports').Team>> {
    try {
      return await APIService.request(
        homeEndpoints.createTeam,
        payload,
        undefined,
        options
      );
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
  ): Promise<APIResponse<{ team: import('@/types/brixsports').Team, players: import('@/types/brixsports').Player[] }>> {
    try {
      return await APIService.request(
        homeEndpoints.getTeamById(id),
        undefined,
        undefined,
        options
      );
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
  ): Promise<APIResponse<Match[] | TrackEvent[]>> {
    try {
      // Use the proper endpoint with status parameter
      return await APIService.request(
        homeEndpoints.getMatchesBySport(sport, status),
        undefined,
        undefined,
        options
      );
    } catch (error) {
      console.error(`Failed to fetch ${sport} matches with status ${status}:`, error);
      return { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : `Failed to fetch ${sport} matches` 
        } 
      };
    }
  }
  
  async getLiveMatches(options?: { signal?: AbortSignal; authToken?: string }): Promise<APIResponse<LiveMatchesResponse>> {
    try {
      return await APIService.request(
        homeEndpoints.getLiveMatches,
        undefined,
        undefined,
        options
      );
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
    payload: import('@/types/brixsports').UpdateScorePayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<import('@/types/brixsports').Match>> {
    try {
      return await APIService.request(
        homeEndpoints.updateLiveMatchScore(matchId),
        payload,
        undefined,
        options
      );
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
    payload: import('@/types/brixsports').LiveEventPayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<import('@/types/brixsports').LiveEvent>> {
    try {
      return await APIService.request(
        homeEndpoints.addLiveEvent,
        payload,
        undefined,
        options
      );
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
    payload: import('@/types/brixsports').CreateTrackEventPayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<import('@/types/brixsports').TrackEvent>> {
    try {
      return await APIService.request(
        homeEndpoints.createTrackEvent,
        payload,
        undefined,
        options
      );
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
  ): Promise<APIResponse<import('@/types/brixsports').TrackEvent>> {
    try {
      return await APIService.request(
        homeEndpoints.updateTrackEventStatus(id),
        { status },
        undefined,
        options
      );
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
  ): Promise<APIResponse<import('@/types/brixsports').TrackEvent>> {
    try {
      return await APIService.request(
        homeEndpoints.getTrackEventById(id),
        undefined,
        undefined,
        options
      );
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
}

export default new BrixSportsService();