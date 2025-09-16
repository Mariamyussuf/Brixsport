// Database Service
// This service will handle all database operations for the application
// Implementation uses in-memory storage for offline-first PWA functionality

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

// In-memory storage for our data
class InMemoryStorage {
  private matches: Match[] = [
    {
      id: 1,
      competition_id: 101,
      home_team_id: 1,
      away_team_id: 2,
      match_date: new Date().toISOString(),
      venue: "Stadium 1",
      status: 'live',
      home_score: 2,
      away_score: 1,
      current_minute: 45,
      period: "HT",
      sport: 'football'
    },
    {
      id: 2,
      competition_id: 102,
      home_team_id: 3,
      away_team_id: 4,
      match_date: new Date().toISOString(),
      venue: "Stadium 2",
      status: 'live',
      home_score: 0,
      away_score: 0,
      current_minute: 23,
      period: "1H",
      sport: 'football'
    },
    {
      id: 3,
      competition_id: 103,
      home_team_id: 5,
      away_team_id: 6,
      match_date: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      venue: "Arena 1",
      status: 'scheduled',
      home_score: 0,
      away_score: 0,
      current_minute: 0,
      period: null,
      sport: 'basketball'
    },
    {
      id: 4,
      competition_id: 104,
      home_team_id: 7,
      away_team_id: 8,
      match_date: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
      venue: "Arena 2",
      status: 'scheduled',
      home_score: 0,
      away_score: 0,
      current_minute: 0,
      period: null,
      sport: 'basketball'
    },
    {
      id: 5,
      competition_id: 201,
      home_team_id: 10,
      away_team_id: 11,
      match_date: new Date().toISOString(),
      venue: "Court 1",
      status: 'live',
      home_score: 78,
      away_score: 75,
      current_minute: 38,
      period: "2H",
      sport: 'basketball'
    },
    {
      id: 6,
      competition_id: 202,
      home_team_id: 12,
      away_team_id: 13,
      match_date: new Date(Date.now() + 3600000).toISOString(),
      venue: "Court 2",
      status: 'scheduled',
      home_score: 0,
      away_score: 0,
      current_minute: 0,
      period: null,
      sport: 'basketball'
    },
    {
      id: 7,
      competition_id: 301,
      home_team_id: 15,
      away_team_id: 16,
      match_date: new Date().toISOString(),
      venue: "Track Field",
      status: 'live',
      home_score: 0,
      away_score: 0,
      current_minute: 0,
      period: null,
      sport: 'track'
    },
    {
      id: 8,
      competition_id: 302,
      home_team_id: 17,
      away_team_id: 18,
      match_date: new Date(Date.now() + 7200000).toISOString(),
      venue: "Track Field",
      status: 'scheduled',
      home_score: 0,
      away_score: 0,
      current_minute: 0,
      period: null,
      sport: 'track'
    }
  ];

  private competitions: Competition[] = [
    {
      id: 1,
      name: 'Fall Championship',
      type: 'football',
      category: 'school',
      status: 'ongoing',
      start_date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      end_date: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days from now
      created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      id: 2,
      name: 'Winter Cup',
      type: 'basketball',
      category: 'inter-team',
      status: 'upcoming',
      start_date: new Date(Date.now() + 86400000 * 7).toISOString(), // 1 week from now
      end_date: new Date(Date.now() + 86400000 * 37).toISOString(), // 37 days from now
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Spring Tournament',
      type: 'track',
      category: 'school',
      status: 'upcoming',
      start_date: new Date(Date.now() + 86400000 * 60).toISOString(), // 2 months from now
      end_date: new Date(Date.now() + 86400000 * 67).toISOString(), // 2 months and 1 week from now
      created_at: new Date().toISOString()
    }
  ];

  private loggers: Logger[] = [
    {
      id: 'logger1',
      name: 'John Logger',
      email: 'john.logger@example.com',
      role: 'logger',
      status: 'active',
      assignedCompetitions: ['comp1', 'comp2'],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'logger2',
      name: 'Jane Logger',
      email: 'jane.logger@example.com',
      role: 'logger',
      status: 'inactive',
      assignedCompetitions: ['comp3'],
      createdAt: new Date().toISOString(),
      lastActive: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updatedAt: new Date().toISOString()
    },
    {
      id: 'logger3',
      name: 'Bob Logger',
      email: 'bob.logger@example.com',
      role: 'logger',
      status: 'online',
      assignedCompetitions: ['comp1', 'comp4'],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  private featuredContent: FeaturedContent = {
    title: "Championship Finals This Weekend",
    description: "Don't miss the biggest matches of the season!",
    image: "/featured-match.jpg"
  };

  // Getters
  getMatches(): Match[] {
    return this.matches;
  }

  getCompetitions(): Competition[] {
    return this.competitions;
  }

  getLoggers(): Logger[] {
    return this.loggers;
  }

  getFeaturedContent(): FeaturedContent {
    return this.featuredContent;
  }

  // Match operations
  addMatch(match: Match): void {
    this.matches.push(match);
  }

  updateMatch(id: number, updates: Partial<Match>): boolean {
    const index = this.matches.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.matches[index] = { ...this.matches[index], ...updates };
    return true;
  }

  deleteMatch(id: number): boolean {
    const index = this.matches.findIndex(m => m.id === id);
    if (index === -1) return false;
    
    this.matches.splice(index, 1);
    return true;
  }

  // Competition operations
  addCompetition(competition: Competition): void {
    this.competitions.push(competition);
  }

  updateCompetition(id: number, updates: Partial<Competition>): boolean {
    const index = this.competitions.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    this.competitions[index] = { ...this.competitions[index], ...updates };
    return true;
  }

  deleteCompetition(id: number): boolean {
    const index = this.competitions.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    this.competitions.splice(index, 1);
    return true;
  }

  // Logger operations
  addLogger(logger: Logger): void {
    this.loggers.push(logger);
  }

  updateLogger(id: string, updates: Partial<Logger>): boolean {
    const index = this.loggers.findIndex(l => l.id === id);
    if (index === -1) return false;
    
    this.loggers[index] = { ...this.loggers[index], ...updates };
    return true;
  }

  deleteLogger(id: string): boolean {
    const index = this.loggers.findIndex(l => l.id === id);
    if (index === -1) return false;
    
    this.loggers.splice(index, 1);
    return true;
  }
}

// Database service class
export class DatabaseService {
  private storage: InMemoryStorage;

  constructor() {
    console.log('Initializing DatabaseService');
    this.storage = new InMemoryStorage();
    console.log('DatabaseService initialized successfully');
  }

  // Helper function to add timeout to async operations
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }

  // Home screen data methods
  async getLiveMatches(): Promise<Match[]> {
    try {
      console.log('Fetching live matches from database');
      const matches = this.storage.getMatches();
      const liveMatches = matches.filter(match => match.status === 'live');
      console.log(`Found ${liveMatches.length} live matches`);
      
      // Removed artificial delay to improve performance
      // await new Promise(resolve => setTimeout(resolve, 10));
      
      return liveMatches;
    } catch (error) {
      console.error('Error fetching live matches:', error);
      throw error;
    }
  }

  async getUpcomingMatches(userId?: string): Promise<Match[]> {
    try {
      console.log('Fetching upcoming matches from database');
      const matches = this.storage.getMatches();
      const upcoming = matches.filter(match => 
        match.status === 'scheduled' && 
        new Date(match.match_date).getTime() > Date.now()
      );
      
      // Removed artificial delay to improve performance
      // await new Promise(resolve => setTimeout(resolve, 10));
      
      // For unauthenticated users, limit the number of matches returned
      if (!userId) {
        const limitedMatches = upcoming.slice(0, 5); // Return only first 5 matches for public users
        console.log(`Found ${limitedMatches.length} upcoming matches (limited for public user)`);
        return limitedMatches;
      }
      
      console.log(`Found ${upcoming.length} upcoming matches for user ${userId}`);
      return upcoming;
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      throw error;
    }
  }

  async getFeaturedContent(): Promise<FeaturedContent> {
    try {
      console.log('Fetching featured content from database');
      const content = this.storage.getFeaturedContent();
      console.log('Featured content fetched successfully');
      
      // Removed artificial delay to improve performance
      // await new Promise(resolve => setTimeout(resolve, 10));
      
      return content;
    } catch (error) {
      console.error('Error fetching featured content:', error);
      throw error;
    }
  }

  async getUserStats(userId?: string): Promise<UserStats> {
    try {
      console.log(`Fetching user stats for user ${userId || 'anonymous'}`);
      // Mock user stats - in a real implementation, this would query actual user data
      
      // Removed artificial delay to improve performance
      // await new Promise(resolve => setTimeout(resolve, 10));
      
      const stats = {
        favoriteTeams: userId ? 3 : 0,
        followedCompetitions: userId ? 2 : 0,
        upcomingMatches: userId ? 5 : 3
      };
      console.log('User stats fetched successfully:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  // Match methods
  async getAllMatches(): Promise<Match[]> {
    try {
      return this.storage.getMatches();
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  }

  async getMatchesByCompetitionId(competitionId: number): Promise<Match[]> {
    try {
      const matches = this.storage.getMatches();
      return matches.filter(match => match.competition_id === competitionId);
    } catch (error) {
      console.error(`Error fetching matches for competition ${competitionId}:`, error);
      throw error;
    }
  }

  async getMatchesBySport(sport: string, status?: 'live' | 'scheduled' | 'completed' | 'all'): Promise<Match[]> {
    try {
      console.log(`Fetching matches for sport: ${sport}, status: ${status}`);
      let matches = this.storage.getMatches().filter(match => match.sport === sport);
      console.log(`Found ${matches.length} matches for sport: ${sport}`);
      
      if (status && status !== 'all') {
        matches = matches.filter(match => match.status === status);
        console.log(`Filtered to ${matches.length} matches with status: ${status}`);
      }
      
      // Removed artificial delay to improve performance
      // await new Promise(resolve => setTimeout(resolve, 10));
      
      return matches;
    } catch (error) {
      console.error(`Error fetching ${sport} matches:`, error);
      throw error;
    }
  }

  // Competition methods
  async getAllCompetitions(): Promise<Competition[]> {
    try {
      return this.storage.getCompetitions();
    } catch (error) {
      console.error('Error fetching competitions:', error);
      throw error;
    }
  }

  async createCompetition(competitionData: Omit<Competition, 'id'>): Promise<Competition> {
    try {
      // Find the highest ID and increment by 1
      const competitions = this.storage.getCompetitions();
      const maxId = competitions.length > 0 ? Math.max(...competitions.map(c => c.id)) : 0;
      
      const newCompetition: Competition = {
        id: maxId + 1,
        ...competitionData,
        created_at: new Date().toISOString()
      };
      
      this.storage.addCompetition(newCompetition);
      return newCompetition;
    } catch (error) {
      console.error('Error creating competition:', error);
      throw error;
    }
  }

  async updateCompetition(id: number, updates: Partial<Competition>): Promise<Competition | null> {
    try {
      const success = this.storage.updateCompetition(id, updates);
      
      if (!success) {
        return null;
      }
      
      const competitions = this.storage.getCompetitions();
      const updatedCompetition = competitions.find(competition => competition.id === id);
      return updatedCompetition || null;
    } catch (error) {
      console.error('Error updating competition:', error);
      throw error;
    }
  }

  async deleteCompetition(id: number): Promise<Competition | null> {
    try {
      const competitions = this.storage.getCompetitions();
      const competitionToDelete = competitions.find(competition => competition.id === id);
      
      if (!competitionToDelete) {
        return null;
      }
      
      const success = this.storage.deleteCompetition(id);
      return success ? competitionToDelete : null;
    } catch (error) {
      console.error('Error deleting competition:', error);
      throw error;
    }
  }

  // Logger methods
  async getAllLoggers(): Promise<Logger[]> {
    try {
      return this.storage.getLoggers();
    } catch (error) {
      console.error('Error fetching loggers:', error);
      throw error;
    }
  }

  async getLoggerById(id: string): Promise<Logger | null> {
    try {
      const loggers = this.storage.getLoggers();
      return loggers.find(logger => logger.id === id) || null;
    } catch (error) {
      console.error('Error fetching logger by ID:', error);
      throw error;
    }
  }

  async getLoggerByEmail(email: string): Promise<Logger | null> {
    try {
      const loggers = this.storage.getLoggers();
      return loggers.find(logger => logger.email === email) || null;
    } catch (error) {
      console.error('Error fetching logger by email:', error);
      throw error;
    }
  }

  async createLogger(loggerData: Partial<Logger>): Promise<Logger> {
    try {
      const newLogger: Logger = {
        id: `logger${Date.now()}`,
        name: loggerData.name || '',
        email: loggerData.email || '',
        role: loggerData.role || 'logger',
        status: loggerData.status || 'inactive',
        assignedCompetitions: loggerData.assignedCompetitions || [],
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...loggerData
      };
      
      this.storage.addLogger(newLogger);
      return newLogger;
    } catch (error) {
      console.error('Error creating logger:', error);
      throw error;
    }
  }

  async updateLogger(id: string, updates: Partial<Logger>): Promise<Logger | null> {
    try {
      const success = this.storage.updateLogger(id, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      if (!success) {
        return null;
      }
      
      const loggers = this.storage.getLoggers();
      const updatedLogger = loggers.find(logger => logger.id === id);
      return updatedLogger || null;
    } catch (error) {
      console.error('Error updating logger:', error);
      throw error;
    }
  }

  async deleteLogger(id: string): Promise<Logger | null> {
    try {
      const loggers = this.storage.getLoggers();
      const loggerToDelete = loggers.find(logger => logger.id === id);
      
      if (!loggerToDelete) {
        return null;
      }
      
      const success = this.storage.deleteLogger(id);
      return success ? loggerToDelete : null;
    } catch (error) {
      console.error('Error deleting logger:', error);
      throw error;
    }
  }

  // Implementation of missing methods
  async saveMatchEvents(events: any[], userId: string): Promise<void> {
    try {
      console.log(`Saving ${events.length} match events for user ${userId}`);
      // In a real implementation, this would save events to the database
      // For now, we'll just log them
    } catch (error) {
      console.error('Error saving match events:', error);
      throw error;
    }
  }

  async updateMatchScores(scores: any[], userId: string): Promise<void> {
    try {
      console.log(`Updating scores for ${scores.length} matches by user ${userId}`);
      // In a real implementation, this would update match scores in the database
      // For now, we'll just log them
    } catch (error) {
      console.error('Error updating match scores:', error);
      throw error;
    }
  }

  async logUserActivity(userId: string, activity: string, data?: any): Promise<void> {
    try {
      console.log(`User ${userId} performed activity: ${activity}`, data);
      // In a real implementation, this would log user activity to the database
      // For now, we'll just log it
    } catch (error) {
      console.error('Error logging user activity:', error);
      throw error;
    }
  }
}

// Export singleton instance
console.log('Creating dbService singleton instance');
export const dbService = new DatabaseService();
console.log('dbService singleton instance created');
