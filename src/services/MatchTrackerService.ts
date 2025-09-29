import { databaseService } from '@/lib/databaseService';
import { Match, MatchEvent, Team as MatchTeam } from '@/types/matchTracker';

class MatchTrackerService {
  async getMatches(): Promise<Match[]> {
    try {
      // Fetch matches from database service
      const dbMatches = await databaseService.getMatches();
      
      // Transform to Match type
      return dbMatches.map(match => ({
        id: match.id.toString(),
        name: `Match ${match.id}`,
        competitionId: match.competition_id.toString(),
        homeTeam: {
          id: match.home_team_id.toString(),
          name: match.home_team_name || `Home Team ${match.home_team_id}`,
          players: []
        },
        awayTeam: {
          id: match.away_team_id.toString(),
          name: match.away_team_name || `Away Team ${match.away_team_id}`,
          players: []
        },
        startTime: match.match_date,
        venue: match.venue || '',
        status: match.status as 'scheduled' | 'live' | 'completed',
        events: [],
        sportType: match.sport || 'football',
        homeScore: match.home_score,
        awayScore: match.away_score,
        date: match.match_date,
        location: match.venue || ''
      }));
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch matches');
    }
  }

  async getMatch(id: string): Promise<Match> {
    try {
      // Fetch matches from database service
      const dbMatches = await databaseService.getMatches();
      const dbMatch = dbMatches.find(m => m.id.toString() === id);
      
      if (!dbMatch) {
        throw new Error('Match not found');
      }
      
      // Transform to Match type
      return {
        id: dbMatch.id.toString(),
        name: `Match ${dbMatch.id}`,
        competitionId: dbMatch.competition_id.toString(),
        homeTeam: {
          id: dbMatch.home_team_id.toString(),
          name: dbMatch.home_team_name || `Home Team ${dbMatch.home_team_id}`,
          players: []
        },
        awayTeam: {
          id: dbMatch.away_team_id.toString(),
          name: dbMatch.away_team_name || `Away Team ${dbMatch.away_team_id}`,
          players: []
        },
        startTime: dbMatch.match_date,
        venue: dbMatch.venue || '',
        status: dbMatch.status as 'scheduled' | 'live' | 'completed',
        events: [],
        sportType: dbMatch.sport || 'football',
        homeScore: dbMatch.home_score,
        awayScore: dbMatch.away_score,
        date: dbMatch.match_date,
        location: dbMatch.venue || ''
      };
    } catch (error) {
      console.error(`Failed to fetch match with id ${id}:`, error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch match');
    }
  }

  async createMatch(data: Partial<Omit<Match, 'id' | 'events' | 'homeTeam' | 'awayTeam'>>): Promise<Match> {
    // For now, return a mock response as this needs backend implementation
    // In a real implementation, this would save to the database service
    return {
      id: Date.now().toString(),
      name: data.name || 'New Match',
      competitionId: data.competitionId || '1',
      homeTeam: {
        id: '1',
        name: 'Home Team',
        players: []
      },
      awayTeam: {
        id: '2',
        name: 'Away Team',
        players: []
      },
      startTime: data.startTime || data.date || new Date().toISOString(),
      venue: data.venue || data.location || '',
      status: data.status || 'scheduled',
      events: [],
      sportType: 'football',
      homeScore: data.homeScore || 0,
      awayScore: data.awayScore || 0,
      date: data.date || data.startTime || new Date().toISOString(),
      location: data.location || data.venue || ''
    };
  }

  async updateMatch(id: string, data: Partial<Omit<Match, 'id' | 'events' | 'homeTeam' | 'awayTeam'>>): Promise<Match> {
    // For now, return a mock response as this needs backend implementation
    // In a real implementation, this would update in the database service
    return {
      id,
      name: data.name || 'Updated Match',
      competitionId: data.competitionId || '1',
      homeTeam: {
        id: '1',
        name: 'Home Team',
        players: []
      },
      awayTeam: {
        id: '2',
        name: 'Away Team',
        players: []
      },
      startTime: data.startTime || data.date || new Date().toISOString(),
      venue: data.venue || data.location || '',
      status: data.status || 'scheduled',
      events: [],
      sportType: 'football',
      homeScore: data.homeScore || 0,
      awayScore: data.awayScore || 0,
      date: data.date || data.startTime || new Date().toISOString(),
      location: data.location || data.venue || ''
    };
  }

  async addEvent(matchId: string, data: Partial<Omit<MatchEvent, 'id'>>): Promise<MatchEvent> {
    // For now, return a mock response as this needs backend implementation
    // In a real implementation, this would save to the database service
    return {
      id: Date.now().toString(),
      type: data.type || 'goal',
      time: new Date().toISOString(),
      teamId: data.teamId || '1',
      playerId: data.playerId || '1',
      period: data.period || 1,
      description: data.description || ''
    };
  }

  async updateEvent(matchId: string, eventId: string, data: Partial<MatchEvent>): Promise<MatchEvent> {
    // For now, return a mock response as this needs backend implementation
    // In a real implementation, this would update in the database service
    return {
      id: eventId,
      type: data.type || 'goal',
      time: new Date().toISOString(),
      teamId: data.teamId || '1',
      playerId: data.playerId || '1',
      period: data.period || 1,
      description: data.description || ''
    };
  }

  async deleteEvent(matchId: string, eventId: string): Promise<void> {
    // For now, return a mock response as this needs backend implementation
    // In a real implementation, this would delete from the database service
    console.log(`Deleted event ${eventId} from match ${matchId}`);
  }

  subscribeToMatch(matchId: string, callback: (message: any) => void): WebSocket {
    // For now, return a mock WebSocket as this needs backend implementation
    // In a real implementation, this would connect to a WebSocket server
    console.log(`Subscribed to match ${matchId}`);
    
    // Create a mock WebSocket object
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

export default new MatchTrackerService();