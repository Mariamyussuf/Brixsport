import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { loggerService } from '@/lib/loggerService';

interface ActivityLog {
  id: string;
  loggerId: string;
  loggerName: string;
  action: 'create_match' | 'update_match' | 'add_event' | 'generate_report' | 'login' | 'logout';
  resourceId?: string;
  resourceName?: string;
  timestamp: string;
  details: string;
}

const ActivityLogs = () => {
  const { loggers } = useAdmin();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogger, setSelectedLogger] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration - in a real app, this would come from an API
  useEffect(() => {
    const mockActivities: ActivityLog[] = [
      {
        id: '1',
        loggerId: '1',
        loggerName: 'John Smith',
        action: 'create_match',
        resourceId: 'match-123',
        resourceName: 'Man Utd vs Liverpool',
        timestamp: '2023-10-15T14:30:00Z',
        details: 'Created new match between Man Utd and Liverpool'
      },
      {
        id: '2',
        loggerId: '2',
        loggerName: 'Sarah Johnson',
        action: 'add_event',
        resourceId: 'match-123',
        resourceName: 'Man Utd vs Liverpool',
        timestamp: '2023-10-15T15:45:00Z',
        details: 'Added goal event for Man Utd in 45th minute'
      },
      {
        id: '3',
        loggerId: '1',
        loggerName: 'John Smith',
        action: 'update_match',
        resourceId: 'match-123',
        resourceName: 'Man Utd vs Liverpool',
        timestamp: '2023-10-15T16:20:00Z',
        details: 'Updated match score to 1-0'
      },
      {
        id: '4',
        loggerId: '3',
        loggerName: 'Mike Wilson',
        action: 'generate_report',
        resourceId: 'match-123',
        resourceName: 'Man Utd vs Liverpool',
        timestamp: '2023-10-15T18:30:00Z',
        details: 'Generated match report for completed game'
      },
      {
        id: '5',
        loggerId: '2',
        loggerName: 'Sarah Johnson',
        action: 'login',
        timestamp: '2023-10-16T09:15:00Z',
        details: 'Logger logged into the system'
      }
    ];

    setActivities(mockActivities);
    setFilteredActivities(mockActivities);
    setLoading(false);
  }, []);

  // Filter activities based on selected criteria
  useEffect(() => {
    let result = [...activities];

    // Filter by logger
    if (selectedLogger !== 'all') {
      result = result.filter(activity => activity.loggerId === selectedLogger);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(activity => 
        activity.loggerName.toLowerCase().includes(term) ||
        activity.action.toLowerCase().includes(term) ||
        (activity.resourceName && activity.resourceName.toLowerCase().includes(term)) ||
        activity.details.toLowerCase().includes(term)
      );
    }

    // Filter by date range
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      result = result.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate >= startDate && activityDate <= endDate;
      });
    }

    setFilteredActivities(result);
  }, [activities, selectedLogger, searchTerm, dateRange]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create_match':
        return '⚽';
      case 'update_match':
        return '✏️';
      case 'add_event':
        return '➕';
      case 'generate_report':
        return '📊';
      case 'login':
        return '🔓';
      case 'logout':
        return '🔒';
      default:
        return '📝';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'create_match':
        return 'Created Match';
      case 'update_match':
        return 'Updated Match';
      case 'add_event':
        return 'Added Event';
      case 'generate_report':
        return 'Generated Report';
      case 'login':
        return 'Logged In';
      case 'logout':
        return 'Logged Out';
      default:
        return action;
    }
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
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Activity Logs</h2>
        <p className="mt-1 text-gray-600 dark:text-gray-300">
          Track all activities performed by loggers in the system
        </p>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Logger Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filter by Logger
            </label>
            <select
              value={selectedLogger}
              onChange={(e) => setSelectedLogger(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Loggers</option>
              {loggers.map(logger => (
                <option key={logger.id} value={logger.id}>
                  {logger.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search activities..."
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="overflow-x-auto">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No activities found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No activities match your current filters.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Logger
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Action
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Resource
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {activity.loggerName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.loggerName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Logger ID: {activity.loggerId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getActionIcon(activity.action)}</span>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {getActionText(activity.action)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {activity.resourceName ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.resourceName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {activity.resourceId}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {activity.details}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatTimestamp(activity.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary */}
      <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Showing {filteredActivities.length} of {activities.length} activities
          </p>
          <button 
            onClick={() => {
              setSelectedLogger('all');
              setSearchTerm('');
              setDateRange({ start: '', end: '' });
            }}
            className="mt-2 sm:mt-0 px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-md text-sm font-medium transition duration-200"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;