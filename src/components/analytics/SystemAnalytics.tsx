'use client';

import React, { useState, useEffect } from 'react';
import MetricCard from '@/components/analytics/charts/MetricCard';
import LineChart from '@/components/analytics/charts/LineChart';
import BarChart from '@/components/analytics/charts/BarChart';
import AreaChart from '@/components/analytics/charts/AreaChart';
import analyticsService, { SystemHealth as FrontendSystemHealth, ResourceUtilization } from '@/services/analyticsService';

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
    uptime: 0
  });

  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    cpuHistory: [],
    memoryHistory: [],
    responseTimeHistory: [],
    throughputHistory: [],
    errorHistory: []
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    services: [],
    alerts: [],
    incidents: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load system analytics data from API
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch system performance data
        const [systemPerformanceResult, systemHealthResult, detailedPerformanceResult, resourceUtilizationResult] = await Promise.all([
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
            errorHistory
          });
        }

        // In a real implementation, system health data would come from the API
        // For now, we'll initialize with empty arrays to remove mock data
        setSystemHealth({
          services: [],
          alerts: [],
          incidents: []
        });

        setLoading(false);
      } catch (error) {
        console.error('Error loading system analytics:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
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
            data={performanceData.cpuHistory}
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
            data={performanceData.memoryHistory}
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
            data={performanceData.responseTimeHistory}
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
            data={performanceData.throughputHistory}
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
            data={performanceData.errorHistory}
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
              <span className="text-sm font-medium text-purple-400">94.2%</span>
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