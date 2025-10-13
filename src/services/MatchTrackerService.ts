import { Match, MatchEvent, Team as MatchTeam } from '@/types/matchTracker';

// Backend API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
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
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

class MatchTrackerService {
  async getMatches(): Promise<Match[]> {
    try {
      // Fetch matches from backend API
      const response = await apiCall('/matches');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch matches');
      }
      
      // Transform to Match type
      return response.data.map((match: any) => ({
        id: match.id.toString(),
        name: match.name || `Match ${match.id}`,
        competitionId: match.competition_id?.toString() || match.competitionId?.toString() || '',
        homeTeam: {
          id: match.home_team_id?.toString() || match.homeTeam?.id?.toString() || '1',
          name: match.home_team_name || match.homeTeam?.name || `Home Team`,
          players: match.homeTeam?.players || []
        },
        awayTeam: {
          id: match.away_team_id?.toString() || match.awayTeam?.id?.toString() || '2',
          name: match.away_team_name || match.awayTeam?.name || `Away Team`,
          players: match.awayTeam?.players || []
        },
        startTime: match.match_date || match.startTime || new Date().toISOString(),
        venue: match.venue || match.location || '',
        status: match.status as 'scheduled' | 'live' | 'completed' || 'scheduled',
        events: match.events || [],
        sportType: match.sport || match.sportType || 'football',
        homeScore: match.home_score || match.homeScore || 0,
        awayScore: match.away_score || match.awayScore || 0,
        date: match.match_date || match.date || match.startTime || new Date().toISOString(),
        location: match.venue || match.location || ''
      }));
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch matches');
    }
  }

  async getMatch(id: string): Promise<Match> {
    try {
      // Fetch match from backend API
      const response = await apiCall(`/matches/${id}`);
      
      if (!response.success) {
        throw new Error(response.message || 'Match not found');
      }
      
      const match = response.data;
      
      // Transform to Match type
      return {
        id: match.id.toString(),
        name: match.name || `Match ${match.id}`,
        competitionId: match.competition_id?.toString() || match.competitionId?.toString() || '',
        homeTeam: {
          id: match.home_team_id?.toString() || match.homeTeam?.id?.toString() || '1',
          name: match.home_team_name || match.homeTeam?.name || `Home Team`,
          players: match.homeTeam?.players || []
        },
        awayTeam: {
          id: match.away_team_id?.toString() || match.awayTeam?.id?.toString() || '2',
          name: match.away_team_name || match.awayTeam?.name || `Away Team`,
          players: match.awayTeam?.players || []
        },
        startTime: match.match_date || match.startTime || new Date().toISOString(),
        venue: match.venue || match.location || '',
        status: match.status as 'scheduled' | 'live' | 'completed' || 'scheduled',
        events: match.events || [],
        sportType: match.sport || match.sportType || 'football',
        homeScore: match.home_score || match.homeScore || 0,
        awayScore: match.away_score || match.awayScore || 0,
        date: match.match_date || match.date || match.startTime || new Date().toISOString(),
        location: match.venue || match.location || ''
      };
    } catch (error) {
      console.error(`Failed to fetch match with id ${id}:`, error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch match');
    }
  }

  async createMatch(data: Partial<Omit<Match, 'id' | 'events' | 'homeTeam' | 'awayTeam'>>): Promise<Match> {
    try {
      const response = await apiCall('/admin/matches', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create match');
      }
      
      const match = response.data;
      
      return {
        id: match.id.toString(),
        name: match.name || 'New Match',
        competitionId: match.competition_id?.toString() || match.competitionId?.toString() || '1',
        homeTeam: {
          id: match.home_team_id?.toString() || match.homeTeam?.id?.toString() || '1',
          name: match.home_team_name || match.homeTeam?.name || 'Home Team',
          players: match.homeTeam?.players || []
        },
        awayTeam: {
          id: match.away_team_id?.toString() || match.awayTeam?.id?.toString() || '2',
          name: match.away_team_name || match.awayTeam?.name || 'Away Team',
          players: match.awayTeam?.players || []
        },
        startTime: match.match_date || match.startTime || new Date().toISOString(),
        venue: match.venue || match.location || '',
        status: match.status as 'scheduled' | 'live' | 'completed' || 'scheduled',
        events: match.events || [],
        sportType: match.sport || match.sportType || 'football',
        homeScore: match.home_score || match.homeScore || 0,
        awayScore: match.away_score || match.awayScore || 0,
        date: match.match_date || match.date || match.startTime || new Date().toISOString(),
        location: match.venue || match.location || ''
      };
    } catch (error) {
      console.error('Create match error:', error);
      throw error;
    }
  }

  async updateMatch(id: string, data: Partial<Omit<Match, 'id' | 'events' | 'homeTeam' | 'awayTeam'>>): Promise<Match> {
    try {
      const response = await apiCall(`/admin/matches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update match');
      }
      
      const match = response.data;
      
      return {
        id: match.id.toString(),
        name: match.name || 'Updated Match',
        competitionId: match.competition_id?.toString() || match.competitionId?.toString() || '1',
        homeTeam: {
          id: match.home_team_id?.toString() || match.homeTeam?.id?.toString() || '1',
          name: match.home_team_name || match.homeTeam?.name || 'Home Team',
          players: match.homeTeam?.players || []
        },
        awayTeam: {
          id: match.away_team_id?.toString() || match.awayTeam?.id?.toString() || '2',
          name: match.away_team_name || match.awayTeam?.name || 'Away Team',
          players: match.awayTeam?.players || []
        },
        startTime: match.match_date || match.startTime || new Date().toISOString(),
        venue: match.venue || match.location || '',
        status: match.status as 'scheduled' | 'live' | 'completed' || 'scheduled',
        events: match.events || [],
        sportType: match.sport || match.sportType || 'football',
        homeScore: match.home_score || match.homeScore || 0,
        awayScore: match.away_score || match.awayScore || 0,
        date: match.match_date || match.date || match.startTime || new Date().toISOString(),
        location: match.venue || match.location || ''
      };
    } catch (error) {
      console.error('Update match error:', error);
      throw error;
    }
  }

  async addEvent(matchId: string, data: Partial<Omit<MatchEvent, 'id'>>): Promise<MatchEvent> {
    try {
      const response = await apiCall(`/matches/${matchId}/events`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to add event');
      }
      
      return response.data;
    } catch (error) {
      console.error('Add event error:', error);
      throw error;
    }
  }

  async updateEvent(matchId: string, eventId: string, data: Partial<MatchEvent>): Promise<MatchEvent> {
    try {
      const response = await apiCall(`/matches/${matchId}/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update event');
      }
      
      return response.data;
    } catch (error) {
      console.error('Update event error:', error);
      throw error;
    }
  }

  async deleteEvent(matchId: string, eventId: string): Promise<void> {
    try {
      const response = await apiCall(`/matches/${matchId}/events/${eventId}`, {
        method: 'DELETE'
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Delete event error:', error);
      throw error;
    }
  }

  subscribeToMatch(matchId: string, callback: (message: any) => void): WebSocket {
    try {
      // Create WebSocket connection to backend
      const wsUrl = `${API_V1_URL.replace('http', 'ws')}/live/${matchId}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          callback(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        callback({ type: 'error', data: error });
      };
      
      return ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
      // Return a mock WebSocket object as fallback
      return {
        close: () => console.log('WebSocket closed'),
        send: (data: string) => console.log('WebSocket send:', data),
        onopen: null,
        onerror: null,
        onclose: null,
        onmessage: null,
        readyState: 0,
        url: '',
        extensions: '',
        protocol: '',
        binaryType: 'blob'
      } as unknown as WebSocket;
    }
  }
}

export default new MatchTrackerService();