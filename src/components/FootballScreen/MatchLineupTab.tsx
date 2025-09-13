import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMatchById } from '@/lib/userMatchService';
import { getTeamById } from '@/lib/userTeamService';

interface Player {
  id: string;
  name: string;
  position: string;
  jerseyNumber: number;
  isCaptain?: boolean;
  isBooked?: boolean;
  isSubstitute?: boolean;
  status?: 'on-field' | 'substituted' | 'injured';
}

interface TeamData {
  id: string;
  name: string;
  color: string;
  players: Player[];
  substitutes: Player[];
}

const MatchLineupTab: React.FC<{ matchId: string }> = ({ matchId }) => {
  const router = useRouter();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [homeTeam, setHomeTeam] = useState<TeamData | null>(null);
  const [awayTeam, setAwayTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLineupData = async () => {
      if (!matchId) {
        setError('No match ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch match data
        const match = await getMatchById(matchId);
        
        if (!match) {
          throw new Error('Match not found');
        }

        // Fetch team data for both teams
        const [homeTeamData, awayTeamData] = await Promise.all([
          getTeamById(match.homeTeam),
          getTeamById(match.awayTeam)
        ]);

        // Process home team data
        if (homeTeamData) {
          setHomeTeam({
            id: homeTeamData.id,
            name: homeTeamData.name,
            color: 'bg-blue-600', // This would typically come from the team data
            players: homeTeamData.players.filter(p => p.status !== 'substituted' && p.status !== 'injured'),
            substitutes: homeTeamData.players.filter(p => p.status === 'substituted')
          });
        }

        // Process away team data
        if (awayTeamData) {
          setAwayTeam({
            id: awayTeamData.id,
            name: awayTeamData.name,
            color: 'bg-red-600', // This would typically come from the team data
            players: awayTeamData.players.filter(p => p.status !== 'substituted' && p.status !== 'injured'),
            substitutes: awayTeamData.players.filter(p => p.status === 'substituted')
          });
        }
      } catch (err: any) {
        console.error('Error fetching lineup data:', err);
        setError(err.message || 'Failed to load lineup data');
      } finally {
        setLoading(false);
      }
    };

    fetchLineupData();
  }, [matchId]);

  const handlePlayerClick = (player: Player) => {
    // Navigate to player profile page
    router.push(`/player/${player.id}`);
  };

  const renderPlayer = (player: Player) => (
    <div 
      key={player.id}
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        selectedPlayer?.id === player.id 
          ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 dark:border-blue-400' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
      onClick={() => handlePlayerClick(player)}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{player.name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">#{player.jerseyNumber} • {player.position}</div>
        </div>
        <div className="flex space-x-1">
          {player.isCaptain && (
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded">C</span>
          )}
          {player.isBooked && (
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded">⚠️</span>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mx-auto mb-4"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
        <div className="text-red-500 dark:text-red-400">
          <h3 className="text-lg font-medium mb-2">Error Loading Lineup</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!homeTeam || !awayTeam) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-500 dark:text-gray-400">Lineup data not available</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Home Team */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-4 h-4 rounded ${homeTeam.color}`}></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{homeTeam.name}</h2>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Starting XI</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {homeTeam.players.map(renderPlayer)}
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Substitutes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {homeTeam.substitutes.map(renderPlayer)}
            </div>
          </div>
        </div>
        
        {/* Away Team */}
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-4 h-4 rounded ${awayTeam.color}`}></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{awayTeam.name}</h2>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Starting XI</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {awayTeam.players.map(renderPlayer)}
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Substitutes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {awayTeam.substitutes.map(renderPlayer)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Selected Player Info */}
      {selectedPlayer && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">{selectedPlayer.name}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                #{selectedPlayer.jerseyNumber} • {selectedPlayer.position}
                {selectedPlayer.isBooked && " • ⚠️ Booked"}
                {selectedPlayer.isCaptain && " • 👑 Captain"}
                {selectedPlayer.isSubstitute && " • 🔄 Substitute"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchLineupTab;