'use client';

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'red' | 'emerald' | 'indigo' | 'cyan' | 'orange' | 'yellow';
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  color,
  className = ''
}) => {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        text: 'text-blue-400',
        icon: 'text-blue-500'
      },
      green: {
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        text: 'text-green-400',
        icon: 'text-green-500'
      },
      purple: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        text: 'text-purple-400',
        icon: 'text-purple-500'
      },
      red: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        text: 'text-red-400',
        icon: 'text-red-500'
      },
      emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        text: 'text-emerald-400',
        icon: 'text-emerald-500'
      },
      indigo: {
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/20',
        text: 'text-indigo-400',
        icon: 'text-indigo-500'
      },
      cyan: {
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
        text: 'text-cyan-400',
        icon: 'text-cyan-500'
      },
      orange: {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        text: 'text-orange-400',
        icon: 'text-orange-500'
      },
      yellow: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        text: 'text-yellow-400',
        icon: 'text-yellow-500'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const colorClasses = getColorClasses(color);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  return (
    <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-colors ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl ${colorClasses.bg} border ${colorClasses.border} flex items-center justify-center`}>
            <span className="text-xl">{icon}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        </div>

        {change && (
          <div className="flex items-center space-x-1">
            {getTrendIcon(trend)}
            <span className={`text-sm font-medium ${
              trend === 'up' ? 'text-green-400' :
              trend === 'down' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {change}
            </span>
          </div>
        )}
      </div>

      {/* Mini trend indicator */}
      <div className="mt-4">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            trend === 'up' ? 'bg-green-500' :
            trend === 'down' ? 'bg-red-500' : 'bg-gray-500'
          }`} />
          <span className="text-xs text-gray-500">
            {trend === 'up' ? 'Trending up' :
             trend === 'down' ? 'Trending down' : 'Stable'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
