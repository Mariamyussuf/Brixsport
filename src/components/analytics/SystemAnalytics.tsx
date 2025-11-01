'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import MetricCard from '@/components/analytics/charts/MetricCard';
import LineChart from '@/components/analytics/charts/LineChart';
import BarChart from '@/components/analytics/charts/BarChart';
import AreaChart from '@/components/analytics/charts/AreaChart';
import analyticsService, { SystemHealth as FrontendSystemHealth, ResourceUtilization, CacheStats } from '@/services/analyticsService';
import { useSocket } from '@/hooks/useSocket';
import redisService from '@/lib/redis';

// Define proper TypeScript interfaces
interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
  cacheHitRate: number;
}

interface HistoryDataPoint {
  time: string;
  [key: string]: string | number;
}

interface PerformanceData {
  cpuHistory: HistoryDataPoint[];
  memoryHistory: HistoryDataPoint[];
  responseTimeHistory: HistoryDataPoint[];
  throughputHistory: HistoryDataPoint[];
  errorHistory: HistoryDataPoint[];
  networkLatencyHistory: HistoryDataPoint[];
  cacheHitRateHistory: HistoryDataPoint[];
}

interface ServiceStatus {
  name: string;
  status: string;
  uptime: string;
  responseTime: string;
}

interface Alert {
  level: string;
  message: string;
  time: string;
}

interface Incident {
  severity: string;
  title: string;
  duration: string;
  resolved: boolean;
}

interface SystemHealth {
  services: ServiceStatus[];
  alerts: Alert[];
  incidents: Incident[];
}

interface SystemAnalyticsProps {
  className?: string;
}

const SystemAnalytics: React.FC<SystemAnalyticsProps> = ({ className = '' }) => {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLatency: 0,
    responseTime: 0,
    throughput: 0,
    errorRate: 0,
    uptime: 0,
    cacheHitRate: 0
  });

  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    cpuHistory: [],
    memoryHistory: [],
    responseTimeHistory: [],
    throughputHistory: [],
    errorHistory: [],
    networkLatencyHistory: [],
    cacheHitRateHistory: []
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    services: [],
    alerts: [],
    incidents: []
  });

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({
    systemMetrics: true,
    performanceData: true,
    systemHealth: true,
    cacheStats: true,
    networkLatency: true
  });

  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const socket = useSocket(process.env.NEXT_PUBLIC_API_BASE_URL?.replace('http', 'ws') + '/analytics');
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Measure network latency
  const measureNetworkLatency = useCallback(async (): Promise<number> => {
    try {
      // Check if we have a cached value
      const cacheKey = 'network-latency';
      const cachedResult = await redisService.get<number>(cacheKey);
      
      if (cachedResult.success && cachedResult.data !== null) {
        return cachedResult.data ?? 0; // Fix: provide default value
      }
      
      const startTime = Date.now();
      await fetch('/api/ping', { method: 'HEAD' });
      const endTime = Date.now();
      const latency = endTime - startTime;
      
      // Cache the result for 30 seconds
      await redisService.set(cacheKey, latency, 30);
      
      return latency;
    } catch (err) {
      console.error('Network latency measurement failed:', err);
      return 0;
    }
  }, []);

  // Fetch cache statistics
  const fetchCacheStats = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, cacheStats: true }));
      
      // Check if we have cached cache stats
      const cacheKey = 'cache-stats';
      const cachedResult = await redisService.get<CacheStats>(cacheKey);
      
      if (cachedResult.success && cachedResult.data !== null) {
        const cacheStats = cachedResult.data;
        
        setSystemMetrics(prev => ({
          ...prev,
          cacheHitRate: cacheStats?.hitRate ?? 0
        }));
        
        // Add to history
        setPerformanceData(prev => ({
          ...prev,
          cacheHitRateHistory: [
            ...prev.cacheHitRateHistory.slice(-29), // Keep last 30 data points
            {
              time: new Date().toLocaleTimeString(),
              hitRate: cacheStats?.hitRate ?? 0
            }
          ]
        }));
        
        setLoadingStates(prev => ({ ...prev, cacheStats: false }));
        return;
      }
      
      const cacheStatsResult = await analyticsService.getCacheStats();
      
      if (cacheStatsResult.success && cacheStatsResult.data) {
        const cacheStats: CacheStats = cacheStatsResult.data;
        
        setSystemMetrics(prev => ({
          ...prev,
          cacheHitRate: cacheStats.hitRate ?? 0
        }));
        
        // Add to history
        setPerformanceData(prev => ({
          ...prev,
          cacheHitRateHistory: [
            ...prev.cacheHitRateHistory.slice(-29), // Keep last 30 data points
            {
              time: new Date().toLocaleTimeString(),
              hitRate: cacheStats.hitRate ?? 0
            }
          ]
        }));
      }
      
      setLoadingStates(prev => ({ ...prev, cacheStats: false }));
    } catch (err) {
      console.error('Error fetching cache stats:', err);
      setLoadingStates(prev => ({ ...prev, cacheStats: false }));
    }
  }, []);

  // Load system analytics data from API
  const loadData = useCallback(async () => {
    try {
      setError(null);
      
      // Check if we have cached system analytics data
      const cacheKey = `system-analytics-${timeRange}`;
      const cachedResult = await redisService.get<any>(cacheKey);
      
      if (cachedResult.success && cachedResult.data !== null) {
        const cachedData = cachedResult.data;
        
        setSystemMetrics(cachedData.systemMetrics);
        setPerformanceData(cachedData.performanceData);
        setSystemHealth(cachedData.systemHealth);
        setLastUpdated(new Date());
        
        // Update loading states
        setLoadingStates({
          systemMetrics: false,
          performanceData: false,
          systemHealth: false,
          cacheStats: false,
          networkLatency: false
        });
        
        return;
      }
      
      // Fetch system performance data
      const [
        systemPerformanceResult, 
        systemHealthResult, 
        detailedPerformanceResult, 
        resourceUtilizationResult
      ] = await Promise.all([
        analyticsService.getSystemPerformance(),
        analyticsService.getSystemHealth(),
        analyticsService.getDetailedPerformance(),
        analyticsService.getResourceUtilization()
      ]);

      // Process system performance data
      if (systemPerformanceResult.success && systemPerformanceResult.data) {
        const perfData = systemPerformanceResult.data;
        setSystemMetrics(prev => ({
          ...prev,
          responseTime: perfData.responseTime || 0,
          uptime: perfData.uptime || 0,
          errorRate: perfData.errorRate || 0,
          throughput: perfData.throughput || 0
        }));
        setLoadingStates(prev => ({ ...prev, systemMetrics: false }));
      }

      // Process resource utilization data for system metrics
      if (resourceUtilizationResult.success && resourceUtilizationResult.data) {
        const resources: ResourceUtilization[] = resourceUtilizationResult.data;
        
        // Extract specific resource metrics
        const cpuResource = resources.find(r => r.resourceName === 'CPU');
        const memoryResource = resources.find(r => r.resourceName === 'Memory');
        const diskResource = resources.find(r => r.resourceName === 'Disk');
        
        setSystemMetrics(prev => ({
          ...prev,
          cpuUsage: cpuResource ? cpuResource.utilizationPercentage : 0,
          memoryUsage: memoryResource ? memoryResource.utilizationPercentage : 0,
          diskUsage: diskResource ? diskResource.utilizationPercentage : 0
        }));
        setLoadingStates(prev => ({ ...prev, systemMetrics: false }));
      }

      // Process detailed performance data for charts
      if (detailedPerformanceResult.success && detailedPerformanceResult.data) {
        const detailedData = detailedPerformanceResult.data;
        
        // Transform data for charts
        const cpuHistory = detailedData.cpuHistory?.map((item: any) => ({
          time: item.timestamp || item.time || '',
          usage: item.value || item.cpuUsage || 0
        })) || [];
        
        const memoryHistory = detailedData.memoryHistory?.map((item: any) => ({
          time: item.timestamp || item.time || '',
          usage: item.value || item.memoryUsage || 0
        })) || [];
        
        const responseTimeHistory = detailedData.responseTimeHistory?.map((item: any) => ({
          time: item.timestamp || item.time || '',
          responseTime: item.value || item.responseTime || 0
        })) || [];
        
        const throughputHistory = detailedData.throughputHistory?.map((item: any) => ({
          time: item.timestamp || item.time || '',
          requests: item.value || item.throughput || 0
        })) || [];
        
        const errorHistory = detailedData.errorHistory?.map((item: any) => ({
          time: item.timestamp || item.time || '',
          errors: item.value || item.errorCount || 0
        })) || [];

        setPerformanceData({
          cpuHistory,
          memoryHistory,
          responseTimeHistory,
          throughputHistory,
          errorHistory,
          networkLatencyHistory: [],
          cacheHitRateHistory: []
        });
        setLoadingStates(prev => ({ ...prev, performanceData: false }));
      }

      // Process system health data
      if (systemHealthResult.success && systemHealthResult.data) {
        // Transform API data to our component's data structure
        const healthData = systemHealthResult.data;
        
        // Use real data from the API instead of mock data
        const services: ServiceStatus[] = [
          { name: 'API Gateway', status: healthData.apiStatus || 'unknown', uptime: 'N/A', responseTime: 'N/A' },
          { name: 'Database', status: healthData.databaseStatus || 'unknown', uptime: 'N/A', responseTime: 'N/A' },
          { name: 'Cache', status: healthData.cacheStatus || 'unknown', uptime: 'N/A', responseTime: 'N/A' },
          { name: 'Authentication', status: healthData.overallStatus || 'unknown', uptime: 'N/A', responseTime: 'N/A' }
        ];
        
        setSystemHealth({
          services,
          alerts: [], // Would come from a separate alerts API
          incidents: [] // Would come from a separate incidents API
        });
        setLoadingStates(prev => ({ ...prev, systemHealth: false }));
      }
      
      // Cache the data for 1 minute
      const dataToCache = {
        systemMetrics,
        performanceData,
        systemHealth
      };
      
      await redisService.set(cacheKey, dataToCache, 60);

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading system analytics:', err);
      setError('Failed to load system analytics data. Please try again.');
      // Set all loading states to false on error
      setLoadingStates({
        systemMetrics: false,
        performanceData: false,
        systemHealth: false,
        cacheStats: false,
        networkLatency: false
      });
    }
  }, [timeRange, systemMetrics, performanceData, systemHealth]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    // Clear cache before refreshing
    await redisService.del('system-analytics-24h');
    await redisService.del('cache-stats');
    await redisService.del('network-latency');
    
    await loadData();
    await measureNetworkLatency();
    await fetchCacheStats();
  }, [loadData, measureNetworkLatency, fetchCacheStats]);

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        refreshData();
      }, 30000); // Refresh every 30 seconds
    } else if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshData]);

  // Initial data load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Set up WebSocket for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for real-time system metrics updates
    const unsubscribeMetrics = socket.on('analytics:liveMetrics', (data: any) => {
      if (data.metrics) {
        setSystemMetrics(prev => ({
          ...prev,
          ...data.metrics
        }));
      }
      
      if (data.history) {
        setPerformanceData(prev => ({
          ...prev,
          cpuHistory: data.history.cpu || prev.cpuHistory,
          memoryHistory: data.history.memory || prev.memoryHistory,
          responseTimeHistory: data.history.responseTime || prev.responseTimeHistory,
          throughputHistory: data.history.throughput || prev.throughputHistory
        }));
      }
      
      setLastUpdated(new Date());
    });

    // Listen for system health updates
    const unsubscribeHealth = socket.on('system:healthUpdate', (data: any) => {
      if (data.health) {
        setSystemHealth(prev => ({
          ...prev,
          ...data.health
        }));
      }
      setLastUpdated(new Date());
    });

    // Request live metrics subscription
    socket.emit('analytics:subscribeLiveMetrics');

    return () => {
      unsubscribeMetrics?.();
      unsubscribeHealth?.();
      socket.emit('analytics:unsubscribeLiveMetrics');
    };
  }, [socket]);

  // Measure network latency periodically
  useEffect(() => {
    const measureLatency = async () => {
      const latency = await measureNetworkLatency();
      setSystemMetrics(prev => ({
        ...prev,
        networkLatency: latency
      }));
      
      // Add to history
      setPerformanceData(prev => ({
        ...prev,
        networkLatencyHistory: [
          ...prev.networkLatencyHistory.slice(-29), // Keep last 30 data points
          {
            time: new Date().toLocaleTimeString(),
            latency
          }
        ]
      }));
    };

    // Measure immediately
    measureLatency();

    // Measure periodically
    const latencyInterval = setInterval(measureLatency, 60000); // Every minute

    return () => clearInterval(latencyInterval);
  }, [measureNetworkLatency]);

  // Fetch cache stats periodically
  useEffect(() => {
    fetchCacheStats();
    const cacheInterval = setInterval(fetchCacheStats, 120000); // Every 2 minutes
    return () => clearInterval(cacheInterval);
  }, [fetchCacheStats]);

  // Memoized chart data transformations
  const chartData = useMemo(() => {
    return {
      cpuHistory: performanceData.cpuHistory.map(item => ({
        ...item,
        usage: typeof item.usage === 'number' ? item.usage : 0
      })),
      memoryHistory: performanceData.memoryHistory.map(item => ({
        ...item,
        usage: typeof item.usage === 'number' ? item.usage : 0
      })),
      responseTimeHistory: performanceData.responseTimeHistory.map(item => ({
        ...item,
        responseTime: typeof item.responseTime === 'number' ? item.responseTime : 0
      })),
      throughputHistory: performanceData.throughputHistory.map(item => ({
        ...item,
        requests: typeof item.requests === 'number' ? item.requests : 0
      })),
      errorHistory: performanceData.errorHistory.map(item => ({
        ...item,
        errors: typeof item.errors === 'number' ? item.errors : 0
      })),
      networkLatencyHistory: performanceData.networkLatencyHistory.map(item => ({
        ...item,
        latency: typeof item.latency === 'number' ? item.latency : 0
      })),
      cacheHitRateHistory: performanceData.cacheHitRateHistory.map(item => ({
        ...item,
        hitRate: typeof item.hitRate === 'number' ? item.hitRate : 0
      }))
    };
  }, [performanceData]);

  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    // In a real implementation, this would fetch data for the selected time range
  };

  // Export data functionality
  const exportData = () => {
    const data = {
      systemMetrics,
      performanceData,
      systemHealth,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Check if any section is still loading
  const isLoading = Object.values(loadingStates).some(state => state);

  if (isLoading && !error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div data-testid="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">System Analytics</h2>
          <p className="text-gray-400 text-sm">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="autoRefresh" className="text-gray-300 text-sm">
              Auto-refresh
            </label>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="bg-gray-700 text-white rounded px-3 py-1 text-sm"
          >
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
          </select>
          
          <button
            onClick={refreshData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          
          <button
            onClick={exportData}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-300">{error}</span>
          </div>
          <button
            onClick={refreshData}
            className="mt-2 bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="CPU Usage"
          value={`${systemMetrics.cpuUsage.toFixed(1)}%`}
          change="-2.1%"
          trend="down"
          icon="⚡"
          color="blue"
        />
        <MetricCard
          title="Memory Usage"
          value={`${systemMetrics.memoryUsage.toFixed(1)}%`}
          change="+5.3%"
          trend="up"
          icon="🧠"
          color="purple"
        />
        <MetricCard
          title="Response Time"
          value={`${systemMetrics.responseTime.toFixed(0)}ms`}
          change="-8.2%"
          trend="down"
          icon="⏱️"
          color="green"
        />
        <MetricCard
          title="Throughput"
          value={`${systemMetrics.throughput.toFixed(0)} req/s`}
          change="+12.4%"
          trend="up"
          icon="📈"
          color="emerald"
        />
      </div>

      {/* Additional Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Network Latency"
          value={`${systemMetrics.networkLatency.toFixed(0)}ms`}
          change="-1.5%"
          trend="down"
          icon="🌐"
          color="cyan"
        />
        <MetricCard
          title="Error Rate"
          value={`${systemMetrics.errorRate.toFixed(2)}%`}
          change="-0.02%"
          trend="down"
          icon="🚨"
          color="red"
        />
        <MetricCard
          title="System Uptime"
          value={`${systemMetrics.uptime.toFixed(2)}%`}
          change="0%"
          trend="neutral"
          icon="✅"
          color="indigo"
        />
        <MetricCard
          title="Disk Usage"
          value={`${systemMetrics.diskUsage.toFixed(1)}%`}
          change="+1.2%"
          trend="up"
          icon="💾"
          color="orange"
        />
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Usage History */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">CPU Usage History</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Last 24 hours</span>
            </div>
          </div>
          <AreaChart
            data={chartData.cpuHistory}
            xKey="time"
            yKey="usage"
            color="#3b82f6"
            height={300}
          />
        </div>

        {/* Memory Usage History */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Memory Usage History</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Last 24 hours</span>
            </div>
          </div>
          <AreaChart
            data={chartData.memoryHistory}
            xKey="time"
            yKey="usage"
            color="#8b5cf6"
            height={300}
          />
        </div>

        {/* Response Time Trends */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Response Time Trends</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Milliseconds</span>
            </div>
          </div>
          <LineChart
            data={chartData.responseTimeHistory}
            xKey="time"
            yKey="responseTime"
            color="#10b981"
            height={300}
          />
        </div>

        {/* Throughput History */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Request Throughput</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Requests per second</span>
            </div>
          </div>
          <BarChart
            data={chartData.throughputHistory}
            xKey="time"
            yKey="requests"
            color="#10b981"
            height={300}
          />
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Status */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Service Status</h3>
          <div className="space-y-3">
            {systemHealth.services.length > 0 ? (
              systemHealth.services.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      service.status === 'healthy' ? 'bg-green-500' :
                      service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-300">{service.name}</p>
                      <p className="text-xs text-gray-500">{service.uptime} uptime</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">{service.responseTime}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No service data available</p>
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {systemHealth.alerts.length > 0 ? (
              systemHealth.alerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full mt-1 ${
                    alert.level === 'warning' ? 'bg-yellow-500' :
                    alert.level === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{alert.message}</p>
                    <p className="text-xs text-gray-500">{alert.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No alerts at this time</p>
            )}
          </div>
        </div>

        {/* System Incidents */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">System Incidents</h3>
          <div className="space-y-3">
            {systemHealth.incidents.length > 0 ? (
              systemHealth.incidents.map((incident, index) => (
                <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      incident.severity === 'low' ? 'bg-green-500/20 text-green-400' :
                      incident.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {incident.severity}
                    </span>
                    {incident.resolved && (
                      <span className="text-xs text-green-400">✓ Resolved</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-300 mb-1">{incident.title}</p>
                  <p className="text-xs text-gray-500">Duration: {incident.duration}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No incidents reported</p>
            )}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Rate Analysis */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Error Rate Analysis</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Errors per hour</span>
            </div>
          </div>
          <BarChart
            data={chartData.errorHistory}
            xKey="time"
            yKey="errors"
            color="#ef4444"
            height={250}
          />
        </div>

        {/* Performance Metrics Summary */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Performance Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-300">Average Response Time</span>
              <span className="text-sm font-medium text-green-400">{systemMetrics.responseTime.toFixed(0)}ms</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-300">Peak Throughput</span>
              <span className="text-sm font-medium text-blue-400">{systemMetrics.throughput.toFixed(0)} req/s</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-300">Error Rate</span>
              <span className="text-sm font-medium text-orange-400">{systemMetrics.errorRate.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-300">System Uptime</span>
              <span className="text-sm font-medium text-emerald-400">{systemMetrics.uptime.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <span className="text-sm text-gray-300">Cache Hit Rate</span>
              <span className="text-sm font-medium text-purple-400">{systemMetrics.cacheHitRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Utilization Details */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Resource Utilization Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-2">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeDasharray={`${systemMetrics.cpuUsage * 1.13}, 113`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{systemMetrics.cpuUsage.toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">CPU Usage</p>
          </div>

          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-2">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="3"
                  strokeDasharray={`${systemMetrics.memoryUsage * 1.13}, 113`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{systemMetrics.memoryUsage.toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">Memory Usage</p>
          </div>

          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-2">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeDasharray={`${systemMetrics.diskUsage * 1.13}, 113`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{systemMetrics.diskUsage.toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">Disk Usage</p>
          </div>

          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-2">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3"
                  strokeDasharray={`${(systemMetrics.uptime * 1.13)}, 113`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{systemMetrics.uptime.toFixed(2)}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">System Uptime</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAnalytics;