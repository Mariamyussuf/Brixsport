import { APIEndpoint } from '@/types/api';
import { BrixSportsHomeData, Match, TrackEvent } from '@/types/brixsports';

// Data transformation function for match data
const transformMatchData = (data: any): Match => ({
  id: data.id,
  competition_id: data.competition_id,
  home_team_id: data.home_team_id,
  away_team_id: data.away_team_id,
  match_date: data.match_date,
  venue: data.venue,
  status: data.status,
  home_score: data.home_score,
  away_score: data.away_score,
  current_minute: data.current_minute,
  period: data.period
});

// Data transformation function for track event data
const transformTrackEventData = (data: any): TrackEvent => ({
  id: data.id,
  competition_id: data.competition_id,
  event_name: data.event_name,
  event_type: data.event_type,
  gender: data.gender,
  scheduled_time: data.scheduled_time,
  status: data.status
});

// Data transformation function for home data
const transformHomeData = (data: any): BrixSportsHomeData => ({
  liveFootball: Array.isArray(data.liveFootball)
    ? data.liveFootball.map(transformMatchData)
    : [],
  liveBasketball: Array.isArray(data.liveBasketball)
    ? data.liveBasketball.map(transformMatchData)
    : [],
  trackEvents: Array.isArray(data.trackEvents)
    ? data.trackEvents.map(transformTrackEventData)
    : [],
  // Provide safe defaults for fields that may be missing from the upstream
  // API so TypeScript consumers have a stable shape to work with.
  upcomingFootball: Array.isArray(data.upcomingFootball)
    ? data.upcomingFootball.map(transformMatchData)
    : [],
  featuredContent: data.featuredContent || { title: '', description: '', image: '' },
  userStats: data.userStats || { favoriteTeams: 0, followedCompetitions: 0, upcomingMatches: 0 },
});

// Wrapper interface for live matches response
export interface LiveMatchesResponse {
  football: Match[];
  basketball: Match[];
  track: TrackEvent[];
}

export const homeEndpoints = {
  getHomeData: {
    url: '/home',
    method: 'GET',
    transform: transformHomeData,
  } as APIEndpoint<BrixSportsHomeData>,

  getMatches: (status?: string) => ({
    url: status ? `/matches?status=${status}` : '/matches',
    method: 'GET',
    transform: (data: any) => {
      // Handle the response format from the API
      if (data.success && data.data) {
        return Array.isArray(data.data) ? data.data.map(transformMatchData) : [];
      }
      // Handle direct array response
      if (Array.isArray(data)) {
        return data.map(transformMatchData);
      }
      // Empty array fallback
      return [];
    },
  } as APIEndpoint<Match[]>),
  
  getMatchById: (id: number) => ({
    url: `/matches/${id}`,
    method: 'GET',
    transform: (data: any) => {
      // Handle the response format from the API
      if (data.success && data.data) {
        // Transform the match data
        const matchData = transformMatchData(data.data);
        // Transform events if they exist
        const events = Array.isArray(data.data.events) 
          ? data.data.events.map((event: any) => ({
              id: event.id,
              match_id: event.match_id,
              player_id: event.player_id,
              event_type: event.event_type,
              minute: event.minute,
              description: event.description,
              created_at: event.created_at
            }))
          : [];
        
        return {
          ...matchData,
          events,
          home_team_name: data.data.home_team_name,
          home_team_logo: data.data.home_team_logo,
          away_team_name: data.data.away_team_name,
          away_team_logo: data.data.away_team_logo,
          competition_name: data.data.competition_name
        } as import('@/types/brixsports').MatchWithEvents;
      }
      throw new Error(data.error?.message || 'Failed to fetch match details');
    },
  } as APIEndpoint<import('@/types/brixsports').MatchWithEvents>),
  
  createTeam: {
    url: '/teams',
    method: 'POST',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as import('@/types/brixsports').Team;
      }
      throw new Error(data.error?.message || 'Failed to create team');
    },
  } as APIEndpoint<import('@/types/brixsports').Team>,
  
  getTeamById: (id: number) => ({
    url: `/teams/${id}`,
    method: 'GET',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as { 
          team: import('@/types/brixsports').Team, 
          players: import('@/types/brixsports').Player[] 
        };
      }
      throw new Error(data.error?.message || 'Failed to fetch team details');
    },
  } as APIEndpoint<{ 
    team: import('@/types/brixsports').Team, 
    players: import('@/types/brixsports').Player[] 
  }>),
  
  getMatchesBySport: (sport: string, status?: string) => ({
    url: status ? `/home/matches/${sport}?status=${status}` : `/home/matches/${sport}`,
    method: 'GET',
    transform: (data: any) => {
      // Handle the response format from the API
      if (data.success && data.data) {
        // Check if data is TrackEvent[] or Match[] based on sport
        if (sport === 'track') {
          return Array.isArray(data.data) ? data.data.map(transformTrackEventData) : [];
        } else {
          return Array.isArray(data.data) ? data.data.map(transformMatchData) : [];
        }
      }
      if (Array.isArray(data)) {
        if (sport === 'track') {
          return data.map(transformTrackEventData);
        } else {
          return data.map(transformMatchData);
        }
      }
      return [];
    },
  } as APIEndpoint<Match[] | TrackEvent[]>),
  
  getLiveMatches: {
    url: '/live/matches',
    method: 'GET',
    transform: (data: any) => {
      if (data.success && data.data) {
        return {
          football: Array.isArray(data.data.football) ? data.data.football.map(transformMatchData) : [],
          basketball: Array.isArray(data.data.basketball) ? data.data.basketball.map(transformMatchData) : [],
          track: Array.isArray(data.data.track) ? data.data.track.map(transformTrackEventData) : []
        };
      }
      // Empty groups fallback
      return {
        football: [],
        basketball: [],
        track: []
      };
    },
  } as APIEndpoint<LiveMatchesResponse>,
  
  updateLiveMatchScore: (matchId: number) => ({
    url: `/live/matches/${matchId}/score`,
    method: 'PATCH',
    transform: (data: any) => {
      if (data.success && data.data) {
        return transformMatchData(data.data);
      }
      throw new Error(data.error?.message || 'Failed to update match score');
    },
  } as APIEndpoint<Match>),
  
  addLiveEvent: {
    url: '/live/events',
    method: 'POST',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as import('@/types/brixsports').LiveEvent;
      }
      throw new Error(data.error?.message || 'Failed to add live event');
    },
  } as APIEndpoint<import('@/types/brixsports').LiveEvent>,
  
  createTrackEvent: {
    url: '/track/events',
    method: 'POST',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as import('@/types/brixsports').TrackEvent;
      }
      throw new Error(data.error?.message || 'Failed to create track event');
    },
  } as APIEndpoint<import('@/types/brixsports').TrackEvent>,
  
  updateTrackEventStatus: (id: number) => ({
    url: `/track/events/${id}/status`,
    method: 'PATCH',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as import('@/types/brixsports').TrackEvent;
      }
      throw new Error(data.error?.message || 'Failed to update track event status');
    },
  } as APIEndpoint<import('@/types/brixsports').TrackEvent>),
  
  getTrackEventById: (id: number) => ({
    url: `/track/events/${id}`,
    method: 'GET',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as import('@/types/brixsports').TrackEvent;
      }
      throw new Error(data.error?.message || 'Failed to fetch track event details');
    },
  } as APIEndpoint<import('@/types/brixsports').TrackEvent>),
};