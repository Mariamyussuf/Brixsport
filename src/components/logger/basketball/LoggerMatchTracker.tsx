import React, { useState, useEffect } from 'react';
import { Match } from '@/types/matchTracker';
import { BasketballLogger } from '@/components/logger/sports/BasketballLogger';
import { Team } from '@/types/campus';

interface LoggerMatchTrackerProps {
  match: Match;
}

const LoggerMatchTracker: React.FC<LoggerMatchTrackerProps> = ({ match }) => {
  const [matchData, setMatchData] = useState<Match>(match);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    // Convert match teams to campus teams format
    const convertedTeams: Team[] = [
      {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
        color: '#3b82f6', // Default blue color
        players: match.homeTeam.players.map(p => ({
          id: p.id,
          name: p.name,
          number: p.jerseyNumber.toString(),
          teamId: match.homeTeam.id
        })),
        score: match.homeScore
      },
      {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
        color: '#ef4444', // Default red color
        players: match.awayTeam.players.map(p => ({
          id: p.id,
          name: p.name,
          number: p.jerseyNumber.toString(),
          teamId: match.awayTeam.id
        })),
        score: match.awayScore
      }
    ];
    
    setTeams(convertedTeams);
  }, [match]);

  // Handle event submission
  const handleEventSubmit = (event: {
    teamId: string;
    playerId?: string;
    eventType: string;
    timestamp: number;
    value?: string | number;
  }) => {
    console.log('Event submitted:', event);
    // In a real implementation, you would send this to your API
    
    // Update local match data
    if (event.value && typeof event.value === 'string') {
      const points = parseInt(event.value);
      if (!isNaN(points)) {
        setMatchData(prev => {
          if (event.teamId === prev.homeTeam.id) {
            return {
              ...prev,
              homeScore: prev.homeScore + points
            };
          } else if (event.teamId === prev.awayTeam.id) {
            return {
              ...prev,
              awayScore: prev.awayScore + points
            };
          }
          return prev;
        });
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{matchData.name}</h2>
        <div className="flex items-center justify-between mt-2">
          <div className="text-gray-600 dark:text-gray-400">
            {new Date(matchData.date).toLocaleDateString()} at {new Date(matchData.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {matchData.status.charAt(0).toUpperCase() + matchData.status.slice(1)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-4">Match Details</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Home Team</span>
              <span className="font-medium">{matchData.homeTeam.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Away Team</span>
              <span className="font-medium">{matchData.awayTeam.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Venue</span>
              <span className="font-medium">{matchData.location}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Score</span>
              <span className="font-bold text-xl">
                {matchData.homeScore} - {matchData.awayScore}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-4">Live Logging</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Use the basketball logger below to record events during the match.
          </p>
          <div className="flex space-x-2">
            <button 
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
              onClick={() => {
                setMatchData(prev => ({ ...prev, status: 'live' }));
              }}
            >
              Start Match
            </button>
            <button 
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              onClick={() => {
                setMatchData(prev => ({ ...prev, status: 'completed' }));
              }}
            >
              End Match
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <BasketballLogger
          teams={teams}
          onEventSubmit={handleEventSubmit}
          disabled={matchData.status !== 'live'}
        />
      </div>
    </div>
  );
};

export default LoggerMatchTracker;