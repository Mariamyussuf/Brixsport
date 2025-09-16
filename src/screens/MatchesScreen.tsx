'use client';

import React, { useState, useEffect } from 'react';
import BrixSportsService from '@/services/BrixSportsService';
import { Match } from '@/types/brixsports';
import { Button } from '@/components/ui/button';

const MatchStatus = {
  ALL: 'all',
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  COMPLETED: 'completed'
} as const;

type MatchStatusType = typeof MatchStatus[keyof typeof MatchStatus];

export default function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [activeFilter, setActiveFilter] = useState<MatchStatusType>(MatchStatus.ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    filterMatches();
  }, [matches, activeFilter]);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await BrixSportsService.getMatches();
      
      if (response.success && response.data) {
        setMatches(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch matches');
        setMatches([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const filterMatches = () => {
    if (activeFilter === MatchStatus.ALL) {
      setFilteredMatches(matches);
    } else {
      setFilteredMatches(matches.filter(match => match.status === activeFilter));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMatchCard = (match: Match) => {
    return (
      <div key={match.id} className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm text-gray-400 mb-1">{match.competition_id}</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {match.home_team_logo && (
                  <img 
                    src={match.home_team_logo} 
                    alt={match.home_team_name} 
                    className="w-8 h-8 rounded-full mr-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
                <span className="font-medium">{match.home_team_name}</span>
              </div>
              <div className="text-xl font-bold">
                {match.status === 'completed' 
                  ? `${match.home_score} - ${match.away_score}` 
                  : match.status === 'live' 
                    ? `${match.home_score} - ${match.away_score}` 
                    : 'vs'}
              </div>
              <div className="flex items-center">
                <span className="font-medium">{match.away_team_name}</span>
                {match.away_team_logo && (
                  <img 
                    src={match.away_team_logo} 
                    alt={match.away_team_name} 
                    className="w-8 h-8 rounded-full ml-2"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="text-gray-400">
            {formatDate(match.match_date)}
          </div>
          
          <div className="flex items-center">
            {match.status === 'live' && (
              <span className="flex items-center mr-3">
                <span className="flex w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                <span className="text-red-500 font-medium">
                  LIVE
                </span>
                {match.current_minute > 0 && (
                  <span className="ml-2 text-gray-300">
                    {match.current_minute}' {match.period && `• ${match.period}`}
                  </span>
                )}
              </span>
            )}
            
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              match.status === 'scheduled' 
                ? 'bg-yellow-500/20 text-yellow-500' 
                : match.status === 'live' 
                  ? 'bg-red-500/20 text-red-500' 
                  : 'bg-green-500/20 text-green-500'
            }`}>
              {match.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderLoading = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  );

  const renderError = () => (
    <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-center">
      <p className="text-red-200">{error}</p>
      <Button 
        variant="secondary" 
        className="mt-3"
        onClick={fetchMatches}
      >
        Retry
      </Button>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-2">No matches available</div>
      <p className="text-gray-500 text-sm">
        {activeFilter === MatchStatus.ALL 
          ? 'There are no matches at the moment.' 
          : `There are no ${activeFilter} matches at the moment.`}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Matches</h1>
        
        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {Object.values(MatchStatus).map((status) => (
            <button
              key={status}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                activeFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setActiveFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Content */}
        {loading ? (
          renderLoading()
        ) : error ? (
          renderError()
        ) : filteredMatches.length > 0 ? (
          <div>
            {filteredMatches.map(renderMatchCard)}
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
}