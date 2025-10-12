import React, { useState, useEffect } from 'react';
import { adminService, ensureLoggerType } from '@/lib/adminService';
import { Logger } from '@/lib/adminService';

// Define a union type that includes all possible logger statuses
type LoggerStatus = 'active' | 'inactive' | 'suspended' | 'online' | 'busy' | 'offline';

// Update LiveLogger to use the new type
interface LiveLogger extends Logger {
  id: string;
  name?: string;
  email?: string;
  lastActive?: string;
  eventsLogged: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  currentMatch?: string;
  location?: string;
  status: LoggerStatus;
}

const LiveLoggerMonitoring = () => {
  const [loggers, setLoggers] = useState<LiveLogger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | LoggerStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch loggers from API
  useEffect(() => {
    const fetchLoggers = async () => {
      try {
        setLoading(true);
        const response = await adminService.getLoggers();
        if (response.success && response.data) {
          // Transform the data to match our LiveLogger interface
          const liveLoggers: LiveLogger[] = response.data.map(logger => ({
            ...ensureLoggerType(logger),
            status: mapLoggerStatusToLiveStatus(logger.status as any),
            eventsLogged: 0, // This would need to come from the API or be calculated
            connectionQuality: 'good', // This would need to come from the API
            // Add other fields as needed
          }));
          setLoggers(liveLoggers);
        } else {
          throw new Error(typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to load loggers');
        }
      } catch (err) {
        setError('Failed to load loggers');
        console.error('Error fetching loggers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLoggers();
    
    // Set up polling to refresh data every 30 seconds
    const interval = setInterval(fetchLoggers, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Map admin logger status to live logger status
  const mapLoggerStatusToLiveStatus = (status: LoggerStatus): LoggerStatus => {
    // In a real implementation, this would depend on actual logger activity
    // For now, we're just returning the status as is since we've unified the type
    return status;
  };

  const filteredLoggers = loggers.filter(logger => {
    const matchesFilter = filter === 'all' || logger.status === filter;
    const matchesSearch = (logger.name && logger.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          (logger.email && logger.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (logger.currentMatch && logger.currentMatch.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: LoggerStatus) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-green-400';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionQualityText = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'poor': return 'Poor';
      default: return 'Unknown';
    }
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <h3 className="ml-2 text-lg font-medium text-red-800">Error</h3>
        </div>
        <div className="mt-2 text-red-700">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Live Logger Monitoring</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              Monitor real-time logger activities and connection status
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search loggers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-full ${
              filter === 'all' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All Loggers
          </button>
          <button
            onClick={() => setFilter('online')}
            className={`px-3 py-1 text-sm rounded-full flex items-center ${
              filter === 'online' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            Online
          </button>
          <button
            onClick={() => setFilter('busy')}
            className={`px-3 py-1 text-sm rounded-full flex items-center ${
              filter === 'busy' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
            Busy
          </button>
          <button
            onClick={() => setFilter('offline')}
            className={`px-3 py-1 text-sm rounded-full flex items-center ${
              filter === 'offline' 
                ? 'bg-gray-600 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
            Offline
          </button>
        </div>
      </div>

      {filteredLoggers.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No loggers found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No loggers match your current filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredLoggers.map((logger) => (
            <div 
              key={logger.id} 
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="relative">
                    <div className="bg-gray-200 dark:bg-gray-600 border-2 border-dashed rounded-xl w-12 h-12" />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(logger.status)}`}></div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{logger.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{logger.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  logger.status === 'online' ? 'bg-green-100 text-green-800' :
                  logger.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {logger.status.charAt(0).toUpperCase() + logger.status.slice(1)}
                </span>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Last Active</span>
                  <span className="font-medium text-gray-900 dark:text-white">{logger.lastActive ? formatLastActive(logger.lastActive) : 'Never'}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Events Logged</span>
                  <span className="font-medium text-gray-900 dark:text-white">{logger.eventsLogged}</span>
                </div>
                
                {logger.currentMatch && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Current Match</span>
                    <span className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{logger.currentMatch}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Connection</span>
                  <span className={`font-medium ${getConnectionQualityColor(logger.connectionQuality)}`}>
                    {getConnectionQualityText(logger.connectionQuality)}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button className="flex-1 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">
                  Message
                </button>
                <button className="flex-1 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LiveLoggerMonitoring;