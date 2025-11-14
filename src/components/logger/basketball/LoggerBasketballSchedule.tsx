import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Play, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLoggerAuth } from '@/contexts/LoggerAuthContext';

interface ScheduleMatch {
  id: string;
  home_team_name: string;
  away_team_name: string;
  scheduled_at: string;
  venue: string;
  status: string;
  home_team_logo?: string | null;
  away_team_logo?: string | null;
}

interface ScheduleRound {
  round: string | number;
  date: string;
  matches: ScheduleMatch[];
}

const LoggerBasketballSchedule: React.FC = () => {
  const router = useRouter();
  const { user } = useLoggerAuth();
  const [rounds, setRounds] = useState<ScheduleRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRounds, setExpandedRounds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/basketball-schedule');
      const data = await response.json();
      
      if (response.ok) {
        setRounds(data.rounds);
      } else {
        setError(data.error || 'Failed to load schedule');
      }
    } catch (err) {
      console.error('Error fetching basketball schedule:', err);
      setError('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button 
          onClick={fetchSchedule}
          className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  // Toggle round expansion
  const toggleRound = (roundKey: string) => {
    setExpandedRounds(prev => ({
      ...prev,
      [roundKey]: !prev[roundKey]
    }));
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit'
    });
  };

  // Group matches by date
  const groupMatchesByDate = (matches: ScheduleMatch[]) => {
    const grouped: Record<string, ScheduleMatch[]> = {};
    
    matches.forEach(match => {
      const dateKey = match.scheduled_at.split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(match);
    });
    
    return grouped;
  };

  // Start logging for a match
  const startLogging = (matchId: string) => {
    router.push(`/logger/matches/${matchId}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Basketball Schedule for Loggers
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Select a match to start logging events
        </p>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {rounds.map((round, index) => {
          const roundKey = `${round.round}-${round.date}`;
          const isExpanded = expandedRounds[roundKey] ?? true;
          
          // Filter out completed and cancelled matches for logging
          const loggableMatches = round.matches.filter(match => 
            match.status !== 'completed' && match.status !== 'cancelled'
          );
          
          // If all matches in a round are not loggable, show a special message
          const allCompletedOrCancelled = round.matches.length > 0 && loggableMatches.length === 0;
          
          return (
            <div key={roundKey} className="p-4">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => toggleRound(roundKey)}
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {typeof round.round === 'string' ? round.round : `Round ${round.round}`}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(round.date)}
                  </span>
                  {allCompletedOrCancelled && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      All Completed/Cancelled
                    </span>
                  )}
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isExpanded && (
                <div className="mt-4 space-y-4">
                  {allCompletedOrCancelled ? (
                    <div className="ml-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700 py-2">
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        <span>All matches for this round have been completed or cancelled</span>
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const groupedMatches = groupMatchesByDate(loggableMatches);
                      return Object.entries(groupedMatches).map(([date, matches]) => (
                        <div key={date} className="ml-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {formatDate(date)}
                          </div>
                          <div className="space-y-3">
                            {matches.map((match) => (
                              <div 
                                key={match.id} 
                                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center min-w-0">
                                        {match.home_team_logo && (
                                          <img
                                            src={match.home_team_logo}
                                            alt={match.home_team_name}
                                            className="w-6 h-6 rounded-full mr-2"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                          />
                                        )}
                                        <div className="font-medium text-gray-900 dark:text-white truncate">
                                          {match.home_team_name}
                                        </div>
                                      </div>
                                      <div className="text-gray-500 dark:text-gray-400 mx-2">vs</div>
                                      <div className="flex items-center min-w-0">
                                        {match.away_team_logo && (
                                          <img
                                            src={match.away_team_logo}
                                            alt={match.away_team_name}
                                            className="w-6 h-6 rounded-full mr-2"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                          />
                                        )}
                                        <div className="font-medium text-gray-900 dark:text-white truncate">
                                          {match.away_team_name}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                                      <Clock className="w-4 h-4 mr-1" />
                                      <span>{formatTime(match.scheduled_at)}</span>
                                      <MapPin className="w-4 h-4 ml-3 mr-1" />
                                      <span className="truncate">{match.venue}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="ml-3 flex flex-col items-end space-y-2">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      match.status === 'completed' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                                        : match.status === 'live' 
                                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' 
                                          : match.status === 'cancelled' 
                                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' 
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                                    }`}>
                                      {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                                    </span>
                                    
                                    {(match.status === 'scheduled' || match.status === 'live') && (
                                      <button
                                        onClick={() => startLogging(match.id)}
                                        className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                                      >
                                        <Play className="w-3 h-3 mr-1" />
                                        {match.status === 'live' ? 'Continue Logging' : 'Start Logging'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LoggerBasketballSchedule;