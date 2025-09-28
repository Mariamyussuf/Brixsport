'use client';

import React, { useState, useEffect } from 'react';
import MetricCard from '@/components/analytics/charts/MetricCard';
import LineChart from '@/components/analytics/charts/LineChart';

interface RealTimeMetricsProps {
  className?: string;
}

const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({ className = '' }) => {
  const [liveMetrics, setLiveMetrics] = useState({
    activeUsers: 0,
    liveMatches: 0,
    concurrentConnections: 0,
    apiRequestsPerSecond: 0,
    dataTransferRate: 0,
    serverResponseTime: 0
  });

  const [realTimeData, setRealTimeData] = useState({
    activeUsersHistory: [] as Array<{ time: string; users: number }>,
    liveMatchesHistory: [] as Array<{ time: string; matches: number }>,
    apiRequestsHistory: [] as Array<{ time: string; requests: number }>,
    responseTimeHistory: [] as Array<{ time: string; responseTime: number }>
  });

  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
  }>>([]);

  const [loading, setLoading] = useState(true);

  // Simulate real-time data updates
  useEffect(() => {
    const initialLoad = () => {
      setLiveMetrics({
        activeUsers: 2847,
        liveMatches: 23,
        concurrentConnections: 12543,
        apiRequestsPerSecond: 1456,
        dataTransferRate: 2.3,
        serverResponseTime: 145
      });

      // Initialize with some historical data
      const now = new Date();
      const historyData = Array.from({ length: 20 }, (_, i) => {
        const time = new Date(now.getTime() - (19 - i) * 30000); // 30 second intervals
        return {
          time: time.toLocaleTimeString(),
          users: Math.floor(Math.random() * 500) + 2500,
          matches: Math.floor(Math.random() * 10) + 15,
          requests: Math.floor(Math.random() * 300) + 1200,
          responseTime: Math.floor(Math.random() * 50) + 120
        };
      });

      setRealTimeData({
        activeUsersHistory: historyData.map(d => ({ time: d.time, users: d.users })),
        liveMatchesHistory: historyData.map(d => ({ time: d.time, matches: d.matches })),
        apiRequestsHistory: historyData.map(d => ({ time: d.time, requests: d.requests })),
        responseTimeHistory: historyData.map(d => ({ time: d.time, responseTime: d.responseTime }))
      });

      setLoading(false);
    };

    initialLoad();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 100) - 50,
        liveMatches: Math.max(0, prev.liveMatches + Math.floor(Math.random() * 4) - 2),
        concurrentConnections: prev.concurrentConnections + Math.floor(Math.random() * 200) - 100,
        apiRequestsPerSecond: prev.apiRequestsPerSecond + Math.floor(Math.random() * 100) - 50,
        dataTransferRate: Math.max(0, prev.dataTransferRate + (Math.random() - 0.5) * 0.5),
        serverResponseTime: Math.max(50, prev.serverResponseTime + Math.floor(Math.random() * 20) - 10)
      }));

      // Update history data
      const now = new Date().toLocaleTimeString();
      setRealTimeData(prev => ({
        activeUsersHistory: [
          ...prev.activeUsersHistory.slice(1),
          { time: now, users: liveMetrics.activeUsers }
        ],
        liveMatchesHistory: [
          ...prev.liveMatchesHistory.slice(1),
          { time: now, matches: liveMetrics.liveMatches }
        ],
        apiRequestsHistory: [
          ...prev.apiRequestsHistory.slice(1),
          { time: now, requests: liveMetrics.apiRequestsPerSecond }
        ],
        responseTimeHistory: [
          ...prev.responseTimeHistory.slice(1),
          { time: now, responseTime: liveMetrics.serverResponseTime }
        ]
      }));

      // Generate random alerts occasionally
      if (Math.random() < 0.1) { // 10% chance
        const alertTypes = ['info', 'warning', 'error'] as const;
        const messages = [
          'New user registration spike detected',
          'API response time increased by 15%',
          'Live match started: Premier League Final',
          'Server CPU usage above 80%',
          'Database connection pool at 90% capacity',
          'Cache hit rate dropped below 90%',
          'New feature deployment completed',
          'Security scan completed successfully'
        ];

        const newAlert = {
          id: Date.now().toString(),
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          timestamp: new Date().toLocaleTimeString()
        };

        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]); // Keep last 10 alerts
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
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
      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Active Users"
          value={liveMetrics.activeUsers.toLocaleString()}
          change="+2.1%"
          trend="up"
          icon="🔴"
          color="red"
        />
        <MetricCard
          title="Live Matches"
          value={liveMetrics.liveMatches.toString()}
          change="+1.2%"
          trend="up"
          icon="⚽"
          color="green"
        />
        <MetricCard
          title="Concurrent Connections"
          value={liveMetrics.concurrentConnections.toLocaleString()}
          change="+3.4%"
          trend="up"
          icon="🌐"
          color="blue"
        />
        <MetricCard
          title="API Requests/sec"
          value={liveMetrics.apiRequestsPerSecond.toString()}
          change="+5.2%"
          trend="up"
          icon="⚡"
          color="purple"
        />
        <MetricCard
          title="Data Transfer"
          value={`${liveMetrics.dataTransferRate} MB/s`}
          change="+1.8%"
          trend="up"
          icon="📊"
          color="cyan"
        />
        <MetricCard
          title="Response Time"
          value={`${liveMetrics.serverResponseTime}ms`}
          change="-2.1%"
          trend="down"
          icon="⏱️"
          color="orange"
        />
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Users Real-time */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Active Users (Real-time)</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full bg-red-500 animate-pulse`} />
              <span className="text-sm text-gray-400">Live data</span>
            </div>
          </div>
          <LineChart
            data={realTimeData.activeUsersHistory}
            xKey="time"
            yKey="users"
            color="#ef4444"
            height={300}
          />
        </div>

        {/* Live Matches Real-time */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Live Matches (Real-time)</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full bg-green-500 animate-pulse`} />
              <span className="text-sm text-gray-400">Live data</span>
            </div>
          </div>
          <LineChart
            data={realTimeData.liveMatchesHistory}
            xKey="time"
            yKey="matches"
            color="#10b981"
            height={300}
          />
        </div>

        {/* API Requests Real-time */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">API Requests/sec (Real-time)</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full bg-purple-500 animate-pulse`} />
              <span className="text-sm text-gray-400">Live data</span>
            </div>
          </div>
          <LineChart
            data={realTimeData.apiRequestsHistory}
            xKey="time"
            yKey="requests"
            color="#8b5cf6"
            height={300}
          />
        </div>

        {/* Response Time Real-time */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Response Time (Real-time)</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full bg-orange-500 animate-pulse`} />
              <span className="text-sm text-gray-400">Live data</span>
            </div>
          </div>
          <LineChart
            data={realTimeData.responseTimeHistory}
            xKey="time"
            yKey="responseTime"
            color="#f59e0b"
            height={300}
          />
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Alerts */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Real-time Alerts</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-400">Live feed</span>
            </div>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent alerts</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg">
                  <div className={`w-3 h-3 rounded-full mt-1 ${
                    alert.type === 'error' ? 'bg-red-500' :
                    alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{alert.message}</p>
                    <p className="text-xs text-gray-500">{alert.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Match Status */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Live Match Status</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-400">{liveMetrics.liveMatches} active</span>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { teams: 'Chelsea vs Arsenal', score: '2-1', time: '67\'', viewers: 15420 },
              { teams: 'Manchester City vs Liverpool', score: '1-1', time: '45\'', viewers: 22150 },
              { teams: 'Tottenham vs Newcastle', score: '0-2', time: '78\'', viewers: 12890 },
              { teams: 'Brighton vs Wolves', score: '3-0', time: '82\'', viewers: 9870 },
              { teams: 'Aston Villa vs West Ham', score: '1-0', time: '34\'', viewers: 11230 }
            ].map((match, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-white">{match.teams}</p>
                    <p className="text-xs text-gray-500">{match.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{match.score}</p>
                  <p className="text-xs text-gray-500">{match.viewers.toLocaleString()} viewers</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health Indicators */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">System Health Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CPU Usage */}
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
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
                  strokeDasharray={`${(liveMetrics.activeUsers / 3000) * 113}, 113`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white">CPU</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">System Load</p>
            <p className="text-lg font-bold text-blue-400">
              {Math.round((liveMetrics.activeUsers / 3000) * 100)}%
            </p>
          </div>

          {/* Memory Usage */}
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray={`${(liveMetrics.concurrentConnections / 15000) * 113}, 113`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white">MEM</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">Memory Usage</p>
            <p className="text-lg font-bold text-green-400">
              {Math.round((liveMetrics.concurrentConnections / 15000) * 100)}%
            </p>
          </div>

          {/* Network I/O */}
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
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
                  strokeDasharray={`${(liveMetrics.dataTransferRate / 5) * 113}, 113`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white">NET</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">Network I/O</p>
            <p className="text-lg font-bold text-purple-400">
              {liveMetrics.dataTransferRate.toFixed(1)} MB/s
            </p>
          </div>

          {/* API Health */}
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-3">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
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
                  strokeDasharray={`${(liveMetrics.serverResponseTime / 200) * 113}, 113`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-white">API</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">API Health</p>
            <p className="text-lg font-bold text-orange-400">
              {liveMetrics.serverResponseTime}ms
            </p>
          </div>
        </div>
      </div>

      {/* Live Data Stream */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Live Data Stream</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-400">Real-time updates</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {liveMetrics.activeUsers.toLocaleString()}
            </div>
            <p className="text-sm text-gray-400">Active Users</p>
            <div className="mt-2 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {liveMetrics.liveMatches}
            </div>
            <p className="text-sm text-gray-400">Live Matches</p>
            <div className="mt-2 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-400 mb-1">
              {liveMetrics.apiRequestsPerSecond}
            </div>
            <p className="text-sm text-gray-400">API Requests/sec</p>
            <div className="mt-2 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          <div className="text-center p-4 bg-gray-700/50 rounded-lg">
            <div className="text-2xl font-bold text-orange-400 mb-1">
              {liveMetrics.serverResponseTime}ms
            </div>
            <p className="text-sm text-gray-400">Response Time</p>
            <div className="mt-2 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMetrics;
