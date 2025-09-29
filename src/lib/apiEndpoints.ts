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

// User interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

export interface NotificationSettings {
  enabled: boolean;
  importantOnly: boolean;
  quietHours?: {
    start: string;
    end: string;
  };
  followedTeams: string[];
  followedPlayers: string[];
  followedCompetitions: string[];
  deliveryMethods: {
    push: boolean;
    inApp: boolean;
    email: boolean;
  };
}

export const userEndpoints = {
  // Auth endpoints
  signup: {
    url: '/auth/signup',
    method: 'POST',
    transform: (data: any) => {
      if (data.success && data.data) {
        return {
          user: data.data.user,
          token: data.data.token,
          refreshToken: data.data.refreshToken
        };
      }
      throw new Error(data.error?.message || 'Failed to sign up');
    },
  } as APIEndpoint<{ user: User; token: string; refreshToken: string }>,

  login: {
    url: '/auth/login',
    method: 'POST',
    transform: (data: any) => {
      if (data.success && data.data) {
        return {
          user: data.data.user,
          token: data.data.token,
          refreshToken: data.data.refreshToken
        };
      }
      throw new Error(data.error?.message || 'Failed to log in');
    },
  } as APIEndpoint<{ user: User; token: string; refreshToken: string }>,

  refreshToken: {
    url: '/auth/refresh',
    method: 'POST',
    transform: (data: any) => {
      if (data.success && data.data) {
        return {
          token: data.data.token,
          refreshToken: data.data.refreshToken
        };
      }
      throw new Error(data.error?.message || 'Failed to refresh token');
    },
  } as APIEndpoint<{ token: string; refreshToken: string }>,

  logout: {
    url: '/auth/logout',
    method: 'POST',
    transform: (data: any) => {
      if (data.success) {
        return { success: true };
      }
      throw new Error(data.error?.message || 'Failed to log out');
    },
  } as APIEndpoint<{ success: boolean }>,

  logoutAll: {
    url: '/auth/logout-all',
    method: 'POST',
    transform: (data: any) => {
      if (data.success) {
        return { success: true };
      }
      throw new Error(data.error?.message || 'Failed to log out all sessions');
    },
  } as APIEndpoint<{ success: boolean }>,

  forgotPassword: {
    url: '/auth/forgot-password',
    method: 'POST',
    transform: (data: any) => {
      if (data.success) {
        return { success: true };
      }
      throw new Error(data.error?.message || 'Failed to send password reset instructions');
    },
  } as APIEndpoint<{ success: boolean }>,

  resetPassword: {
    url: '/auth/reset-password',
    method: 'POST',
    transform: (data: any) => {
      if (data.success) {
        return { success: true };
      }
      throw new Error(data.error?.message || 'Failed to reset password');
    },
  } as APIEndpoint<{ success: boolean }>,

  changePassword: {
    url: '/auth/change-password',
    method: 'POST',
    transform: (data: any) => {
      if (data.success) {
        return { success: true };
      }
      throw new Error(data.error?.message || 'Failed to change password');
    },
  } as APIEndpoint<{ success: boolean }>,

  // User profile endpoints
  getCurrentUser: {
    url: '/user/profile',
    method: 'GET',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as User;
      }
      throw new Error(data.error?.message || 'Failed to fetch user profile');
    },
  } as APIEndpoint<User>,

  updateProfile: {
    url: '/user/profile',
    method: 'PUT',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as User;
      }
      throw new Error(data.error?.message || 'Failed to update profile');
    },
  } as APIEndpoint<User>,

  uploadProfilePicture: {
    url: '/user/profile/picture',
    method: 'POST',
    transform: (data: any) => {
      if (data.success && data.data) {
        return { avatar: data.data.avatar };
      }
      throw new Error(data.error?.message || 'Failed to upload profile picture');
    },
  } as APIEndpoint<{ avatar: string }>,

  removeProfilePicture: {
    url: '/user/profile/picture',
    method: 'DELETE',
    transform: (data: any) => {
      if (data.success && data.data) {
        return { avatar: data.data.avatar };
      }
      throw new Error(data.error?.message || 'Failed to remove profile picture');
    },
  } as APIEndpoint<{ avatar: string | null }>,

  // User preferences endpoints
  getPreferences: {
    url: '/user/preferences',
    method: 'GET',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as UserPreferences;
      }
      throw new Error(data.error?.message || 'Failed to fetch preferences');
    },
  } as APIEndpoint<UserPreferences>,

  updatePreferences: {
    url: '/user/preferences',
    method: 'PUT',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as UserPreferences;
      }
      throw new Error(data.error?.message || 'Failed to update preferences');
    },
  } as APIEndpoint<UserPreferences>,

  // Notification settings endpoints
  getNotificationSettings: {
    url: '/user/notifications',
    method: 'GET',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as NotificationSettings;
      }
      throw new Error(data.error?.message || 'Failed to fetch notification settings');
    },
  } as APIEndpoint<NotificationSettings>,

  updateNotificationSettings: {
    url: '/user/notifications',
    method: 'PUT',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as NotificationSettings;
      }
      throw new Error(data.error?.message || 'Failed to update notification settings');
    },
  } as APIEndpoint<NotificationSettings>,
};

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

export const playerEndpoints = {
  // GET /api/players - Retrieve a list of players with pagination and filtering
  getPlayers: (params?: import('@/types/brixsports').PlayerListParams) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `/players?${queryString}` : '/players';
    
    return {
      url,
      method: 'GET',
      transform: (data: any) => {
        if (data.success && data.data) {
          return data.data as import('@/types/brixsports').PlayerListResponse;
        }
        throw new Error(data.error?.message || 'Failed to fetch players');
      },
    } as import('@/types/api').APIEndpoint<import('@/types/brixsports').PlayerListResponse>;
  },

  // GET /api/players/:id - Retrieve detailed information about a specific player
  getPlayerById: (id: string) => ({
    url: `/players/${id}`,
    method: 'GET',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as import('@/types/brixsports').Player;
      }
      throw new Error(data.error?.message || 'Failed to fetch player');
    },
  } as import('@/types/api').APIEndpoint<import('@/types/brixsports').Player>),

  // POST /api/players - Create a new player profile
  createPlayer: {
    url: '/players',
    method: 'POST',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as import('@/types/brixsports').Player;
      }
      throw new Error(data.error?.message || 'Failed to create player');
    },
  } as import('@/types/api').APIEndpoint<import('@/types/brixsports').Player>,

  // PUT /api/players/:id - Update an existing player's information
  updatePlayer: (id: string) => ({
    url: `/players/${id}`,
    method: 'PUT',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as import('@/types/brixsports').Player;
      }
      throw new Error(data.error?.message || 'Failed to update player');
    },
  } as import('@/types/api').APIEndpoint<import('@/types/brixsports').Player>),

  // DELETE /api/players/:id - Delete a player profile (soft delete)
  deletePlayer: (id: string) => ({
    url: `/players/${id}`,
    method: 'DELETE',
    transform: (data: any) => {
      if (data.success) {
        return { message: 'Player deleted successfully' };
      }
      throw new Error(data.error?.message || 'Failed to delete player');
    },
  } as import('@/types/api').APIEndpoint<{ message: string }>),

  // GET /api/players/:id/stats - Retrieve career statistics for a player
  getPlayerStats: (id: string) => ({
    url: `/players/${id}/stats`,
    method: 'GET',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as import('@/types/brixsports').CareerStats;
      }
      throw new Error(data.error?.message || 'Failed to fetch player stats');
    },
  } as import('@/types/api').APIEndpoint<import('@/types/brixsports').CareerStats>),

  // PUT /api/players/:id/stats - Update player statistics (admin/organizer only)
  updatePlayerStats: (id: string) => ({
    url: `/players/${id}/stats`,
    method: 'PUT',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as import('@/types/brixsports').CareerStats;
      }
      throw new Error(data.error?.message || 'Failed to update player stats');
    },
  } as import('@/types/api').APIEndpoint<import('@/types/brixsports').CareerStats>),

  // POST /api/players/:id/team - Assign a player to a team
  assignPlayerToTeam: (id: string) => ({
    url: `/players/${id}/team`,
    method: 'POST',
    transform: (data: any) => {
      if (data.success && data.data) {
        return {
          message: 'Player assigned to team successfully',
          player: data.data as import('@/types/brixsports').Player
        };
      }
      throw new Error(data.error?.message || 'Failed to assign player to team');
    },
  } as import('@/types/api').APIEndpoint<{ 
    message: string; 
    player: import('@/types/brixsports').Player 
  }>),

  // DELETE /api/players/:id/team - Remove a player from their current team
  removePlayerFromTeam: (id: string) => ({
    url: `/players/${id}/team`,
    method: 'DELETE',
    transform: (data: any) => {
      if (data.success && data.data) {
        return {
          message: 'Player removed from team successfully',
          player: data.data as import('@/types/brixsports').Player
        };
      }
      throw new Error(data.error?.message || 'Failed to remove player from team');
    },
  } as import('@/types/api').APIEndpoint<{ 
    message: string; 
    player: import('@/types/brixsports').Player 
  }>),

  // GET /api/players/search - Advanced search for players
  searchPlayers: (params?: import('@/types/brixsports').PlayerSearchParams) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `/players/search?${queryString}` : '/players/search';
    
    return {
      url,
      method: 'GET',
      transform: (data: any) => {
        if (data.success && data.data) {
          return data.data as import('@/types/brixsports').PlayerSearchResponse;
        }
        throw new Error(data.error?.message || 'Failed to search players');
      },
    } as import('@/types/api').APIEndpoint<import('@/types/brixsports').PlayerSearchResponse>;
  },
};

// Public search endpoint for authenticated users
export const searchEndpoints = {
  // GET /api/search - Search players, competitions, and teams (Authenticated users)
  globalSearch: (params: import('@/types/brixsports').GlobalSearchParams) => {
    const queryParams = new URLSearchParams();
    queryParams.append('query', params.query);
    
    if (params.types) {
      params.types.forEach(type => queryParams.append('types', type));
    }
    
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `/search?${queryString}` : '/search';
    
    return {
      url,
      method: 'GET',
      transform: (data: any) => {
        if (data.success && data.data) {
          return data.data as import('@/types/brixsports').GlobalSearchResult;
        }
        throw new Error(data.error?.message || 'Failed to perform search');
      },
    } as import('@/types/api').APIEndpoint<import('@/types/brixsports').GlobalSearchResult>;
  },
};

// Admin-only player endpoints
export const adminPlayerEndpoints = {
  // GET /api/admin/players - Retrieve a list of players with pagination and filtering (Admin only)
  getPlayers: (params?: import('@/types/brixsports').PlayerListParams) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `/admin/players?${queryString}` : '/admin/players';
    
    return {
      url,
      method: 'GET',
      transform: (data: any) => {
        if (data.success && data.data) {
          return data.data as import('@/types/brixsports').PlayerListResponse;
        }
        throw new Error(data.error?.message || 'Failed to fetch players');
      },
    } as import('@/types/api').APIEndpoint<import('@/types/brixsports').PlayerListResponse>;
  },

  // GET /api/admin/players/:id - Retrieve detailed information about a specific player (Admin only)
  getPlayerById: (id: string) => ({
    url: `/admin/players/${id}`,
    method: 'GET',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as import('@/types/brixsports').Player;
      }
      throw new Error(data.error?.message || 'Failed to fetch player');
    },
  } as import('@/types/api').APIEndpoint<import('@/types/brixsports').Player>),

  // POST /api/admin/players - Create a new player profile (Admin only)
  createPlayer: {
    url: '/admin/players',
    method: 'POST',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as import('@/types/brixsports').Player;
      }
      throw new Error(data.error?.message || 'Failed to create player');
    },
  } as import('@/types/api').APIEndpoint<import('@/types/brixsports').Player>,

  // PUT /api/admin/players/:id - Update an existing player's information (Admin only)
  updatePlayer: (id: string) => ({
    url: `/admin/players/${id}`,
    method: 'PUT',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as import('@/types/brixsports').Player;
      }
      throw new Error(data.error?.message || 'Failed to update player');
    },
  } as import('@/types/api').APIEndpoint<import('@/types/brixsports').Player>),

  // DELETE /api/admin/players/:id - Delete a player profile (soft delete) (Admin only)
  deletePlayer: (id: string) => ({
    url: `/admin/players/${id}`,
    method: 'DELETE',
    transform: (data: any) => {
      if (data.success) {
        return { message: 'Player deleted successfully' };
      }
      throw new Error(data.error?.message || 'Failed to delete player');
    },
  } as import('@/types/api').APIEndpoint<{ message: string }>),

  // GET /api/admin/players/:id/stats - Retrieve career statistics for a player (Admin only)
  getPlayerStats: (id: string) => ({
    url: `/admin/players/${id}/stats`,
    method: 'GET',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as import('@/types/brixsports').CareerStats;
      }
      throw new Error(data.error?.message || 'Failed to fetch player stats');
    },
  } as import('@/types/api').APIEndpoint<import('@/types/brixsports').CareerStats>),

  // PUT /api/admin/players/:id/stats - Update player statistics (Admin only)
  updatePlayerStats: (id: string) => ({
    url: `/admin/players/${id}/stats`,
    method: 'PUT',
    transform: (data: any) => {
      if (data.success && data.data) {
        return data.data as import('@/types/brixsports').CareerStats;
      }
      throw new Error(data.error?.message || 'Failed to update player stats');
    },
  } as import('@/types/api').APIEndpoint<import('@/types/brixsports').CareerStats>),

  // POST /api/admin/players/:id/team - Assign a player to a team (Admin only)
  assignPlayerToTeam: (id: string) => ({
    url: `/admin/players/${id}/team`,
    method: 'POST',
    transform: (data: any) => {
      if (data.success && data.data) {
        return {
          message: 'Player assigned to team successfully',
          player: data.data as import('@/types/brixsports').Player
        };
      }
      throw new Error(data.error?.message || 'Failed to assign player to team');
    },
  } as import('@/types/api').APIEndpoint<{ 
    message: string; 
    player: import('@/types/brixsports').Player 
  }>),

  // DELETE /api/admin/players/:id/team - Remove a player from their current team (Admin only)
  removePlayerFromTeam: (id: string) => ({
    url: `/admin/players/${id}/team`,
    method: 'DELETE',
    transform: (data: any) => {
      if (data.success && data.data) {
        return {
          message: 'Player removed from team successfully',
          player: data.data as import('@/types/brixsports').Player
        };
      }
      throw new Error(data.error?.message || 'Failed to remove player from team');
    },
  } as import('@/types/api').APIEndpoint<{ 
    message: string; 
    player: import('@/types/brixsports').Player 
  }>),

  // GET /api/admin/players/search - Advanced search for players (Admin only)
  searchPlayers: (params?: import('@/types/brixsports').PlayerSearchParams) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const queryString = queryParams.toString();
    const url = queryString ? `/admin/players/search?${queryString}` : '/admin/players/search';
    
    return {
      url,
      method: 'GET',
      transform: (data: any) => {
        if (data.success && data.data) {
          return data.data as import('@/types/brixsports').PlayerSearchResponse;
        }
        throw new Error(data.error?.message || 'Failed to search players');
      },
    } as import('@/types/api').APIEndpoint<import('@/types/brixsports').PlayerSearchResponse>;
  },
};
