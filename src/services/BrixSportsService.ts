import { homeEndpoints } from '@/lib/apiEndpoints';
import { APIResponse } from '@/types/api';
import { BrixSportsHomeData, Match, TrackEvent, LiveMatchesResponse } from '@/types/brixsports';
import { databaseService } from '@/lib/databaseService';

// Backend API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const API_V1_URL = `${API_BASE_URL}/v1`;

// Helper function to make authenticated API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  const response = await fetch(`${API_V1_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

class BrixSportsService {
  async getHomeData(options?: { signal?: AbortSignal; authToken?: string }): Promise<APIResponse<BrixSportsHomeData>> {
    try {
      // Fetch data in parallel
      const [
        liveFootballRes,
        upcomingFootballRes,
        liveBasketballRes,
        trackEventsRes
      ] = await Promise.all([
        this.getMatchesBySport('football', 'live', options),
        this.getMatchesBySport('football', 'scheduled', options),
        this.getMatchesBySport('basketball', 'live', options),
        this.getTrackEvents(options)
      ]);

      // Type assertion to handle the union type
      const liveFootball = liveFootballRes.success ? liveFootballRes.data as Match[] : [];
      const upcomingFootball = upcomingFootballRes.success ? upcomingFootballRes.data as Match[] : [];
      const liveBasketball = liveBasketballRes.success ? liveBasketballRes.data as Match[] : [];
      const trackEvents = trackEventsRes.success ? trackEventsRes.data as TrackEvent[] : [];

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
      const endpoint = status === 'all' ? '/matches' : `/matches?status=${status}`;
      const response = await apiCall(endpoint);
      
      return {
        success: true,
        data: response.data || []
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
  ): Promise<APIResponse<import('@/types/brixsports').MatchWithEvents>> {
    try {
      const response = await apiCall(`/matches/${id}`);
      
      if (!response.data) {
        return {
          success: false,
          error: {
            message: 'Match not found'
          }
        };
      }

      return {
        success: true,
        data: response.data
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
    payload: import('@/types/brixsports').CreateTeamPayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<import('@/types/brixsports').Team>> {
    try {
      const response = await apiCall('/teams', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      return {
        success: true,
        data: response.data
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
  ): Promise<APIResponse<{ team: import('@/types/brixsports').Team, players: import('@/types/brixsports').Player[] }>> {
    try {
      const response = await apiCall(`/teams/${id}`);
      
      return {
        success: true,
        data: response.data
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
  ): Promise<APIResponse<Match[] | TrackEvent[]>> {
    try {
      const params = new URLSearchParams({ 
        sport,
        ...(status !== 'all' && { status })
      });
      
      // Clean up empty parameters
      const queryString = params.toString().replace(/=$|=(?=&)/g, '');
      const response = await apiCall(`/matches?${queryString}`, options);
      
      return {
        success: true,
        data: Array.isArray(response) ? response : (response?.data || [])
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
      const response = await apiCall('/live/matches');
      
      return {
        success: true,
        data: response.data || {
          football: [],
          basketball: [],
          track: []
        }
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
    payload: import('@/types/brixsports').UpdateScorePayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<import('@/types/brixsports').Match>> {
    try {
      const response = await apiCall(`/live/matches/${matchId}/score`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      
      return {
        success: true,
        data: response.data
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
    payload: import('@/types/brixsports').LiveEventPayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<import('@/types/brixsports').LiveEvent>> {
    try {
      const response = await apiCall('/live/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      return {
        success: true,
        data: response.data
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
    payload: import('@/types/brixsports').CreateTrackEventPayload,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<import('@/types/brixsports').TrackEvent>> {
    try {
      const response = await apiCall('/track/events', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      return {
        success: true,
        data: response.data
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
  ): Promise<APIResponse<import('@/types/brixsports').TrackEvent>> {
    try {
      const response = await apiCall(`/track/events/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      
      return {
        success: true,
        data: response.data
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
  ): Promise<APIResponse<import('@/types/brixsports').TrackEvent>> {
    try {
      const response = await apiCall(`/track/events/${id}`);
      
      return {
        success: true,
        data: response.data
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
      const response = await apiCall('/track', options);
      return {
        success: true,
        data: Array.isArray(response) ? response : (response?.data || [])
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