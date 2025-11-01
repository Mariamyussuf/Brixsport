// Admin service for managing loggers, matches, and other admin functionality
import { dbService } from './databaseService';
import { API_BASE_URL } from './apiConfig';

export type Logger = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: 'active' | 'suspended' | string;
  createdAt?: string;
  lastActive?: string;
  assignedCompetitions?: string[];
  password?: string; // Added for credential management
};

export type LoggerMatch = any;
export type LoggerCompetition = any;

export type ApiResponse<T = any> = { success: boolean; data?: T; error?: { message?: string; code?: number } };

export const ensureLoggerType = (data: any): Logger => ({ 
  id: String(data?.id ?? 'unknown'), 
  name: data?.name, 
  email: data?.email,
  password: data?.password
});

// Helper function to make authenticated API calls
const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  try {
    // Get admin token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    
    if (!token) {
      throw new Error('No admin token found');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call error for ${endpoint}:`, error);
    throw error;
  }
};

export const adminService = {
  authToken: null as string | null,
  setAuthToken(token: string | null) {
    this.authToken = token;
    // Also store in localStorage for persistence
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('admin_token', token);
      } else {
        localStorage.removeItem('admin_token');
      }
    }
  },
  async getLoggers(): Promise<ApiResponse<Logger[]>> {
    try {
      const response = await apiCall('/admin/loggers');
      return { success: true, data: response.data || [] };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to fetch loggers' } };
    }
  },
  async getStatistics(): Promise<ApiResponse<any>> {
    try {
      // Fetch system analytics
      const analyticsResponse = await apiCall('/admin/analytics');
      
      // Fetch additional data for a more complete statistics view
      const [loggersResponse, matchesResponse] = await Promise.all([
        this.getLoggers(),
        this.getMatches()
      ]);
      
      // Combine all data into a comprehensive statistics object
      const stats = {
        ...(analyticsResponse.data || {}),
        totalLoggers: loggersResponse.success ? loggersResponse.data?.length || 0 : 0,
        activeLoggers: loggersResponse.success ? 
          loggersResponse.data?.filter(logger => logger.status === 'active').length || 0 : 0,
        totalMatches: matchesResponse.success ? matchesResponse.data?.length || 0 : 0,
        pendingMatches: matchesResponse.success ? 
          matchesResponse.data?.filter(match => match.status === 'scheduled').length || 0 : 0,
        completedMatches: matchesResponse.success ? 
          matchesResponse.data?.filter(match => match.status === 'completed').length || 0 : 0,
      };
      
      return { success: true, data: stats };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to fetch statistics' } };
    }
  },
  async createLogger(payload: any): Promise<ApiResponse<Logger>> {
    try {
      const response = await apiCall('/admin/loggers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to create logger' } };
    }
  },
  async createLoggerWithCredentials(payload: any): Promise<ApiResponse<Logger>> { 
    try {
      const response = await apiCall('/admin/loggers/with-credentials', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to create logger with credentials' } };
    }
  },
  async updateLogger(id: string, updates: any): Promise<ApiResponse<Logger>> {
    try {
      const response = await apiCall(`/admin/loggers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to update logger' } };
    }
  },
  async deleteLogger(id: string): Promise<ApiResponse<boolean>> {
    try {
      await apiCall(`/admin/loggers/${id}`, {
        method: 'DELETE'
      });
      
      return { success: true, data: true };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to delete logger' } };
    }
  },
  async suspendLogger(id: string): Promise<ApiResponse<Logger>> {
    try {
      const response = await apiCall(`/admin/loggers/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'suspended' })
      });
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to suspend logger' } };
    }
  },
  async activateLogger(id: string): Promise<ApiResponse<Logger>> {
    try {
      const response = await apiCall(`/admin/loggers/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'active' })
      });
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to activate logger' } };
    }
  },
  async assignLoggerToMatch(matchId: string, loggerId: string): Promise<ApiResponse<LoggerMatch>> { 
    try {
      const response = await apiCall(`/admin/matches/${matchId}/assign-logger`, {
        method: 'POST',
        body: JSON.stringify({ loggerId })
      });
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to assign logger to match' } };
    }
  },
  async getLoggerCompetitions(): Promise<ApiResponse<LoggerCompetition[]>> {
    try {
      const response = await apiCall('/admin/logger-competitions');
      return { success: true, data: response.data || [] };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to fetch logger competitions' } };
    }
  },
  async getLoggerMatches(): Promise<ApiResponse<LoggerMatch[]>> {
    try {
      const response = await apiCall('/admin/logger-matches');
      return { success: true, data: response.data || [] };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to fetch logger matches' } };
    }
  },
  async getMatches(): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiCall('/admin/matches');
      return { success: true, data: response.data || [] };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to fetch matches' } };
    }
  },
  async createLoggerMatch(data: any): Promise<ApiResponse<LoggerMatch>> {
    try {
      const response = await apiCall('/admin/logger-matches', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to create logger match' } };
    }
  },
  async updateLoggerMatch(id: string, updates: any): Promise<ApiResponse<LoggerMatch>> {
    try {
      const response = await apiCall(`/admin/logger-matches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to update logger match' } };
    }
  },
  async addLoggerEvent(matchId: string, event: any): Promise<ApiResponse<LoggerMatch>> {
    try {
      const response = await apiCall('/admin/logger-events', {
        method: 'POST',
        body: JSON.stringify({ matchId, event })
      });
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to add logger event' } };
    }
  },
  async generateLoggerReport(matchId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiCall(`/admin/logger-reports/${matchId}`, {
        method: 'POST'
      });
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: { message: error.message || 'Failed to generate logger report' } };
    }
  },
};