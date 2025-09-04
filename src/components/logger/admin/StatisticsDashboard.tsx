import React, { useState } from 'react';

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
}

interface ChartDataPoint {
  name: string;
  value: number;
}

const StatisticsDashboard = () => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');

  // Mock data for demonstration
  const statCards: StatCard[] = [
    {
      title: 'Total Matches',
      value: 128,
      change: '+12%',
      changeType: 'positive',
      icon: '⚽'
    },
    {
      title: 'Active Loggers',
      value: 24,
      change: '+3',
      changeType: 'positive',
      icon: '📝'
    },
    {
      title: 'Events Logged',
      value: '1.2K',
      change: '+18%',
      changeType: 'positive',
      icon: '📊'
    },
    {
      title: 'System Uptime',
      value: '99.8%',
      change: '+0.2%',
      changeType: 'positive',
      icon: '⏱️'
    }
  ];

  // Mock chart data
  const matchesChartData: ChartDataPoint[] = [
    { name: 'Mon', value: 12 },
    { name: 'Tue', value: 19 },
    { name: 'Wed', value: 15 },
    { name: 'Thu', value: 18 },
    { name: 'Fri', value: 22 },
    { name: 'Sat', value: 30 },
    { name: 'Sun', value: 25 }
  ];

  const eventsChartData: ChartDataPoint[] = [
    { name: 'Goals', value: 45 },
    { name: 'Cards', value: 22 },
    { name: 'Subs', value: 18 },
    { name: 'Injuries', value: 5 }
  ];

  const loggersChartData: ChartDataPoint[] = [
    { name: 'John S.', value: 32 },
    { name: 'Sarah J.', value: 28 },
    { name: 'Mike W.', value: 24 },
    { name: 'Emma D.', value: 19 },
    { name: 'Alex T.', value: 15 }
  ];

  // Simple bar chart component
  const BarChart = ({ data, color = 'bg-red-500' }: { data: ChartDataPoint[]; color?: string }) => {
    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <div className="flex items-end space-x-2 h-32">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {item.value}
            </div>
            <div 
              className={`${color} w-full rounded-t`}
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            ></div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {item.name}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Simple pie chart component (simplified representation)
  const PieChart = ({ data }: { data: ChartDataPoint[] }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = 0;
    
    return (
      <div className="relative w-40 h-40 mx-auto">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const angle = (percentage / 100) * 360;
          const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
          
          // This is a simplified representation - in a real app, you'd use SVG for proper pie charts
          const segmentStyle = {
            clipPath: `conic-gradient(from ${startAngle}deg, var(--color) 0deg ${angle}deg, transparent ${angle}deg 360deg)`,
            '--color': getComputedStyle(document.documentElement)
              .getPropertyValue(`--color-${index}`) || '#ef4444'
          } as React.CSSProperties;
          
          startAngle += angle;
          
          return (
            <div 
              key={index}
              className={`absolute inset-0 rounded-full ${colors[index % colors.length]}`}
              style={segmentStyle}
            ></div>
          );
        })}
        <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-full"></div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">System Statistics</h2>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              Overview of system performance and activity metrics
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                onClick={() => setTimeRange('day')}
                className={`px-3 py-1.5 text-sm font-medium rounded-l-lg ${
                  timeRange === 'day'
                    ? 'bg-red-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1.5 text-sm font-medium ${
                  timeRange === 'week'
                    ? 'bg-red-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1.5 text-sm font-medium ${
                  timeRange === 'month'
                    ? 'bg-red-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setTimeRange('year')}
                className={`px-3 py-1.5 text-sm font-medium rounded-r-lg ${
                  timeRange === 'year'
                    ? 'bg-red-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Year
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{card.value}</p>
              </div>
              <div className="text-2xl">{card.icon}</div>
            </div>
            <div className="mt-4">
              <span className={`inline-flex items-center text-sm font-medium ${
                card.changeType === 'positive' 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {card.changeType === 'positive' ? (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
                {card.change}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Matches Chart */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Matches Logged</h3>
            <BarChart data={matchesChartData} color="bg-red-500" />
            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Matches logged per day (last 7 days)
            </div>
          </div>

          {/* Events Chart */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Event Types</h3>
            <div className="flex items-center justify-center h-32">
              <div className="grid grid-cols-2 gap-4">
                {eventsChartData.map((item, index) => {
                  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
                  return (
                    <div key={index} className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${colors[index]}`}></div>
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Distribution of event types logged
            </div>
          </div>

          {/* Top Loggers Chart */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Loggers</h3>
            <BarChart data={loggersChartData} color="bg-blue-500" />
            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Matches logged by top loggers (last 30 days)
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-6 pb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 text-sm">⚽</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  New match created
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Man Utd vs Liverpool by John Smith • 2 hours ago
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 text-sm">📝</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Event logged
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Goal by Player 1 in Lakers vs Celtics by Sarah Johnson • 4 hours ago
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-sm">📊</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Report generated
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Weekly statistics report by System • 1 day ago
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;