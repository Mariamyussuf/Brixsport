import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useLoggerAuth, useAuth } from '@/hooks/useAuth';
import LoggerNotifications from '@/components/logger/notifications/LoggerNotifications';
import LoggerManagement from './LoggerManagement';
import ActivityLogs from './ActivityLogs';
import { AdminProvider } from '@/contexts/AdminContext';
import MatchesManagement from './MatchesManagement';
import LiveLoggerMonitoring from './LiveLoggerMonitoring';
import StatisticsDashboard from './StatisticsDashboard';
import SystemSettings from './SystemSettings';
import PWAAdminManagement from './PWAAdminManagement';

const AdminDashboard = () => {
  const { user, hasLoggerPermissions } = useLoggerAuth();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  const canManageLoggers = isAdmin; // Admins can manage loggers

  // Set up PWA manifest
  useEffect(() => {
    // Dynamically set the manifest for the admin PWA
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.setAttribute('href', '/admin-manifest.json');
    }
  }, []);

  // Security check - only show dashboard to authenticated admins
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need to be logged in with admin permissions to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminProvider>
      <Head>
        <link rel="manifest" href="/admin-manifest.json" />
        <meta name="theme-color" content="#dc2626" />
      </Head>
      <div className="flex min-h-screen">
        {/* Left Sidebar */}
        <div className={`bg-gray-800 text-white w-64 space-y-6 py-7 px-2 transition-all duration-300 ${sidebarOpen ? 'block' : 'hidden'} md:block`}>
          <div className="flex items-center space-x-2 px-4">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
            <span className="text-2xl font-bold">Brixsports Live</span>
          </div>

          <nav>
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                      activeTab === item.id
                        ? 'bg-red-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header (Top Bar) */}
          <div className="bg-white dark:bg-gray-800 shadow p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                {/* App logo + app name for mobile */}
                <div className="flex items-center space-x-2 md:hidden">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8" />
                  <span className="text-lg font-bold text-gray-800 dark:text-white">Brixsports Live</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Logged-in admin name */}
                <span className="hidden md:inline text-gray-700 dark:text-gray-300">{user?.name || 'Admin'}</span>
                
                {/* Logout button */}
                <button 
                  onClick={logout}
                  className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Dashboard Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900">
            {/* Matches Content */}
            {activeTab === 'matches' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <MatchesManagement />
              </div>
            )}
            
            {/* Live Logger Content */}
            {activeTab === 'live-logger' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <LiveLoggerMonitoring />
              </div>
            )}
            
            {/* Statistics Content */}
            {activeTab === 'statistics' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <StatisticsDashboard />
              </div>
            )}
            
            {/* Reporters/Admins Content */}
            {activeTab === 'reporters' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <LoggerManagement />
              </div>
            )}
            
            {/* PWA Admins Content */}
            {activeTab === 'pwa-admins' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <PWAAdminManagement currentUser={user} />
              </div>
            )}
            
            {/* Activity Logs Content */}
            {activeTab === 'activity-logs' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <ActivityLogs />
              </div>
            )}
            
            {/* Settings Content */}
            {activeTab === 'settings' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <SystemSettings />
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminProvider>
  );
};

// Sidebar menu items
const menuItems = [
  { id: 'matches', label: 'Matches', icon: '⚽' },
  { id: 'live-logger', label: 'Live Logger', icon: '📝' },
  { id: 'statistics', label: 'Statistics', icon: '📊' },
  { id: 'reporters', label: 'Reporters/Admins', icon: '👥' },
  { id: 'pwa-admins', label: 'PWA Admins', icon: '📱' },
  { id: 'activity-logs', label: 'Activity Logs', icon: '📜' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export default AdminDashboard;