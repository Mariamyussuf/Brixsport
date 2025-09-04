"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const LoggerDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Mock logger data for testing
  const [loggerStats] = useState({
    totalMatches: 45,
    activeMatches: 3,
    completedToday: 8,
    avgMatchDuration: '95 min'
  });

  const [recentMatches] = useState([
    { id: 1, teams: 'Arsenal vs Chelsea', status: 'Live', time: '67:32' },
    { id: 2, teams: 'Liverpool vs Man City', status: 'Completed', score: '2-1' },
    { id: 3, teams: 'Tottenham vs Newcastle', status: 'Scheduled', time: '15:00' }
  ]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>Please log in to access the logger dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Sidebar */}
      <div className={`bg-gray-800 text-white w-64 space-y-6 py-7 px-4 transition-all duration-300 ${sidebarOpen ? 'block' : 'hidden'} md:block`}>
        <div className="flex items-center space-x-3 px-2">
          <div className="bg-blue-600 rounded-lg p-2">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold">Logger</span>
            <p className="text-xs text-gray-400">Match Logging</p>
          </div>
        </div>

        <nav className="mt-8">
          <ul className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'matches', label: 'Live Matches', icon: '⚽' },
              { id: 'history', label: 'Match History', icon: '📋' },
              { id: 'stats', label: 'Statistics', icon: '📈' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden mr-3 text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-white">Logger Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Welcome, {user?.name || 'Logger'}</span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0) || 'L'}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Total Matches', value: loggerStats.totalMatches, icon: '⚽', color: 'bg-blue-600' },
                  { title: 'Active Matches', value: loggerStats.activeMatches, icon: '🔴', color: 'bg-red-600' },
                  { title: 'Completed Today', value: loggerStats.completedToday, icon: '✅', color: 'bg-green-600' },
                  { title: 'Avg Duration', value: loggerStats.avgMatchDuration, icon: '⏱️', color: 'bg-purple-600' }
                ].map((stat, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">{stat.title}</p>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                      </div>
                      <div className={`${stat.color} rounded-lg p-3 text-2xl`}>
                        {stat.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Matches */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Recent Matches</h3>
                <div className="space-y-3">
                  {recentMatches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{match.teams}</p>
                        <p className="text-gray-400 text-sm">
                          {match.status === 'Live' ? `Live - ${match.time}` : 
                           match.status === 'Completed' ? `Final - ${match.score}` : 
                           `Scheduled - ${match.time}`}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        match.status === 'Live' ? 'bg-red-600 text-white' :
                        match.status === 'Completed' ? 'bg-green-600 text-white' :
                        'bg-yellow-600 text-white'
                      }`}>
                        {match.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Live Matches</h3>
              <p className="text-gray-400">Live match logging interface would go here...</p>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Match History</h3>
              <p className="text-gray-400">Historical match data would go here...</p>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Statistics</h3>
              <p className="text-gray-400">Statistical analysis and charts would go here...</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Settings</h3>
              <p className="text-gray-400">Logger preferences and configuration would go here...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoggerDashboard;