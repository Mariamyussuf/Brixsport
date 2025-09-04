// Admin Service
// API service for admin-specific operations

import { API_BASE_URL, API_TIMEOUT } from './apiConfig';
import { AdminUser } from './adminAuth';

// Admin API endpoints
const ADMIN_ENDPOINTS = {
  BASE: `${API_BASE_URL}/admin`,
  AUTH: `${API_BASE_URL}/admin/auth`,
  LOGGERS: `${API_BASE_URL}/admin/loggers`,
  MATCHES: `${API_BASE_URL}/admin/matches`,
  REPORTS: `${API_BASE_URL}/admin/reports`,
  SETTINGS: `${API_BASE_URL}/admin/settings`
};

// Logger data structure
export interface Logger {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  assignedCompetitions: string[];
  createdAt: string;
  lastActive: string;
}

// Admin API response structure
interface AdminApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Admin API Service Class
 */
class AdminService {
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
  private async handleResponse<T>(response: Response): Promise<AdminApiResponse<T>> {
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
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<AdminApiResponse<T>> {
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
   * Get admin profile
   * @returns Promise with admin user data
   */
  async getProfile(): Promise<AdminApiResponse<AdminUser>> {
    return await this.request<AdminUser>(ADMIN_ENDPOINTS.AUTH);
  }
  
  /**
   * Get all loggers in the system
   * @returns Promise with loggers data
   */
  async getLoggers(): Promise<AdminApiResponse<Logger[]>> {
    return await this.request<Logger[]>(ADMIN_ENDPOINTS.LOGGERS);
  }
  
  /**
   * Create a new logger
   * @param loggerData - Logger data
   * @returns Promise with created logger
   */
  async createLogger(loggerData: Omit<Logger, 'id' | 'createdAt' | 'lastActive'>): Promise<AdminApiResponse<Logger>> {
    return await this.request<Logger>(ADMIN_ENDPOINTS.LOGGERS, {
      method: 'POST',
      body: JSON.stringify(loggerData)
    });
  }
  
  /**
   * Update a logger
   * @param loggerId - Logger ID
   * @param updates - Logger updates
   * @returns Promise with updated logger
   */
  async updateLogger(loggerId: string, updates: Partial<Logger>): Promise<AdminApiResponse<Logger>> {
    return await this.request<Logger>(`${ADMIN_ENDPOINTS.LOGGERS}/${loggerId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }
  
  /**
   * Delete a logger
   * @param loggerId - Logger ID
   * @returns Promise with deletion result
   */
  async deleteLogger(loggerId: string): Promise<AdminApiResponse<void>> {
    return await this.request<void>(`${ADMIN_ENDPOINTS.LOGGERS}/${loggerId}`, {
      method: 'DELETE'
    });
  }
  
  /**
   * Suspend a logger
   * @param loggerId - Logger ID
   * @returns Promise with suspension result
   */
  async suspendLogger(loggerId: string): Promise<AdminApiResponse<Logger>> {
    return await this.request<Logger>(`${ADMIN_ENDPOINTS.LOGGERS}/${loggerId}/suspend`, {
      method: 'POST'
    });
  }
  
  /**
   * Activate a logger
   * @param loggerId - Logger ID
   * @returns Promise with activation result
   */
  async activateLogger(loggerId: string): Promise<AdminApiResponse<Logger>> {
    return await this.request<Logger>(`${ADMIN_ENDPOINTS.LOGGERS}/${loggerId}/activate`, {
      method: 'POST'
    });
  }
  
  /**
   * Get system reports
   * @returns Promise with reports data
   */
  async getReports(): Promise<AdminApiResponse<any>> {
    return await this.request<any>(ADMIN_ENDPOINTS.REPORTS);
  }
  
  /**
   * Generate a specific report
   * @param reportType - Type of report to generate
   * @returns Promise with report data
   */
  async generateReport(reportType: string): Promise<AdminApiResponse<any>> {
    return await this.request<any>(`${ADMIN_ENDPOINTS.REPORTS}/${reportType}`, {
      method: 'POST'
    });
  }
  
  /**
   * Get system settings
   * @returns Promise with settings data
   */
  async getSettings(): Promise<AdminApiResponse<any>> {
    return await this.request<any>(ADMIN_ENDPOINTS.SETTINGS);
  }
  
  /**
   * Update system settings
   * @param settings - Settings updates
   * @returns Promise with updated settings
   */
  async updateSettings(settings: any): Promise<AdminApiResponse<any>> {
    return await this.request<any>(ADMIN_ENDPOINTS.SETTINGS, {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
  }
}

// Export singleton instance
export const adminService = new AdminService();

export default adminService;