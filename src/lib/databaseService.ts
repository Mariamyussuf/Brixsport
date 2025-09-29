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

// Types
interface Team {
  id: number;
  name: string;
  logo?: string;
}

interface Match {
  id: number;
  competition_id: number;
  home_team_id: number;
  away_team_id: number;
  match_date: string;
  venue: string | null;
  status: string; // scheduled, live, completed
  home_score: number;
  away_score: number;
  current_minute: number;
  period: string | null;
  // Optional properties that may be included in some responses
  home_team_name?: string;
  home_team_logo?: string;
  away_team_name?: string;
  away_team_logo?: string;
  competition_name?: string;
  created_at?: string;
  sport?: string;
}

interface Competition {
  id: number;
  name: string;
  type: string;
  category: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface FeaturedContent {
  title: string;
  description: string;
  image: string;
}

interface UserStats {
  favoriteTeams: number;
  followedCompetitions: number;
  upcomingMatches: number;
}

// Logger type
interface Logger {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  assignedCompetitions: string[];
  createdAt: string;
  lastActive: string;
  updatedAt?: string;
}

export class DatabaseService {
  // Logger methods
  async getAllLoggers(): Promise<Logger[]> {
    try {
      const response = await apiCall('/admin/loggers');
      return response.data || [];
    } catch (error) {
      console.error('Error in getAllLoggers:', error);
      // Return empty array as fallback
      return [];
    }
  }

  async getLoggerById(id: string): Promise<Logger | null> {
    try {
      // Validate input
      if (!id) {
        console.error('Invalid logger ID provided');
        return null;
      }
      
      const response = await apiCall(`/admin/loggers/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error in getLoggerById:', error);
      return null;
    }
  }

  async getLoggerByEmail(email: string): Promise<Logger | null> {
    try {
      // Validate input
      if (!email || typeof email !== 'string') {
        console.error('Invalid email provided');
        return null;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error('Invalid email format');
        return null;
      }
      
      const response = await apiCall(`/admin/loggers?email=${encodeURIComponent(email)}`);
      const loggers = response.data || [];
      return loggers.find((logger: Logger) => logger.email === email) || null;
    } catch (error) {
      console.error('Error in getLoggerByEmail:', error);
      return null;
    }
  }

  async createLogger(loggerData: Omit<Logger, 'id' | 'createdAt' | 'lastActive'>): Promise<Logger> {
    try {
      // Validate required fields
      if (!loggerData.name || !loggerData.email) {
        throw new Error('Name and email are required');
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(loggerData.email)) {
        throw new Error('Invalid email format');
      }
      
      const response = await apiCall('/admin/loggers', {
        method: 'POST',
        body: JSON.stringify(loggerData),
      });
      
      return response.data;
    } catch (error) {
      console.error('Error in createLogger:', error);
      throw error;
    }
  }

  async updateLogger(id: string, updates: Partial<Logger>): Promise<Logger | null> {
    try {
      // Validate input
      if (!id) {
        throw new Error('Logger ID is required');
      }
      
      const response = await apiCall(`/admin/loggers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      
      return response.data || null;
    } catch (error) {
      console.error('Error in updateLogger:', error);
      return null;
    }
  }

  async deleteLogger(id: string): Promise<Logger | null> {
    try {
      // Validate input
      if (!id) {
        throw new Error('Logger ID is required');
      }
      
      const response = await apiCall(`/admin/loggers/${id}`, {
        method: 'DELETE',
      });
      
      return response.data || null;
    } catch (error) {
      console.error('Error in deleteLogger:', error);
      return null;
    }
  }

  // Competitions
  async getCompetitions(): Promise<Competition[]> {
    try {
      const response = await apiCall('/competitions');
      return response.data || [];
    } catch (error) {
      console.error('Error in getCompetitions:', error);
      throw (error instanceof Error ? error : new Error('Unknown error in getCompetitions'));
    }
  }

  async getCompetitionById(id: number): Promise<Competition | null> {
    try {
      // Validate input
      if (isNaN(id) || id <= 0) {
        console.error('Invalid competition ID provided');
        return null;
      }
      
      const response = await apiCall(`/competitions/${id}`);
      return response.data || null;
    } catch (error) {
      console.error('Error in getCompetitionById:', error);
      throw (error instanceof Error ? error : new Error('Unknown error in getCompetitionById'));
    }
  }

  // Matches
  async getMatches(): Promise<Match[]> {
    try {
      const response = await apiCall('/matches');
      return response.data || [];
    } catch (error) {
      console.error('Error in getMatches:', error);
      throw (error instanceof Error ? error : new Error('Unknown error in getMatches'));
    }
  }

  async getMatchesByCompetition(competitionId: number): Promise<Match[]> {
    try {
      // Validate input
      if (isNaN(competitionId) || competitionId <= 0) {
        throw new Error('Invalid competition ID');
      }
      
      const response = await apiCall(`/matches?competition_id=${competitionId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error in getMatchesByCompetition:', error);
      throw (error instanceof Error ? error : new Error('Unknown error in getMatchesByCompetition'));
    }
  }

  // Additional match methods
  async getMatchesBySport(sport: string): Promise<Match[]> {
    try {
      // Validate input
      if (!sport || typeof sport !== 'string') {
        throw new Error('Invalid sport parameter');
      }
      
      const response = await apiCall(`/matches?sport=${encodeURIComponent(sport)}`);
      return response.data || [];
    } catch (error) {
      console.error('Error in getMatchesBySport:', error);
      throw (error instanceof Error ? error : new Error('Unknown error in getMatchesBySport'));
    }
  }

  async getLiveMatches(): Promise<{ football: Match[]; basketball: Match[]; track: Match[] }> {
    try {
      const response = await apiCall('/live/matches');
      return response.data || {
        football: [],
        basketball: [],
        track: []
      };
    } catch (error) {
      console.error('Error in getLiveMatches:', error);
      throw (error instanceof Error ? error : new Error('Unknown error in getLiveMatches'));
    }
  }

  // Teams
  async getTeams(): Promise<Team[]> {
    try {
      const response = await apiCall('/teams');
      return response.data || [];
    } catch (error) {
      console.error('Error in getTeams:', error);
      throw (error instanceof Error ? error : new Error('Unknown error in getTeams'));
    }
  }

  // Featured content and user stats
  async getFeaturedContent(): Promise<FeaturedContent> {
    try {
      const response = await apiCall('/media/featured');
      return response.data || {
        title: 'Featured Event',
        description: 'Check out this exciting event',
        image: '/images/featured.jpg'
      };
    } catch (error) {
      console.error('Error in getFeaturedContent:', error);
      throw (error instanceof Error ? error : new Error('Unknown error in getFeaturedContent'));
    }
  }

  async getUpcomingMatches(userId: string): Promise<Match[]> {
    try {
      // Validate input
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
      }
      
      const response = await apiCall(`/users/${userId}/upcoming-matches`);
      return response.data || [];
    } catch (error) {
      console.error('Error in getUpcomingMatches:', error);
      throw (error instanceof Error ? error : new Error('Unknown error in getUpcomingMatches'));
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Validate input
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
      }
      
      const response = await apiCall(`/users/${userId}/stats`);
      return response.data || {
        favoriteTeams: 0,
        followedCompetitions: 0,
        upcomingMatches: 0
      };
    } catch (error) {
      console.error('Error in getUserStats:', error);
      throw (error instanceof Error ? error : new Error('Unknown error in getUserStats'));
    }
  }

  // Logger data submission methods
  async saveMatchEvents(events: any[], userId: string): Promise<void> {
    try {
      // Validate input
      if (!Array.isArray(events)) {
        throw new Error('Events must be an array');
      }
      
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
      }
      
      await apiCall('/live/events', {
        method: 'POST',
        body: JSON.stringify({ events, userId }),
      });
    } catch (error) {
      console.error('Error in saveMatchEvents:', error);
      throw error;
    }
  }

  async updateMatchScores(scores: any[], userId: string): Promise<void> {
    try {
      // Validate input
      if (!Array.isArray(scores)) {
        throw new Error('Scores must be an array');
      }
      
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
      }
      
      await apiCall('/matches/scores', {
        method: 'PATCH',
        body: JSON.stringify({ scores, userId }),
      });
    } catch (error) {
      console.error('Error in updateMatchScores:', error);
      throw error;
    }
  }

  async logUserActivity(userId: string, activity: string, data: any): Promise<void> {
    try {
      // Validate input
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
      }
      
      if (!activity || typeof activity !== 'string') {
        throw new Error('Invalid activity parameter');
      }
      
      await apiCall('/user-activity', {
        method: 'POST',
        body: JSON.stringify({ userId, activity, data }),
      });
    } catch (error) {
      console.error('Error in logUserActivity:', error);
      throw error;
    }
  }

}

// Export a singleton instance
export const databaseService = new DatabaseService();

// Export dbService as an alias for backward compatibility
export const dbService = databaseService;