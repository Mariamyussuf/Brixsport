import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import LoggerNotifications from '@/components/logger/notifications/LoggerNotifications';
import LoggerManagement from './LoggerManagement';
import ActivityLogs from './ActivityLogs';
import { useAdmin } from '@/contexts/AdminContext';
import MatchesManagement from './MatchesManagement';
import LiveLoggerMonitoring from './LiveLoggerMonitoring';
import StatisticsDashboard from './StatisticsDashboard';
import SystemSettings from './SystemSettings';
import PWAAdminManagement from './PWAAdminManagement';

const AdminDashboard = () => {
  const adminContext = useAdmin();
  const { adminUser, logout } = adminContext;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Redirect to login if no admin user
  useEffect(() => {
    if (!adminUser) {
      router.push('/admin/login');
    }
  }, [adminUser, router]);

  // Set up PWA manifest
  useEffect(() => {
    // Dynamically set the manifest for the admin PWA
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      manifestLink.setAttribute('href', '/admin-manifest.json');
    }
  }, []);

  // Don't render anything if no admin user
  if (!adminUser) {
    return null;
  }

  return (
    <>
      <Head>
        <link rel="manifest" href="/admin-manifest.json" />
        <meta name="theme-color" content="#dc2626" />
      </Head>
      <div className="flex min-h-screen bg-gray-900">
        {/* Left Sidebar */}
        <div className={`bg-gradient-to-b from-gray-800 to-gray-900 text-white w-64 space-y-6 py-7 px-4 transition-all duration-300 shadow-2xl border-r border-gray-700/50 ${sidebarOpen ? 'block' : 'hidden'} md:block`}>
          <div className="flex items-center space-x-3 px-2">
            <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-red-600">BrixSports</span>
              <p className="text-xs text-gray-400">Admin Dashboard</p>
            </div>
          </div>

          <nav className="mt-8">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="absolute bottom-4 left-0 right-0 px-4">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <div className="flex items-center space-x-2">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{adminUser?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-400 truncate">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header (Top Bar) */}
          <div className="bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-gray-700/50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden mr-3 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                {/* Breadcrumb */}
                <div className="hidden md:flex items-center space-x-2 text-sm">
                  <span className="text-gray-400">Admin</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-white font-medium">
                    {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                {/* Theme Toggle */}
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </button>
                
                {/* Logout button */}
                <button 
                  onClick={logout}
                  className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow hover:shadow-lg"
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
          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-gray-900 to-gray-800">
            {/* Matches Content */}
            {activeTab === 'matches' && (
              <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700/50 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Match Management</h2>
                  <p className="text-gray-400">Manage and monitor all sports matches</p>
                </div>
                <MatchesManagement />
              </div>
            )}
            
            {/* Live Logger Content */}
            {activeTab === 'live-logger' && (
              <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700/50 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Live Logger Monitoring</h2>
                  <p className="text-gray-400">Monitor real-time logging activities</p>
                </div>
                <LiveLoggerMonitoring />
              </div>
            )}
            
            {/* Statistics Content */}
            {activeTab === 'statistics' && (
              <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700/50 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Statistics Dashboard</h2>
                  <p className="text-gray-400">View analytics and performance metrics</p>
                </div>
                <StatisticsDashboard />
              </div>
            )}
            
            {/* Reporters/Admins Content */}
            {activeTab === 'reporters' && (
              <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700/50 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Logger Management</h2>
                  <p className="text-gray-400">Manage reporters and administrators</p>
                </div>
                <LoggerManagement />
              </div>
            )}
            
            {/* PWA Admins Content */}
            {activeTab === 'pwa-admins' && (
              <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700/50 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">PWA Administration</h2>
                  <p className="text-gray-400">Manage progressive web app settings</p>
                </div>
                <PWAAdminManagement currentUser={adminUser} />
              </div>
            )}
            
            {/* Activity Logs Content */}
            {activeTab === 'activity-logs' && (
              <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700/50 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Activity Logs</h2>
                  <p className="text-gray-400">Audit trail of all administrative actions</p>
                </div>
                <ActivityLogs />
              </div>
            )}
            
            {/* Settings Content */}
            {activeTab === 'settings' && (
              <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-700/50 p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">System Settings</h2>
                  <p className="text-gray-400">Configure platform preferences and security</p>
                </div>
                <SystemSettings />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
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
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default AdminDashboard;