import { APIResponse } from '@/types/api';

// Redis service for frontend cache operations
class RedisService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';
  }

  // Helper method to make API requests to Redis proxy endpoints
  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    try {
      // For Next.js API routes, we need to use the correct base URL
      const isServer = typeof window === 'undefined';
      const baseUrl = isServer ? 'http://localhost:3000' : window.location.origin;
      const url = `${baseUrl}/api${endpoint}`;
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data: data.data || data };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return { success: false, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  // Get a value from Redis cache
  async get<T>(key: string): Promise<APIResponse<T | null>> {
    try {
      const response = await this.apiRequest<{ value: T }>(`/redis/${encodeURIComponent(key)}`);
      if (response.success && response.data) {
        return { success: true, data: response.data.value };
      }
      return { success: true, data: null };
    } catch (error) {
      console.error(`Redis GET failed for key ${key}:`, error);
      return { success: false, error: error instanceof Error ? error : new Error('Failed to get value from cache') };
    }
  }

  // Set a value in Redis cache
  async set<T>(key: string, value: T, expireInSeconds?: number): Promise<APIResponse<boolean>> {
    try {
      const body: any = { value };
      if (expireInSeconds) {
        body.expireInSeconds = expireInSeconds;
      }
      
      const response = await this.apiRequest<boolean>(`/redis/${encodeURIComponent(key)}`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      
      return response;
    } catch (error) {
      console.error(`Redis SET failed for key ${key}:`, error);
      return { success: false, error: error instanceof Error ? error : new Error('Failed to set value in cache') };
    }
  }

  // Delete a value from Redis cache
  async del(key: string): Promise<APIResponse<number>> {
    try {
      const response = await this.apiRequest<number>(`/redis/${encodeURIComponent(key)}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error(`Redis DEL failed for key ${key}:`, error);
      return { success: false, error: error instanceof Error ? error : new Error('Failed to delete value from cache') };
    }
  }

  // Increment a value in Redis
  async incr(key: string): Promise<APIResponse<number>> {
    try {
      const response = await this.apiRequest<number>(`/redis/incr/${encodeURIComponent(key)}`, {
        method: 'POST'
      });
      return response;
    } catch (error) {
      console.error(`Redis INCR failed for key ${key}:`, error);
      return { success: false, error: error instanceof Error ? error : new Error('Failed to increment value in cache') };
    }
  }

  // Get Redis stats
  async getStats(): Promise<APIResponse<any>> {
    try {
      const response = await this.apiRequest<any>('/redis');
      return response;
    } catch (error) {
      console.error('Redis stats request failed:', error);
      return { success: false, error: error instanceof Error ? error : new Error('Failed to get Redis stats') };
    }
  }
}

// Export singleton instance
export default new RedisService();

// Export the service class for potential extension
export { RedisService };