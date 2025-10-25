'use client';

import React, { useState, useEffect } from 'react';
import MetricCard from '@/components/analytics/charts/MetricCard';
import LineChart from '@/components/analytics/charts/LineChart';
import BarChart from '@/components/analytics/charts/BarChart';
import PieChart from '@/components/analytics/charts/PieChart';
import AreaChart from '@/components/analytics/charts/AreaChart';
import analyticsService from '@/services/analyticsService';

// Define proper TypeScript interfaces
interface Metrics {
  totalUsers: number;
  activeUsers: number;
  totalMatches: number;
  liveMatches: number;
  totalRevenue: number;
  systemUptime: number;
  responseTime: number;
  errorRate: number;
}

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

interface ChartData {
  userGrowth: ChartDataPoint[];
  matchActivity: ChartDataPoint[];
  revenue: ChartDataPoint[];
  performance: ChartDataPoint[];
}

interface AnalyticsOverviewProps {
  className?: string;
}

const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<Metrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalMatches: 0,
    liveMatches: 0,
    totalRevenue: 0,
    systemUptime: 0,
    responseTime: 0,
    errorRate: 0
  });

  const [chartData, setChartData] = useState<ChartData>({
    userGrowth: [],
    matchActivity: [],
    revenue: [],
    performance: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load analytics data from API
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch real analytics data from backend services
        const result = await analyticsService.getAnalyticsOverview();
        
        if (result.success && result.data) {
          setMetrics(result.data.metrics);
          setChartData(result.data.chartData);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading analytics data:', error);
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
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={metrics.totalUsers.toLocaleString()}
          change="+12.5%"
          trend="up"
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Active Users"
          value={metrics.activeUsers.toLocaleString()}
          change="+8.2%"
          trend="up"
          icon="🔥"
          color="green"
        />
        <MetricCard
          title="Total Matches"
          value={metrics.totalMatches.toLocaleString()}
          change="+15.3%"
          trend="up"
          icon="⚽"
          color="purple"
        />
        <MetricCard
          title="Live Matches"
          value={metrics.liveMatches.toString()}
          change="+2.1%"
          trend="up"
          icon="🔴"
          color="red"
        />
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Revenue"
          value={`$${metrics.totalRevenue.toLocaleString()}`}
          change="+14.2%"
          trend="up"
          icon="💰"
          color="emerald"
        />
        <MetricCard
          title="System Uptime"
          value={`${metrics.systemUptime}%`}
          change="0%"
          trend="neutral"
          icon="⚡"
          color="indigo"
        />
        <MetricCard
          title="Avg Response Time"
          value={`${metrics.responseTime}ms`}
          change="-8.5%"
          trend="down"
          icon="⏱️"
          color="cyan"
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate}%`}
          change="-0.01%"
          trend="down"
          icon="🚨"
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">User Growth</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Total Users</span>
            </div>
          </div>
          <LineChart
            data={chartData.userGrowth}
            xKey="date"
            yKey="users"
            color="#3b82f6"
            height={300}
          />
        </div>

        {/* Match Activity Chart */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Match Activity</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Matches per Month</span>
            </div>
          </div>
          <BarChart
            data={chartData.matchActivity}
            xKey="date"
            yKey="matches"
            color="#8b5cf6"
            height={300}
          />
        </div>

        {/* Revenue Chart */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Revenue Trend</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Monthly Revenue</span>
            </div>
          </div>
          <AreaChart
            data={chartData.revenue}
            xKey="date"
            yKey="revenue"
            color="#10b981"
            height={300}
          />
        </div>

        {/* Performance Chart */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">System Performance</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Response Time (ms)</span>
            </div>
          </div>
          <LineChart
            data={chartData.performance}
            xKey="date"
            yKey="responseTime"
            color="#06b6d4"
            height={300}
          />
        </div>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'New user registered', time: '2 minutes ago', type: 'user' },
              { action: 'Match started: Team A vs Team B', time: '5 minutes ago', type: 'match' },
              { action: 'Payment processed: $49.99', time: '8 minutes ago', type: 'payment' },
              { action: 'System backup completed', time: '15 minutes ago', type: 'system' },
              { action: 'New team created', time: '22 minutes ago', type: 'team' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'user' ? 'bg-blue-500' :
                  activity.type === 'match' ? 'bg-purple-500' :
                  activity.type === 'payment' ? 'bg-green-500' :
                  activity.type === 'system' ? 'bg-cyan-500' : 'bg-gray-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-300">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
          <div className="space-y-4">
            {[
              { service: 'API Server', status: 'healthy', uptime: '99.9%' },
              { service: 'Database', status: 'healthy', uptime: '99.8%' },
              { service: 'Redis Cache', status: 'healthy', uptime: '99.7%' },
              { service: 'WebSocket', status: 'healthy', uptime: '99.9%' },
              { service: 'CDN', status: 'warning', uptime: '98.5%' }
            ].map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    service.status === 'healthy' ? 'bg-green-500' :
                    service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-gray-300">{service.service}</span>
                </div>
                <span className="text-sm text-gray-500">{service.uptime}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Content */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Top Performing</h3>
          <div className="space-y-4">
            {[
              { item: 'Premier League Match', metric: '45.2K views', change: '+12%' },
              { item: 'Championship Final', metric: '32.8K views', change: '+8%' },
              { item: 'Youth Tournament', metric: '28.1K views', change: '+15%' },
              { item: 'Player Profile: Messi', metric: '22.5K views', change: '+5%' },
              { item: 'Team Stats: Liverpool', metric: '18.9K views', change: '+9%' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">{item.item}</p>
                  <p className="text-xs text-gray-500">{item.metric}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  item.change.startsWith('+') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {item.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverview;