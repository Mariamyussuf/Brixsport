'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnalyticsOverview from './AnalyticsOverview';
import UserAnalytics from './UserAnalytics';
import SystemAnalytics from './SystemAnalytics';
import BusinessIntelligence from './BusinessIntelligence';
import RealTimeMetrics from './RealTimeMetrics';
import AnalyticsReports from './AnalyticsReports';
import AnalyticsSettings from './AnalyticsSettings';

interface AnalyticsDashboardProps {
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  const navigationItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📊',
      description: 'Dashboard overview and key metrics'
    },
    {
      id: 'users',
      label: 'User Analytics',
      icon: '👥',
      description: 'User behavior and engagement metrics'
    },
    {
      id: 'system',
      label: 'System Performance',
      icon: '⚡',
      description: 'System health and performance metrics'
    },
    {
      id: 'business',
      label: 'Business Intelligence',
      icon: '📈',
      description: 'Revenue, engagement, and growth metrics'
    },
    {
      id: 'realtime',
      label: 'Real-time Metrics',
      icon: '🔴',
      description: 'Live data and real-time monitoring'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: '📋',
      description: 'Generate and view analytics reports'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      description: 'Analytics configuration and settings'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AnalyticsOverview />;
      case 'users':
        return <UserAnalytics />;
      case 'system':
        return <SystemAnalytics />;
      case 'business':
        return <BusinessIntelligence />;
      case 'realtime':
        return <RealTimeMetrics />;
      case 'reports':
        return <AnalyticsReports />;
      case 'settings':
        return <AnalyticsSettings />;
      default:
        return <AnalyticsOverview />;
    }
  };

  return (
    <div className={`flex min-h-screen bg-gray-900 ${className}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-16'} bg-gradient-to-b from-gray-800 to-gray-900 text-white transition-all duration-300 shadow-2xl border-r border-gray-700/50`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center'}`}>
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              {sidebarOpen && (
                <div>
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    Analytics
                  </span>
                  <p className="text-xs text-gray-400">Dashboard</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
                title={!sidebarOpen ? item.description : undefined}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {sidebarOpen && (
                  <div className="flex-1 text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-400 group-hover:text-gray-300">
                      {item.description}
                    </div>
                  </div>
                )}
                {activeTab === item.id && sidebarOpen && (
                  <div className="w-2 h-2 bg-white rounded-full flex-shrink-0" />
                )}
              </button>
            ))}
          </nav>

          {/* Footer */}
          {sidebarOpen && (
            <div className="absolute bottom-4 left-0 right-0 px-4">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-8 h-8 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">Analytics Admin</p>
                    <p className="text-xs text-gray-400 truncate">Administrator</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-gray-700/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {navigationItems.find(item => item.id === activeTab)?.label || 'Analytics Dashboard'}
              </h1>
              <p className="text-gray-400 mt-1">
                {navigationItems.find(item => item.id === activeTab)?.description || 'Comprehensive analytics and insights'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Real-time indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-400">Live</span>
              </div>

              {/* Time range selector */}
              <select className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>

              {/* Refresh button */}
              <button className="bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg p-2 text-gray-300 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
