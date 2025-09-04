// Logger Service
// API service for logger-specific operations

import { API_BASE_URL, API_TIMEOUT } from './apiConfig';
import { LoggerUser } from './loggerAuth';

// Logger API endpoints
const LOGGER_ENDPOINTS = {
  BASE: `${API_BASE_URL}/logger`,
  AUTH: `${API_BASE_URL}/logger/auth`,
  MATCHES: `${API_BASE_URL}/logger/matches`,
  COMPETITIONS: `${API_BASE_URL}/logger/competitions`,
  PLAYERS: `${API_BASE_URL}/logger/players`,
  TEAMS: `${API_BASE_URL}/logger/teams`,
  REPORTS: `${API_BASE_URL}/logger/reports`,
  // Admin endpoints
  ADMIN: `${API_BASE_URL}/admin`,
  ADMIN_LOGGERS: `${API_BASE_URL}/admin/loggers`
};

// Logger match status types
export type MatchStatus = 'scheduled' | 'in-progress' | 'completed' | 'postponed' | 'cancelled';

// Logger match data structure
export interface LoggerMatch {
  id: string;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  startTime: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  period?: string;
  timeRemaining?: string;
  events: MatchEvent[];
  loggerId: string;
  lastUpdated: string;
}

// Logger match event structure
export interface MatchEvent {
  id: string;
  matchId: string;
  type: 'goal' | 'yellow-card' | 'red-card' | 'substitution' | 'injury' | 'other';
  teamId: string;
  playerId?: string;
  minute: number;
  description: string;
  timestamp: string;
}

// Logger competition structure
export interface LoggerCompetition {
  id: string;
  name: string;
  sport: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  assignedLoggers: string[];
}

// Logger API response structure
interface LoggerApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Logger API Service Class
 */
class LoggerService {
  private token: string | null = null;
  
  /**
   * Set the authentication token
   * @param token - JWT token for authentication
   */
  setAuthToken(token: string | null): void {
    this.token = token;
  }
  
  /**
   * Get default headers for API requests
   * @returns Headers object with authentication
   */
  private getHeaders(): Headers {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    
    if (this.token) {
      headers.append('Authorization', `Bearer ${this.token}`);
    }
    
    return headers;
  }
  
  /**
   * Handle API response
   * @param response - Fetch response
   * @returns Promise with parsed response data
   */
  private async handleResponse<T>(response: Response): Promise<LoggerApiResponse<T>> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  }
  
  /**
   * Make an API request
   * @param endpoint - API endpoint
   * @param options - Request options
   * @returns Promise with response data
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<LoggerApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: this.getHeaders(),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return await this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred');
    }
  }
  
  /**
   * Get logger profile
   * @returns Promise with logger user data
   */
  async getProfile(): Promise<LoggerApiResponse<LoggerUser>> {
    return await this.request<LoggerUser>(LOGGER_ENDPOINTS.AUTH);
  }
  
  /**
   * Get assigned competitions for the logger
   * @returns Promise with competitions data
   */
  async getCompetitions(): Promise<LoggerApiResponse<LoggerCompetition[]>> {
    return await this.request<LoggerCompetition[]>(LOGGER_ENDPOINTS.COMPETITIONS);
  }
  
  /**
   * Get matches for a competition
   * @param competitionId - Competition ID
   * @returns Promise with matches data
   */
  async getMatches(competitionId: string): Promise<LoggerApiResponse<LoggerMatch[]>> {
    return await this.request<LoggerMatch[]>(`${LOGGER_ENDPOINTS.MATCHES}?competitionId=${competitionId}`);
  }
  
  /**
   * Create a new match
   * @param matchData - Match data
   * @returns Promise with created match
   */
  async createMatch(matchData: Omit<LoggerMatch, 'id' | 'events' | 'loggerId' | 'lastUpdated'>): Promise<LoggerApiResponse<LoggerMatch>> {
    return await this.request<LoggerMatch>(LOGGER_ENDPOINTS.MATCHES, {
      method: 'POST',
      body: JSON.stringify(matchData)
    });
  }
  
  /**
   * Update a match
   * @param matchId - Match ID
   * @param updates - Match updates
   * @returns Promise with updated match
   */
  async updateMatch(matchId: string, updates: Partial<LoggerMatch>): Promise<LoggerApiResponse<LoggerMatch>> {
    return await this.request<LoggerMatch>(`${LOGGER_ENDPOINTS.MATCHES}/${matchId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }
  
  /**
   * Add an event to a match
   * @param matchId - Match ID
   * @param event - Event data
   * @returns Promise with updated match
   */
  async addEvent(matchId: string, event: Omit<MatchEvent, 'id' | 'matchId' | 'timestamp'>): Promise<LoggerApiResponse<LoggerMatch>> {
    return await this.request<LoggerMatch>(`${LOGGER_ENDPOINTS.MATCHES}/${matchId}/events`, {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }
  
  /**
   * Generate a match report
   * @param matchId - Match ID
   * @returns Promise with report data
   */
  async generateReport(matchId: string): Promise<LoggerApiResponse<any>> {
    return await this.request<any>(`${LOGGER_ENDPOINTS.REPORTS}/${matchId}`, {
      method: 'POST'
    });
  }
  
  // Admin-specific methods
  
  /**
   * Get all loggers in the system (admin only)
   * @returns Promise with loggers data
   */
  async getLoggers(): Promise<LoggerApiResponse<any[]>> {
    return await this.request<any[]>(LOGGER_ENDPOINTS.ADMIN_LOGGERS);
  }
  
  /**
   * Create a new logger (admin only)
   * @param loggerData - Logger data
   * @returns Promise with created logger
   */
  async createLogger(loggerData: any): Promise<LoggerApiResponse<any>> {
    return await this.request<any>(LOGGER_ENDPOINTS.ADMIN_LOGGERS, {
      method: 'POST',
      body: JSON.stringify(loggerData)
    });
  }
  
  /**
   * Update a logger (admin only)
   * @param loggerId - Logger ID
   * @param updates - Logger updates
   * @returns Promise with updated logger
   */
  async updateLogger(loggerId: string, updates: Partial<any>): Promise<LoggerApiResponse<any>> {
    return await this.request<any>(`${LOGGER_ENDPOINTS.ADMIN_LOGGERS}/${loggerId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }
  
  /**
   * Delete a logger (admin only)
   * @param loggerId - Logger ID
   * @returns Promise with deletion result
   */
  async deleteLogger(loggerId: string): Promise<LoggerApiResponse<void>> {
    return await this.request<void>(`${LOGGER_ENDPOINTS.ADMIN_LOGGERS}/${loggerId}`, {
      method: 'DELETE'
    });
  }
  
  /**
   * Suspend a logger (admin only)
   * @param loggerId - Logger ID
   * @returns Promise with suspension result
   */
  async suspendLogger(loggerId: string): Promise<LoggerApiResponse<any>> {
    return await this.request<any>(`${LOGGER_ENDPOINTS.ADMIN_LOGGERS}/${loggerId}/suspend`, {
      method: 'POST'
    });
  }
  
  /**
   * Activate a logger (admin only)
   * @param loggerId - Logger ID
   * @returns Promise with activation result
   */
  async activateLogger(loggerId: string): Promise<LoggerApiResponse<any>> {
    return await this.request<any>(`${LOGGER_ENDPOINTS.ADMIN_LOGGERS}/${loggerId}/activate`, {
      method: 'POST'
    });
  }
}

// Export singleton instance
export const loggerService = new LoggerService();

export default loggerService;