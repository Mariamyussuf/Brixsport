import React, { useState } from 'react';
import { useLoggerAuth } from '@/contexts/LoggerAuthContext';
import LoggerNotifications from '@/components/logger/notifications/LoggerNotifications';
import MatchTrackerPage from '@/components/logger/matches/MatchTrackerPage';

const LoggerDashboard = () => {
  const { user, isAuthenticated } = useLoggerAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Security check - only show dashboard to authenticated loggers
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need to be logged in with logger permissions to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{process.env.NEXT_PUBLIC_LOGGER_APP_NAME || 'Logger Dashboard'}</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Welcome, {user?.name || 'Logger'}! You are logged in to the {process.env.NEXT_PUBLIC_LOGGER_APP_NAME || 'BrixSports Logger'} platform.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <LoggerNotifications />
            <div className="mt-4 md:mt-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <svg className="mr-1.5 h-2 w-2 text-blue-400" fill="currentColor" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Logger Role
              </span>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'matches'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Match Logging
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Statistics
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Reports
            </button>
          </nav>
        </div>
        
        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Match Logging</h2>
              <p className="text-blue-600 dark:text-blue-300">
                Log new matches and update ongoing events
              </p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">Player Stats</h2>
              <p className="text-green-600 dark:text-green-300">
                Record player performance and statistics
              </p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <h2 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">Reports</h2>
              <p className="text-purple-600 dark:text-purple-300">
                Generate match reports and analytics
              </p>
            </div>
          </div>
        )}
        
        {/* Match Logging Content - Using our enhanced MatchTrackerPage */}
        {activeTab === 'matches' && (
          <div className="mt-6">
            <MatchTrackerPage />
          </div>
        )}
        
        {/* Statistics Content */}
        {activeTab === 'stats' && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Statistics Overview</h2>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
              <p className="text-gray-600 dark:text-gray-300">
                View player and team statistics.
              </p>
            </div>
          </div>
        )}
        
        {/* Reports Content */}
        {activeTab === 'reports' && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Reports</h2>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
              <p className="text-gray-600 dark:text-gray-300">
                Generate and export match reports.
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="bg-gray-200 dark:bg-gray-600 border-2 border-dashed rounded-xl w-16 h-16" />
            <div className="ml-4">
              <h3 className="font-medium text-gray-800 dark:text-white">Football Match - Team A vs Team B</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Logged 2 hours ago</p>
            </div>
          </div>
          
          <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="bg-gray-200 dark:bg-gray-600 border-2 border-dashed rounded-xl w-16 h-16" />
            <div className="ml-4">
              <h3 className="font-medium text-gray-800 dark:text-white">Basketball Match - Team C vs Team D</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Logged 1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoggerDashboard;