import React, { useState, useEffect } from 'react';

interface LoggerStatus {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'offline' | 'busy';
  lastActive: string;
  currentMatch?: string;
  eventsLogged: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

const LiveLoggerMonitoring = () => {
  const [loggers, setLoggers] = useState<LoggerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'busy'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  useEffect(() => {
    const mockLoggers: LoggerStatus[] = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@example.com',
        status: 'online',
        lastActive: '2023-10-18T20:30:00Z',
        currentMatch: 'Man Utd vs Liverpool',
        eventsLogged: 12,
        connectionQuality: 'excellent'
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        status: 'busy',
        lastActive: '2023-10-18T20:25:00Z',
        currentMatch: 'Lakers vs Celtics',
        eventsLogged: 8,
        connectionQuality: 'good'
      },
      {
        id: '3',
        name: 'Mike Wilson',
        email: 'mike.w@example.com',
        status: 'offline',
        lastActive: '2023-10-18T18:45:00Z',
        eventsLogged: 0,
        connectionQuality: 'poor'
      },
      {
        id: '4',
        name: 'Emma Davis',
        email: 'emma.d@example.com',
        status: 'online',
        lastActive: '2023-10-18T20:35:00Z',
        eventsLogged: 5,
        connectionQuality: 'fair'
      }
    ];

    setLoggers(mockLoggers);
    setLoading(false);
  }, []);

  const filteredLoggers = loggers.filter(logger => {
    const matchesFilter = filter === 'all' || logger.status === filter;
    const matchesSearch = logger.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          logger.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (logger.currentMatch && logger.currentMatch.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
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
                {logger.currentMatch ? (
                  <div className="flex items-center text-sm">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    <span className="text-gray-900 dark:text-white truncate">{logger.currentMatch}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>No active match</span>
                  </div>
                )}

                <div className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-900 dark:text-white">{logger.eventsLogged} events logged</span>
                </div>

                <div className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                  <span className={getConnectionQualityColor(logger.connectionQuality)}>
                    Connection: {getConnectionQualityText(logger.connectionQuality)}
                  </span>
                </div>

                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Last active: {formatLastActive(logger.lastActive)}</span>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button className="flex-1 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-200">
                  Message
                </button>
                <button className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition duration-200">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {loggers.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Loggers
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {loggers.filter(l => l.status === 'online').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Online
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">
              {loggers.filter(l => l.status === 'busy').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Busy
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">
              {loggers.filter(l => l.status === 'offline').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Offline
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveLoggerMonitoring;