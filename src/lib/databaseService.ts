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
  status: 'live' | 'scheduled' | 'completed';
  home_score: number | null;
  away_score: number | null;
  sport?: string;
}

interface Competition {
  id: string;
  name: string;
  sport: string;
  startDate: string;
  endDate: string;
  status: string;
  assignedLoggers: string[];
  location: string;
  createdAt?: string;
  updatedAt?: string;
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
      status: 'live',
      home_score: 2,
      away_score: 1,
      sport: 'football'
    },
    {
      id: 2,
      competition_id: 102,
      home_team_id: 3,
      away_team_id: 4,
      match_date: new Date().toISOString(),
      status: 'live',
      home_score: 0,
      away_score: 0,
      sport: 'football'
    },
    {
      id: 3,
      competition_id: 103,
      home_team_id: 5,
      away_team_id: 6,
      match_date: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      status: 'scheduled',
      home_score: null,
      away_score: null,
      sport: 'basketball'
    },
    {
      id: 4,
      competition_id: 104,
      home_team_id: 7,
      away_team_id: 8,
      match_date: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
      status: 'scheduled',
      home_score: null,
      away_score: null,
      sport: 'basketball'
    },
    {
      id: 5,
      competition_id: 201,
      home_team_id: 10,
      away_team_id: 11,
      match_date: new Date().toISOString(),
      status: 'live',
      home_score: 78,
      away_score: 75,
      sport: 'basketball'
    },
    {
      id: 6,
      competition_id: 202,
      home_team_id: 12,
      away_team_id: 13,
      match_date: new Date(Date.now() + 3600000).toISOString(),
      status: 'scheduled',
      home_score: null,
      away_score: null,
      sport: 'basketball'
    },
    {
      id: 7,
      competition_id: 301,
      home_team_id: 15,
      away_team_id: 16,
      match_date: new Date().toISOString(),
      status: 'live',
      home_score: null,
      away_score: null,
      sport: 'track'
    },
    {
      id: 8,
      competition_id: 302,
      home_team_id: 17,
      away_team_id: 18,
      match_date: new Date(Date.now() + 7200000).toISOString(),
      status: 'scheduled',
      home_score: null,
      away_score: null,
      sport: 'track'
    }
  ];

  private competitions: Competition[] = [
    {
      id: 'comp1',
      name: 'Fall Championship',
      sport: 'football',
      startDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      endDate: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days from now
      status: 'ongoing',
      assignedLoggers: ['logger1', 'logger2'],
      location: 'Main Stadium'
    },
    {
      id: 'comp2',
      name: 'Winter Cup',
      sport: 'basketball',
      startDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 1 week from now
      endDate: new Date(Date.now() + 86400000 * 37).toISOString(), // 37 days from now
      status: 'upcoming',
      assignedLoggers: ['logger3'],
      location: 'Gymnasium A'
    },
    {
      id: 'comp3',
      name: 'Spring Tournament',
      sport: 'track',
      startDate: new Date(Date.now() + 86400000 * 60).toISOString(), // 2 months from now
      endDate: new Date(Date.now() + 86400000 * 67).toISOString(), // 2 months and 1 week from now
      status: 'upcoming',
      assignedLoggers: ['logger1', 'logger3'],
      location: 'Track Field'
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

  updateCompetition(id: string, updates: Partial<Competition>): boolean {
    const index = this.competitions.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    this.competitions[index] = { ...this.competitions[index], ...updates };
    return true;
  }

  deleteCompetition(id: string): boolean {
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
  saveMatchEvents: any;
  updateMatchScores: any;
  logUserActivity: any;

  constructor() {
    this.storage = new InMemoryStorage();
  }

  // Home screen data methods
  async getLiveMatches(): Promise<Match[]> {
    try {
      const matches = this.storage.getMatches();
      return matches.filter(match => match.status === 'live');
    } catch (error) {
      console.error('Error fetching live matches:', error);
      throw error;
    }
  }

  async getUpcomingMatches(userId?: string): Promise<Match[]> {
    try {
      const matches = this.storage.getMatches();
      const upcoming = matches.filter(match => 
        match.status === 'scheduled' && 
        new Date(match.match_date).getTime() > Date.now()
      );
      
      // For unauthenticated users, limit the number of matches returned
      if (!userId) {
        return upcoming.slice(0, 5); // Return only first 5 matches for public users
      }
      
      return upcoming;
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      throw error;
    }
  }

  async getFeaturedContent(): Promise<FeaturedContent> {
    try {
      return this.storage.getFeaturedContent();
    } catch (error) {
      console.error('Error fetching featured content:', error);
      throw error;
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // In a real implementation, this would query user-specific data
      // For now, returning static data
      return {
        favoriteTeams: 3,
        followedCompetitions: 5,
        upcomingMatches: 2
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw error;
    }
  }

  // Sport-specific matches methods
  async getMatchesBySport(sport: string, status?: string): Promise<Match[]> {
    try {
      let matches = this.storage.getMatches().filter(match => match.sport === sport);
      
      if (status && status !== 'all') {
        matches = matches.filter(match => match.status === status);
      }
      
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

  async createCompetition(competitionData: Omit<Competition, 'id' | 'createdAt' | 'updatedAt'>): Promise<Competition> {
    try {
      const newCompetition: Competition = {
        id: `comp${Date.now()}`,
        ...competitionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.storage.addCompetition(newCompetition);
      return newCompetition;
    } catch (error) {
      console.error('Error creating competition:', error);
      throw error;
    }
  }

  async updateCompetition(id: string, updates: Partial<Competition>): Promise<Competition | null> {
    try {
      const success = this.storage.updateCompetition(id, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
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

  async deleteCompetition(id: string): Promise<Competition | null> {
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
}

// Export singleton instance
export const dbService = new DatabaseService();