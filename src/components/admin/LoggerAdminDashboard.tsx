import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Logger } from '@/lib/adminService';
import EnhancedLoggerManagement from '@/components/logger/admin/EnhancedLoggerManagement';

const LoggerAdminDashboard = () => {
  const {
    loggers,
    competitions,
    matches,
    loading,
    error,
    loadLoggers,
    loadLoggerCompetitions,
    loadLoggerMatches,
    createLogger,
    updateLogger,
    deleteLogger,
    suspendLogger,
    activateLogger,
    createLoggerMatch,
    updateLoggerMatch,
    addLoggerEvent,
    selectLogger
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard with Logger Capabilities</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

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
            onClick={() => setActiveTab('loggers')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'loggers'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Logger Management
          </button>
          <button
            onClick={() => setActiveTab('competitions')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'competitions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Competitions
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'matches'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Matches
          </button>
        </nav>
      </div>

      {/* Dashboard Content */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Total Loggers</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{loggers.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Active Competitions</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{competitions.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Total Matches</h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{matches.length}</p>
          </div>
        </div>
      )}

      {/* Logger Management Content */}
      {activeTab === 'loggers' && (
        <EnhancedLoggerManagement />
      )}

      {/* Competitions Content */}
      {activeTab === 'competitions' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Competitions Management</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage competitions and assign them to loggers.
          </p>
        </div>
      )}

      {/* Matches Content */}
      {activeTab === 'matches' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Matches Management</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage matches and assign them to specific loggers.
          </p>
        </div>
      )}
    </div>
  );
};

export default LoggerAdminDashboard;