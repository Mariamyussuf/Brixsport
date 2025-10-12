'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Users, Activity, TrendingUp, Clock, Database, Zap, 
  Eye, MessageSquare, Calendar, AlertTriangle, CheckCircle,
  RefreshCw, Download, Filter
} from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

interface AnalyticsData {
  userEngagement: any[];
  activityTrends: any[];
  realtimeMetrics: any;
  performanceMetrics: any[];
  retentionData: any[];
  activityHeatmap: any;
  cacheStats: any;
  systemHealth: any;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, value, change, changeType = 'neutral', icon, loading = false 
}) => {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {loading ? (
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-16 rounded"></div>
            ) : (
              value
            )}
          </p>
          {change && (
            <p className={`text-sm ${changeColor} flex items-center mt-1`}>
              {changeType === 'positive' && <TrendingUp className="w-4 h-4 mr-1" />}
              {change}
            </p>
          )}
        </div>
        <div className="text-blue-600 dark:text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  );
};

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    userEngagement: [],
    activityTrends: [],
    realtimeMetrics: {},
    performanceMetrics: [],
    retentionData: [],
    activityHeatmap: {},
    cacheStats: {},
    systemHealth: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const socket = useSocket();

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      const endpoints = [
        '/api/v1/user-activity/analytics/overview',
        '/api/v1/user-activity/analytics/trends',
        '/api/v1/user-activity/analytics/engagement',
        '/api/v1/user-activity/analytics/retention',
        '/api/v1/user-activity/live/stats'
      ];

      const responses = await Promise.all(
        endpoints.map(endpoint => 
          fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }).then(res => res.json())
        )
      );

      const [overview, trends, engagement, retention, liveStats] = responses;

      setAnalyticsData({
        userEngagement: engagement.data || [],
        activityTrends: trends.data || [],
        realtimeMetrics: liveStats.data || {},
        performanceMetrics: overview.data?.performance || [],
        retentionData: retention.data || [],
        activityHeatmap: trends.data?.heatmap || {},
        cacheStats: liveStats.data?.cache || {},
        systemHealth: liveStats.data?.system || {}
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Join analytics room
    socket.emit('analytics:subscribeLiveMetrics');

    // Listen for real-time updates
    const handleLiveMetrics = (data: any) => {
      setAnalyticsData(prev => ({
        ...prev,
        realtimeMetrics: { ...prev.realtimeMetrics, ...data }
      }));
      setLastUpdated(new Date());
    };

    const handleActivityUpdate = (data: any) => {
      setAnalyticsData(prev => ({
        ...prev,
        activityTrends: [data, ...prev.activityTrends.slice(0, 49)]
      }));
    };

    const handleEngagementUpdate = (data: any) => {
      setAnalyticsData(prev => ({
        ...prev,
        userEngagement: prev.userEngagement.map(user => 
          user.userId === data.userId ? { ...user, ...data.engagement } : user
        )
      }));
    };

    const handlePerformanceUpdate = (data: any) => {
      setAnalyticsData(prev => ({
        ...prev,
        performanceMetrics: [data.metrics, ...prev.performanceMetrics.slice(0, 99)]
      }));
    };

    const handleCacheStats = (data: any) => {
      setAnalyticsData(prev => ({
        ...prev,
        cacheStats: data.stats
      }));
    };

    const handleSystemHealth = (data: any) => {
      setAnalyticsData(prev => ({
        ...prev,
        systemHealth: data.health
      }));
    };

    socket.on('analytics:liveMetrics', handleLiveMetrics);
    socket.on('analytics:activityUpdate', handleActivityUpdate);
    socket.on('analytics:engagementUpdate', handleEngagementUpdate);
    socket.on('analytics:performanceUpdate', handlePerformanceUpdate);
    socket.on('analytics:cacheStats', handleCacheStats);
    socket.on('system:healthUpdate', handleSystemHealth);

    return () => {
      socket.off('analytics:liveMetrics', handleLiveMetrics);
      socket.off('analytics:activityUpdate', handleActivityUpdate);
      socket.off('analytics:engagementUpdate', handleEngagementUpdate);
      socket.off('analytics:performanceUpdate', handlePerformanceUpdate);
      socket.off('analytics:cacheStats', handleCacheStats);
      socket.off('system:healthUpdate', handleSystemHealth);
      socket.emit('analytics:unsubscribeLiveMetrics');
    };
  }, [socket]);

  // Auto-refresh functionality
  useEffect(() => {
    fetchAnalyticsData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchAnalyticsData, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [fetchAnalyticsData, autoRefresh]);

  // Export data functionality
  const exportData = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch('/api/v1/user-activity/reports/activity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format,
          includeDetails: true,
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </button>
          
          <button
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportData('json')}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
            <button
              onClick={() => exportData('csv')}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Users"
          value={analyticsData.realtimeMetrics.active_users || 0}
          change="+12% from yesterday"
          changeType="positive"
          icon={<Users className="w-8 h-8" />}
          loading={loading}
        />
        <MetricCard
          title="Total Activities Today"
          value={analyticsData.realtimeMetrics.activities_today || 0}
          change="+8% from yesterday"
          changeType="positive"
          icon={<Activity className="w-8 h-8" />}
          loading={loading}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${Math.round(analyticsData.realtimeMetrics.avg_response_time_ms || 0)}ms`}
          change="-5ms from yesterday"
          changeType="positive"
          icon={<Zap className="w-8 h-8" />}
          loading={loading}
        />
        <MetricCard
          title="Cache Hit Rate"
          value={`${Math.round((analyticsData.cacheStats.hits / (analyticsData.cacheStats.hits + analyticsData.cacheStats.misses) * 100) || 0)}%`}
          change="+2% from yesterday"
          changeType="positive"
          icon={<Database className="w-8 h-8" />}
          loading={loading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trends */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.activityTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="activity_count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Engagement Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Engagement Levels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Highly Active', value: analyticsData.userEngagement.filter(u => u.engagement_level === 'highly_active').length },
                  { name: 'Active', value: analyticsData.userEngagement.filter(u => u.engagement_level === 'active').length },
                  { name: 'Moderate', value: analyticsData.userEngagement.filter(u => u.engagement_level === 'moderate').length },
                  { name: 'Inactive', value: analyticsData.userEngagement.filter(u => u.engagement_level === 'inactive').length }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.userEngagement.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">API Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.performanceMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="response_time" stroke="#8884d8" name="Response Time (ms)" />
              <Line type="monotone" dataKey="requests_per_minute" stroke="#82ca9d" name="Requests/min" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Retention */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Retention</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.retentionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cohort_month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="month_1_retention" fill="#8884d8" name="Month 1" />
              <Bar dataKey="month_3_retention" fill="#82ca9d" name="Month 3" />
              <Bar dataKey="month_6_retention" fill="#ffc658" name="Month 6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* System Health Status */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Database</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Connected</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Cache</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analyticsData.cacheStats.size || 0} items cached
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">WebSocket</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {analyticsData.systemHealth.activeConnections || 0} active connections
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
