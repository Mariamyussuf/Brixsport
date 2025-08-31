// API Service for BrixSports
// Handles interactions with the backend API endpoints

import { TokenManager } from '../hooks/useAuth';
import { API_BASE_URL } from './apiConfig';

// Request headers
const getHeaders = () => {
  const token = TokenManager.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Generic request function
const fetchAPI = async (endpoint: string, options: RequestInit & { params?: any } = {}) => {
  try {
    // Extract params if provided
    const { params, ...fetchOptions } = options;
    
    // Build URL with query parameters if they exist
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }
    }
    
    const headers = getHeaders();
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...headers,
        ...fetchOptions.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Competition endpoints
export const CompetitionsAPI = {
  getAll: () => fetchAPI('/competitions'),
  getById: (id: string) => fetchAPI(`/competitions/${id}`),
  create: (competitionData: any) => fetchAPI('/competitions', {
    method: 'POST',
    body: JSON.stringify(competitionData)
  })
};

// Favorites endpoints
export const FavoritesAPI = {
  getAll: () => fetchAPI('/favorites'),
  add: (itemData: any) => fetchAPI('/favorites', {
    method: 'POST',
    body: JSON.stringify(itemData)
  }),
  remove: (itemData: any) => fetchAPI('/favorites', {
    method: 'DELETE',
    body: JSON.stringify(itemData)
  })
};

// Home endpoints
export const HomeAPI = {
  getHomeData: () => fetchAPI('/home'),
  getMatchesBySport: (sport: string) => fetchAPI(`/home/matches/${sport}`)
};

// Live Updates endpoints
export const LiveUpdatesAPI = {
  getLiveMatches: () => fetchAPI('/live/matches'),
  updateMatchScore: (id: string, scoreData: any) => fetchAPI(`/live/matches/${id}/score`, {
    method: 'PATCH',
    body: JSON.stringify(scoreData)
  }),
  addMatchEvent: (eventData: any) => fetchAPI('/live/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  })
};

// Matches endpoints
export const MatchesAPI = {
  getAll: (filters?: any) => fetchAPI('/matches', {
    method: 'GET',
    params: filters
  }),
  getById: (id: string) => fetchAPI(`/matches/${id}`),
  create: (matchData: any) => fetchAPI('/matches', {
    method: 'POST',
    body: JSON.stringify(matchData)
  })
};

// Teams endpoints
export const TeamsAPI = {
  getAll: () => fetchAPI('/teams'),
  getById: (id: string) => fetchAPI(`/teams/${id}`),
  create: (teamData: any) => fetchAPI('/teams', {
    method: 'POST',
    body: JSON.stringify(teamData)
  })
};

// Track Events endpoints
export const TrackEventsAPI = {
  getFixtures: () => fetchAPI('/track/fixtures'),
  create: (eventData: any) => fetchAPI('/track/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  }),
  updateStatus: (id: string, statusData: any) => fetchAPI(`/track/events/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(statusData)
  })
};

// Interface for Competition
export interface Competition {
  id: string;
  name: string;
  type: string; // e.g., 'football', 'basketball', 'track'
  category: string; // e.g., 'inter-team', 'school', 'inter-college', 'engineering', 'friendly'
  status: string; // e.g., 'active', 'completed', 'upcoming'
  start_date?: string;
  end_date?: string;
  created_at: string;
  location?: string;
  description?: string;
  teams?: string[];
  image?: string;
}

// Interface for Favorite item
export interface FavoriteItem {
  id: string;
  type: 'team' | 'player' | 'competition';
  name: string;
  image?: string;
}

// Interface for Match
export interface Match {
  id: string;
  name: string;
  date: string;
  location: string;
  homeTeam: string;
  awayTeam: string;
  status: 'scheduled' | 'live' | 'completed';
  events?: TrackEvent[];
}

// Interface for LiveMatch
export interface LiveMatch extends Match {
  homeScore: number;
  awayScore: number;
  currentTime: string;
  period: string;
}

// Interface for LiveEvent
export interface LiveEvent {
  id: string;
  matchId: string;
  type: string;
  time: string;
  teamId: string;
  playerId?: string;
  description?: string;
}

// Interface for Team
export interface Team {
  id: string;
  name: string;
  logo?: string;
  coach?: string;
  players?: Player[];
}

// Interface for Player
export interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  image?: string;
}

// Interface for Track Event
export interface TrackEvent {
  id: string;
  type: string;
  timestamp: string;
  matchId: string;
  playerId?: string;
  teamId: string;
  details?: any;
  status: 'pending' | 'processed' | 'synced';
}

// Interface for Home Data
export interface HomeData {
  featuredMatches: Match[];
  upcomingMatches: Match[];
  recentResults: Match[];
  announcements?: any[];
}

export default {
  competitions: CompetitionsAPI,
  favorites: FavoritesAPI,
  matches: MatchesAPI,
  teams: TeamsAPI,
  trackEvents: TrackEventsAPI,
  home: HomeAPI,
  liveUpdates: LiveUpdatesAPI
};