import { APIResponse } from '@/types/api';
import redisService from '@/lib/redis';

// Define TypeScript interfaces for analytics data
export interface Metrics {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  liveMatches: number;
  totalRevenue: number;
  systemUptime: number;
  responseTime: number;
  errorRate: number;
}

export interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface ChartData {
  userGrowth: ChartDataPoint[];
  matchActivity: ChartDataPoint[];
  revenue: ChartDataPoint[];
  performance: ChartDataPoint[];
}

export interface UserOverview {
  totalUsers: number;
  newUsersToday: number;
  activeUsers: number;
  userGrowth: number;
}

export interface PlatformUsage {
  apiRequests: number;
  bandwidth: number;
  storage: number;
  peakConcurrentUsers: number;
}

export interface SystemPerformance {
  responseTime: number;
  uptime: number;
  errorRate: number;
  throughput: number;
}

export interface SystemHealth {
  apiStatus: string;
  databaseStatus: string;
  cacheStatus: string;
  overallStatus: string;
}

export interface ResourceUtilization {
  resourceName: string;
  currentUsage: number;
  maxCapacity: number;
  utilizationPercentage: number;
}

// Cache statistics interface
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  memoryUsage: string;
  connectedClients: number;
  opsPerSecond: number;
}

// Report interfaces
export interface Report {
  id: string;
  name: string;
  description: string;
  type: 'user' | 'sports' | 'competition' | 'platform' | 'system' | 'deployment' | 'custom';
  parameters: Record<string, any>;
  data: any;
  format: 'json' | 'csv' | 'pdf' | 'xlsx';
  generatedAt: string;
  expiresAt?: string;
  size?: string;
  status?: 'generating' | 'ready' | 'expired' | 'failed';
}

// Analytics Service
class AnalyticsService {
  private baseUrl: string;
  private authToken: string | null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';
    this.authToken = null;
  }

  // Set authentication token
  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  // Helper method to make API requests
  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const headers = {
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
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

  // Fetch user overview data
  public async getUserOverview(): Promise<APIResponse<UserOverview>> {
    // Check cache first
    const cacheKey = 'analytics:user-overview';
    const cached = await redisService.get<UserOverview>(cacheKey);
    
    if (cached.success && cached.data) {
      return { success: true, data: cached.data };
    }
    
    const result = await this.apiRequest<UserOverview>('/analytics/users/overview');
    
    // Cache the result for 5 minutes
    if (result.success) {
      await redisService.set(cacheKey, result.data, 300);
    }
    
    return result;
  }

  // Fetch platform usage data
  public async getPlatformUsage(): Promise<APIResponse<PlatformUsage>> {
    // Check cache first
    const cacheKey = 'analytics:platform-usage';
    const cached = await redisService.get<PlatformUsage>(cacheKey);
    
    if (cached.success && cached.data) {
      return { success: true, data: cached.data };
    }
    
    const result = await this.apiRequest<PlatformUsage>('/analytics/platform/usage');
    
    // Cache the result for 5 minutes
    if (result.success) {
      await redisService.set(cacheKey, result.data, 300);
    }
    
    return result;
  }

  // Fetch system performance data
  public async getSystemPerformance(): Promise<APIResponse<SystemPerformance>> {
    // Check cache first
    const cacheKey = 'analytics:system-performance';
    const cached = await redisService.get<SystemPerformance>(cacheKey);
    
    if (cached.success && cached.data) {
      return { success: true, data: cached.data };
    }
    
    const result = await this.apiRequest<SystemPerformance>('/analytics/platform/performance');
    
    // Cache the result for 1 minute
    if (result.success) {
      await redisService.set(cacheKey, result.data, 60);
    }
    
    return result;
  }

  // Fetch system health data
  public async getSystemHealth(): Promise<APIResponse<SystemHealth>> {
    // Check cache first
    const cacheKey = 'analytics:system-health';
    const cached = await redisService.get<SystemHealth>(cacheKey);
    
    if (cached.success && cached.data) {
      return { success: true, data: cached.data };
    }
    
    const result = await this.apiRequest<SystemHealth>('/analytics/system/health');
    
    // Cache the result for 1 minute
    if (result.success) {
      await redisService.set(cacheKey, result.data, 60);
    }
    
    return result;
  }

  // Fetch resource utilization data
  public async getResourceUtilization(): Promise<APIResponse<ResourceUtilization[]>> {
    // Check cache first
    const cacheKey = 'analytics:resource-utilization';
    const cached = await redisService.get<ResourceUtilization[]>(cacheKey);
    
    if (cached.success && cached.data) {
      return { success: true, data: cached.data };
    }
    
    const result = await this.apiRequest<ResourceUtilization[]>('/analytics/system/resources');
    
    // Cache the result for 1 minute
    if (result.success) {
      await redisService.set(cacheKey, result.data, 60);
    }
    
    return result;
  }

  // Fetch user activity data
  public async getUserActivity(): Promise<APIResponse<any>> {
    return this.apiRequest<any>('/analytics/users/activity');
  }

  // Fetch user geography data
  public async getUserGeography(): Promise<APIResponse<any>> {
    return this.apiRequest<any>('/analytics/users/geography');
  }

  // Fetch sports performance data
  public async getSportsPerformance(): Promise<APIResponse<any>> {
    return this.apiRequest<any>('/analytics/sports/performance');
  }

  // Fetch sport popularity data
  public async getSportPopularity(): Promise<APIResponse<any>> {
    return this.apiRequest<any>('/analytics/sports/popularity');
  }

  // Fetch participation statistics
  public async getParticipationStatistics(): Promise<APIResponse<any>> {
    return this.apiRequest<any>('/analytics/sports/participation');
  }

  // Fetch competition overview
  public async getCompetitionOverview(): Promise<APIResponse<any>> {
    return this.apiRequest<any>('/analytics/competitions/overview');
  }

  // Fetch fan engagement data
  public async getFanEngagement(): Promise<APIResponse<any>> {
    return this.apiRequest<any>('/analytics/competitions/engagement');
  }

  // Fetch revenue generation data
  public async getRevenueGeneration(): Promise<APIResponse<any>> {
    return this.apiRequest<any>('/analytics/competitions/revenue');
  }

  // Fetch detailed performance data
  public async getDetailedPerformance(): Promise<APIResponse<any>> {
    // Check cache first
    const cacheKey = 'analytics:detailed-performance';
    const cached = await redisService.get<any>(cacheKey);
    
    if (cached.success && cached.data) {
      return { success: true, data: cached.data };
    }
    
    const result = await this.apiRequest<any>('/analytics/system/performance');
    
    // Cache the result for 1 minute
    if (result.success) {
      await redisService.set(cacheKey, result.data, 60);
    }
    
    return result;
  }

  // Fetch cache statistics
  public async getCacheStats(): Promise<APIResponse<CacheStats>> {
    // Check cache first
    const cacheKey = 'analytics:cache-stats';
    const cached = await redisService.get<CacheStats>(cacheKey);
    
    if (cached.success && cached.data) {
      return { success: true, data: cached.data };
    }
    
    const result = await this.apiRequest<CacheStats>('/cache/stats');
    
    // Cache the result for 2 minutes
    if (result.success) {
      await redisService.set(cacheKey, result.data, 120);
    }
    
    return result;
  }

  // Reports methods
  public async listReports(): Promise<APIResponse<Report[]>> {
    return this.apiRequest<Report[]>('/analytics/reports');
  }

  public async getReport(id: string): Promise<APIResponse<Report>> {
    return this.apiRequest<Report>(`/analytics/reports/${id}`);
  }

  public async generateReport(type: string, parameters: any, format: string): Promise<APIResponse<Report>> {
    return this.apiRequest<Report>('/analytics/reports', {
      method: 'POST',
      body: JSON.stringify({ type, parameters, format })
    });
  }

  public async downloadReport(id: string): Promise<APIResponse<any>> {
    return this.apiRequest<any>(`/analytics/reports/${id}/download`);
  }

  public async deleteReport(id: string): Promise<APIResponse<void>> {
    return this.apiRequest<void>(`/analytics/reports/${id}`, {
      method: 'DELETE'
    });
  }

  // Fetch all required data for the analytics overview
  public async getAnalyticsOverview(): Promise<APIResponse<{
    metrics: Metrics;
    chartData: ChartData;
  }>> {
    try {
      // Check cache first
      const cacheKey = 'analytics:overview';
      const cached = await redisService.get<{ metrics: Metrics; chartData: ChartData }>(cacheKey);
      
      if (cached.success && cached.data) {
        return { success: true, data: cached.data };
      }
      
      // Fetch all required data in parallel
      const [
        userOverviewResult,
        platformUsageResult,
        systemPerformanceResult,
        systemHealthResult,
        userActivityResult,
        matchActivityResult,
        revenueResult,
        performanceResult
      ] = await Promise.all([
        this.getUserOverview(),
        this.getPlatformUsage(),
        this.getSystemPerformance(),
        this.getSystemHealth(),
        this.getUserActivity(),
        this.apiRequest<any>('/analytics/matches/trends'), // Using match trends as match activity
        this.getRevenueGeneration(),
        this.getDetailedPerformance()
      ]);

      // Initialize default metrics
      const metrics: Metrics = {
        totalUsers: 0,
        activeUsers: 0,
        totalMatches: 0,
        liveMatches: 0,
        totalRevenue: 0,
        systemUptime: 0,
        responseTime: 0,
        errorRate: 0
      };

      // Populate metrics with real data
      if (userOverviewResult.success && userOverviewResult.data) {
        metrics.totalUsers = userOverviewResult.data.totalUsers || 0;
        metrics.activeUsers = userOverviewResult.data.activeUsers || 0;
      }

      if (platformUsageResult.success && platformUsageResult.data) {
        metrics.totalMatches = platformUsageResult.data.apiRequests || 0;
      }

      if (systemPerformanceResult.success && systemPerformanceResult.data) {
        metrics.systemUptime = systemPerformanceResult.data.uptime || 0;
        metrics.responseTime = systemPerformanceResult.data.responseTime || 0;
        metrics.errorRate = systemPerformanceResult.data.errorRate || 0;
      }

      if (revenueResult.success && revenueResult.data) {
        metrics.totalRevenue = revenueResult.data.total || 0;
      }

      // Initialize chart data with empty arrays
      const chartData: ChartData = {
        userGrowth: [],
        matchActivity: [],
        revenue: [],
        performance: []
      };

      // Populate chart data with real data
      if (userActivityResult.success && userActivityResult.data) {
        chartData.userGrowth = userActivityResult.data.map((item: any) => ({
          date: item.date || '',
          users: item.count || 0
        }));
      }

      if (matchActivityResult.success && matchActivityResult.data) {
        chartData.matchActivity = matchActivityResult.data.map((item: any) => ({
          date: item.date || item.month || '',
          matches: item.matches || item.count || 0
        }));
      }

      if (revenueResult.success && revenueResult.data) {
        chartData.revenue = revenueResult.data.history || [];
      }

      if (performanceResult.success && performanceResult.data) {
        chartData.performance = performanceResult.data.history || [];
      }
      
      const result = {
        success: true,
        data: {
          metrics,
          chartData
        }
      };
      
      // Cache the result for 1 minute
      if (result.success) {
        await redisService.set(cacheKey, result.data, 60);
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to fetch analytics data')
      };
    }
  }
}

// Export singleton instance
export default new AnalyticsService();