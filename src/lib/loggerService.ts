import { API_BASE_URL, API_TIMEOUT } from './apiConfig';
// Import new types
import { Match, MatchEvent, Team, Player, TimelineUpdate, WebSocketMessage, CardType, EventType, FoulType, GoalType, InjurySeverity, PlayerStats, TeamStats, MatchStatus, MatchStatsResponse } from '@/types/matchEvents';
import { ErrorHandler, StandardizedError } from './errorHandler';
import { UnifiedUser } from './authService';

// Logger user interface (using UnifiedUser)
export type { UnifiedUser as LoggerUser };

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

// Re-export MatchEvent from types to ensure consistency
export type { MatchEvent };

// Logger competition structure
export interface LoggerCompetition {
  id: string;
  name: string;
  sport: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  assignedLoggers: string[];
  location?: string; // Add optional location property
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
  private eventListeners: Map<string, Function[]> = new Map();
  getReports: any;
  getAnalyticsData: any;
  
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
  private async handleResponse<T>(response: Response): Promise<any> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        success: false,
        message: errorData.message || `API Error: ${response.status} ${response.statusText}`,
        code: 'API_ERROR',
        status: response.status,
        timestamp: new Date().toISOString()
      };
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
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<any> {
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
      
      // Use enhanced error handling
      const handledError = ErrorHandler.handle(error);
      throw handledError;
    }
  }
  
  /**
   * Add event listener
   * @param event - Event name
   * @param callback - Callback function
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }
  
  /**
   * Remove event listener
   * @param event - Event name
   * @param callback - Callback function
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  /**
   * Emit event
   * @param event - Event name
   * @param data - Event data
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
  
  /**
   * Get logger profile
   * @returns Promise with logger user data
   */
  async getProfile(): Promise<LoggerApiResponse<UnifiedUser>> {
    return await this.request<UnifiedUser>(LOGGER_ENDPOINTS.AUTH);
  }
  
  /**
   * Get assigned competitions for the logger
   * @returns Promise with competitions data
   */
  async getCompetitions(): Promise<LoggerApiResponse<LoggerCompetition[]>> {
    return await this.request<LoggerCompetition[]>(LOGGER_ENDPOINTS.COMPETITIONS);
  }
  
  /**
   * Get a specific competition by ID
   * @param competitionId - Competition ID
   * @returns Promise with competition data
   */
  async getCompetitionById(competitionId: string): Promise<LoggerApiResponse<LoggerCompetition>> {
    return await this.request<LoggerCompetition>(`${LOGGER_ENDPOINTS.COMPETITIONS}/${competitionId}`);
  }

  /**
   * Get all teams for a competition
   * @param competitionId - Competition ID
   * @returns Promise with teams data
   */
  async getTeamsByCompetition(competitionId: string): Promise<LoggerApiResponse<Team[]>> {
    return await this.request<Team[]>(`${LOGGER_ENDPOINTS.TEAMS}?competitionId=${competitionId}`);
  }

  /**
   * Get a specific team by ID
   * @param teamId - Team ID
   * @returns Promise with team data
   */
  async getTeamById(teamId: string): Promise<LoggerApiResponse<Team>> {
    return await this.request<Team>(`${LOGGER_ENDPOINTS.TEAMS}/${teamId}`);
  }

  /**
   * Get all players for a team
   * @param teamId - Team ID
   * @returns Promise with players data
   */
  async getPlayersByTeam(teamId: string): Promise<LoggerApiResponse<Player[]>> {
    return await this.request<Player[]>(`${LOGGER_ENDPOINTS.PLAYERS}?teamId=${teamId}`);
  }
  
  /**
   * Get all matches for the logger
   * @returns Promise with matches data
   */
  async getAllMatches(): Promise<LoggerApiResponse<LoggerMatch[]>> {
    return await this.request<LoggerMatch[]>(LOGGER_ENDPOINTS.MATCHES);
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
   * Add an event to a match with millisecond precision
   * @param matchId - Match ID
   * @param event - Event data
   * @returns Promise with updated match
   */
  async addEvent(matchId: string, event: Omit<MatchEvent, 'id' | 'matchId' | 'timestamp'>): Promise<LoggerApiResponse<LoggerMatch>> {
    // Ensure millisecond precision in timestamp
    const timestamp = new Date();
    const isoString = timestamp.toISOString();
    // Ensure milliseconds are included
    const milliseconds = timestamp.getMilliseconds().toString().padStart(3, '0');
    const preciseTimestamp = isoString.replace(/\.(\d{3})Z$/, `.${milliseconds}Z`);
    
    const eventWithTimestamp: any = {
      ...event,
      timestamp: preciseTimestamp
    };
    
    const response = await this.request<LoggerMatch>(`${LOGGER_ENDPOINTS.MATCHES}/${matchId}/events`, {
      method: 'POST',
      body: JSON.stringify(eventWithTimestamp)
    });
    
    // Emit real-time update
    if (response.success && response.data) {
      const timelineUpdate: TimelineUpdate = {
        eventType: 'event',
        timestamp: preciseTimestamp,
        data: {
          ...eventWithTimestamp,
          id: `event-${Date.now()}-${Math.random()}`, // Generate a temporary ID
          matchId: matchId
        } as MatchEvent,
        sequence: Date.now()
      };
      
      this.emit('timeline-update', timelineUpdate);
    }
    
    return response;
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

  /**
   * Get activity logs for admin dashboard
   * @returns Promise with activity logs data
   */
  async getActivityLogs(): Promise<LoggerApiResponse<any[]>> {
    return await this.request<any[]>('/admin/activity-logs');
  }
  
  /**
   * Establish a WebSocket connection for real-time updates
   * @param matchId - Match ID to subscribe to
   * @returns WebSocket connection
   */
  async subscribeToMatchUpdates(matchId: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${API_BASE_URL.replace('http://', 'ws://')}/logger/matches/${matchId}/updates`);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        resolve(ws);
      };
      
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          // Handle incoming message
          if (message.type === 'timeline-update') {
            // Broadcast the update to listeners
            this.emit('timeline-update', message.payload);
          } else if (message.type === 'match-status') {
            this.emit('match-status-update', message.payload);
          } else if (message.type === 'stats-update') {
            this.emit('stats-update', message.payload);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.emit('error', { error: 'Invalid message format' });
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.emit('disconnected', null);
      };
    });
  }
  
  /**
   * Send a timeline update via WebSocket
   * @param matchId - Match ID
   * @param update - Timeline update
   * @returns Promise with WebSocket response
   */
  async sendTimelineUpdate(matchId: string, update: TimelineUpdate): Promise<any> {
    return await this.request<any>(`${LOGGER_ENDPOINTS.MATCHES}/${matchId}/updates`, {
      method: 'POST',
      body: JSON.stringify(update)
    });
  }

  /**
   * Get all events for a match
   * @param matchId - Match ID
   * @returns Promise with match events
   */
  async getMatchEvents(matchId: string): Promise<LoggerApiResponse<MatchEvent[]>> {
    return await this.request<MatchEvent[]>(`${LOGGER_ENDPOINTS.MATCHES}/${matchId}/events`);
  }

  /**
   * Get stats for a match
   * @param matchId - Match ID
   * @returns Promise with match stats
   */
  async getMatchStats(matchId: string): Promise<LoggerApiResponse<MatchStatsResponse>> {
    return await this.request<MatchStatsResponse>(`${LOGGER_ENDPOINTS.MATCHES}/${matchId}/stats`);
  }

  /**
   * Log a goal event
   * @param matchId - Match ID
   * @param goalData - Goal data
   * @returns Promise with updated match
   */
  async logGoal(matchId: string, goalData: Omit<MatchEvent, 'id' | 'matchId' | 'timestamp' | 'type'> & { goalType?: GoalType }): Promise<LoggerApiResponse<LoggerMatch>> {
    return await this.addEvent(matchId, {
      ...goalData,
      type: 'goal'
    });
  }

  /**
   * Log a card event
   * @param matchId - Match ID
   * @param cardData - Card data
   * @returns Promise with updated match
   */
  async logCard(matchId: string, cardData: Omit<MatchEvent, 'id' | 'matchId' | 'timestamp' | 'type'> & { cardType: CardType }): Promise<LoggerApiResponse<LoggerMatch>> {
    return await this.addEvent(matchId, {
      ...cardData,
      type: 'card'
    });
  }

  /**
   * Log a substitution event
   * @param matchId - Match ID
   * @param substitutionData - Substitution data
   * @returns Promise with updated match
   */
  async logSubstitution(matchId: string, substitutionData: Omit<MatchEvent, 'id' | 'matchId' | 'timestamp' | 'type'> & { inPlayerId: string, outPlayerId: string }): Promise<LoggerApiResponse<LoggerMatch>> {
    return await this.addEvent(matchId, {
      ...substitutionData,
      type: 'substitution'
    });
  }

  /**
   * Log a foul event
   * @param matchId - Match ID
   * @param foulData - Foul data
   * @returns Promise with updated match
   */
  async logFoul(matchId: string, foulData: Omit<MatchEvent, 'id' | 'matchId' | 'timestamp' | 'type'> & { foulType: FoulType }): Promise<LoggerApiResponse<LoggerMatch>> {
    return await this.addEvent(matchId, {
      ...foulData,
      type: 'foul'
    });
  }

  /**
   * Log an injury event
   * @param matchId - Match ID
   * @param injuryData - Injury data
   * @returns Promise with updated match
   */
  async logInjury(matchId: string, injuryData: Omit<MatchEvent, 'id' | 'matchId' | 'timestamp' | 'type'> & { injurySeverity: InjurySeverity }): Promise<LoggerApiResponse<LoggerMatch>> {
    return await this.addEvent(matchId, {
      ...injuryData,
      type: 'injury'
    });
  }

  /**
   * Log a VAR event
   * @param matchId - Match ID
   * @param varData - VAR data
   * @returns Promise with updated match
   */
  async logVAR(matchId: string, varData: Omit<MatchEvent, 'id' | 'matchId' | 'timestamp' | 'type'> & { decision: string }): Promise<LoggerApiResponse<LoggerMatch>> {
    return await this.addEvent(matchId, {
      ...varData,
      type: 'VAR'
    });
  }

  /**
   * Log a penalty event
   * @param matchId - Match ID
   * @param penaltyData - Penalty data
   * @returns Promise with updated match
   */
  async logPenalty(matchId: string, penaltyData: Omit<MatchEvent, 'id' | 'matchId' | 'timestamp' | 'type'> & { penaltyType: string }): Promise<LoggerApiResponse<LoggerMatch>> {
    return await this.addEvent(matchId, {
      ...penaltyData,
      type: 'penalty'
    });
  }

  /**
   * Start a match
   * @param matchId - Match ID
   * @returns Promise with updated match
   */
  async startMatch(matchId: string): Promise<LoggerApiResponse<LoggerMatch>> {
    const response = await this.request<LoggerMatch>(`${LOGGER_ENDPOINTS.MATCHES}/${matchId}/start`, {
      method: 'POST'
    });
    
    // Emit match status update
    if (response.success && response.data) {
      this.emit('match-status-update', {
        matchId,
        status: response.data.status
      });
    }
    
    return response;
  }

  /**
   * End a match
   * @param matchId - Match ID
   * @returns Promise with updated match
   */
  async endMatch(matchId: string): Promise<LoggerApiResponse<LoggerMatch>> {
    const response = await this.request<LoggerMatch>(`${LOGGER_ENDPOINTS.MATCHES}/${matchId}/end`, {
      method: 'POST'
    });
    
    // Emit match status update
    if (response.success && response.data) {
      this.emit('match-status-update', {
        matchId,
        status: response.data.status
      });
    }
    
    return response;
  }

  /**
   * Validate if an event can be logged for the current match status
   * @param matchStatus - Current match status
   * @param eventType - Event type
   * @returns Whether the event can be logged
   */
  canLogEvent(matchStatus: MatchStatus, eventType: EventType): boolean {
    switch (matchStatus) {
      case 'scheduled':
        return eventType === 'kick-off';
      case 'half-time':
      case 'live':
        return eventType !== 'kick-off' && eventType !== 'full-time';
      case 'full-time':
        return false;
      case 'postponed':
        return false;
      default:
        return false;
    }
  }

  /**
   * Format event for timeline display with millisecond precision
   * @param event - Match event
   * @returns Formatted timeline event
   */
  formatTimelineEvent(event: MatchEvent): string {
    const time = new Date(event.timestamp);
    const minutes = Math.floor(event.minute);
    const seconds = Math.floor(event.second);
    const milliseconds = Math.floor(event.millisecond);
    
    // Format with leading zeros
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');
    const formattedMilliseconds = milliseconds.toString().padStart(3, '0');
    
    let formattedTime = `${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
    
    let emoji = '';
    let description = '';
    
    switch (event.type) {
      case 'goal':
        emoji = '⚽';
        description = `Goal by ${event.playerId || 'Unknown'}${event.secondaryPlayerId ? ` (Assist: ${event.secondaryPlayerId})` : ''}`;
        if (event.metadata.goalType) {
          description += ` - ${event.metadata.goalType}`;
        }
        break;
      case 'card':
        emoji = event.metadata.cardType === 'yellow' ? '🟨' : '🟥';
        description = `${event.metadata.cardType === 'yellow' ? 'Yellow' : 'Red'} card ${event.playerId || 'Unknown'}`;
        break;
      case 'substitution':
        emoji = '🔄';
        description = `Substitution: ${event.secondaryPlayerId || 'Unknown'} in for ${event.playerId || 'Unknown'}`;
        break;
      case 'foul':
        emoji = '🛑';
        description = `Foul by ${event.playerId || 'Unknown'}${event.secondaryPlayerId ? ` on ${event.secondaryPlayerId}` : ''}`;
        if (event.metadata.foulType) {
          description += ` - ${event.metadata.foulType}`;
        }
        break;
      case 'injury':
        emoji = '🚑';
        description = `Injury to ${event.playerId || 'Unknown'}`;
        if (event.metadata.injurySeverity) {
          description += ` - ${event.metadata.injurySeverity}`;
        }
        break;
      case 'VAR':
        emoji = '📺';
        description = `VAR Review${event.metadata.VARDecision ? ` - ${event.metadata.VARDecision}` : ''}`;
        break;
      case 'penalty':
        emoji = '🎯';
        description = `Penalty${event.metadata.penaltyType ? ` - ${event.metadata.penaltyType}` : ''}`;
        break;
      case 'kick-off':
        emoji = '▶️';
        description = 'Kick-off';
        break;
      case 'half-time':
        emoji = '⏸️';
        description = 'Half-time';
        break;
      case 'full-time':
        emoji = '🏁';
        description = 'Full-time';
        break;
      default:
        emoji = 'ℹ️';
        description = event.description || 'Other event';
    }
    
    return `${emoji} ${formattedTime} ${description}`;
  }

  /**
   * Create a new competition
   * @param competitionData - Competition data
   * @returns Promise with created competition
   */
  async createCompetition(competitionData: Omit<LoggerCompetition, 'id'>): Promise<LoggerApiResponse<LoggerCompetition>> {
    return await this.request<LoggerCompetition>(LOGGER_ENDPOINTS.COMPETITIONS, {
      method: 'POST',
      body: JSON.stringify(competitionData)
    });
  }

  /**
   * Update a competition
   * @param competitionId - Competition ID
   * @param updates - Competition updates
   * @returns Promise with updated competition
   */
  async updateCompetition(competitionId: string, updates: Partial<LoggerCompetition>): Promise<LoggerApiResponse<LoggerCompetition>> {
    return await this.request<LoggerCompetition>(`${LOGGER_ENDPOINTS.COMPETITIONS}/${competitionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Delete a competition
   * @param competitionId - Competition ID
   * @returns Promise with deletion result
   */
  async deleteCompetition(competitionId: string): Promise<LoggerApiResponse<void>> {
    return await this.request<void>(`${LOGGER_ENDPOINTS.COMPETITIONS}/${competitionId}`, {
      method: 'DELETE'
    });
  }
}

// Export singleton instance
export const loggerService = new LoggerService();

export default loggerService;