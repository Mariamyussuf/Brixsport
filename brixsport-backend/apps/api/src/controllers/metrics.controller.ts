import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';

export const metricsController = {
  getMetrics: async (req: Request, res: Response) => {
    try {
      // Get real system metrics from analytics service
      const systemPerformanceResult = await analyticsService.getSystemPerformance();
      const platformUsageResult = await analyticsService.getPlatformUsage();
      const userOverviewResult = await analyticsService.getUserOverview();
      
      if (!systemPerformanceResult.success || !platformUsageResult.success || !userOverviewResult.success) {
        return res.status(500).json({
          error: 'Failed to fetch metrics'
        });
      }
      
      const systemPerformance = systemPerformanceResult.data;
      const platformUsage = platformUsageResult.data;
      const userOverview = userOverviewResult.data;
      
      res.status(200).json({
        metrics: {
          http_requests_total: platformUsage.apiRequests,
          http_request_duration_seconds: systemPerformance.responseTime / 1000,
          api_response_time_seconds: systemPerformance.responseTime / 1000,
          active_users: userOverview.activeUsers,
          active_connections: 0, // Would need WebSocket service to get this
          database_connections: 0, // Would need database connection pool metrics
          cache_hit_ratio: 0 // Would need cache service metrics
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to fetch metrics',
        details: error.message
      });
    }
  }
};