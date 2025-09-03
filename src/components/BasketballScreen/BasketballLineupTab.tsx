import React, { useState } from 'react';

interface Player {
  id: number;
  name: string;
  position: string;
  jerseyNumber: string;
  isCaptain?: boolean;
  isFouledOut?: boolean;
  isSubstitute?: boolean;
  points?: number;
  rebounds?: number;
  assists?: number;
}

const BasketballLineupTab: React.FC = () => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Mock data for basketball team lineups
  const homeTeam = {
    name: 'Phoenix',
    color: 'bg-orange-600',
    players: [
      { id: 1, name: 'Johnson', position: 'PG', jerseyNumber: '3', isCaptain: true, points: 18, rebounds: 4, assists: 7 },
      { id: 2, name: 'Williams', position: 'SG', jerseyNumber: '23', points: 12, rebounds: 3, assists: 4 },
      { id: 3, name: 'Miller', position: 'SF', jerseyNumber: '11', points: 8, rebounds: 6, assists: 2 },
      { id: 4, name: 'Davis', position: 'PF', jerseyNumber: '34', points: 14, rebounds: 9, assists: 1 },
      { id: 5, name: 'Wilson', position: 'C', jerseyNumber: '7', points: 6, rebounds: 11, assists: 1 }
    ] as Player[],
    substitutes: [
      { id: 6, name: 'Taylor', position: 'PG', jerseyNumber: '15', isSubstitute: true, points: 4, rebounds: 2, assists: 3 },
      { id: 7, name: 'Brown', position: 'SG', jerseyNumber: '8', isSubstitute: true, points: 9, rebounds: 1, assists: 2 },
      { id: 8, name: 'Anderson', position: 'SF', jerseyNumber: '22', isSubstitute: true, points: 0, rebounds: 0, assists: 0 },
      { id: 9, name: 'Thomas', position: 'PF', jerseyNumber: '42', isSubstitute: true, points: 2, rebounds: 3, assists: 0 },
      { id: 10, name: 'Jackson', position: 'C', jerseyNumber: '13', isSubstitute: true, points: 0, rebounds: 1, assists: 0 }
    ] as Player[]
  };

  const awayTeam = {
    name: 'Blazers',
    color: 'bg-red-600',
    players: [
      { id: 1, name: 'Roberts', position: 'PG', jerseyNumber: '12', points: 15, rebounds: 3, assists: 8 },
      { id: 2, name: 'Thompson', position: 'SG', jerseyNumber: '5', points: 22, rebounds: 4, assists: 3 },
      { id: 3, name: 'White', position: 'SF', jerseyNumber: '25', points: 11, rebounds: 7, assists: 2 },
      { id: 4, name: 'Harris', position: 'PF', jerseyNumber: '33', points: 9, rebounds: 8, assists: 1 },
      { id: 5, name: 'Clark', position: 'C', jerseyNumber: '9', points: 7, rebounds: 12, assists: 0 }
    ] as Player[],
    substitutes: [
      { id: 6, name: 'Lewis', position: 'PG', jerseyNumber: '2', isSubstitute: true, points: 3, rebounds: 1, assists: 2 },
      { id: 7, name: 'Walker', position: 'SG', jerseyNumber: '17', isSubstitute: true, points: 6, rebounds: 2, assists: 1 },
      { id: 8, name: 'Hall', position: 'SF', jerseyNumber: '21', isSubstitute: true, points: 0, rebounds: 0, assists: 0 },
      { id: 9, name: 'Young', position: 'PF', jerseyNumber: '31', isSubstitute: true, points: 4, rebounds: 3, assists: 0 },
      { id: 10, name: 'King', position: 'C', jerseyNumber: '14', isSubstitute: true, points: 2, rebounds: 2, assists: 0 }
    ] as Player[]
  };

  const renderPlayer = (player: Player) => (
    <div 
      key={player.id}
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        selectedPlayer?.id === player.id 
          ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 dark:border-blue-400' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
      onClick={() => setSelectedPlayer(player)}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{player.jerseyNumber}</span>
            </div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{player.name}</div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{player.position}</div>
        </div>
        <div className="flex space-x-1">
          {player.isCaptain && (
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded">C</span>
          )}
          {player.isFouledOut && (
            <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 px-1.5 py-0.5 rounded">FO</span>
          )}
        </div>
      </div>
      
      {/* Stats for basketball players */}
      <div className="flex justify-between mt-2 text-xs">
        <span className="text-gray-600 dark:text-gray-400">PTS: <span className="font-medium">{player.points}</span></span>
        <span className="text-gray-600 dark:text-gray-400">REB: <span className="font-medium">{player.rebounds}</span></span>
        <span className="text-gray-600 dark:text-gray-400">AST: <span className="font-medium">{player.assists}</span></span>
      </div>
    </div>
  );

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
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Starting Lineup</h3>
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
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Starting Lineup</h3>
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
                {selectedPlayer.isCaptain && " • 👑 Captain"}
                {selectedPlayer.isSubstitute && " • 🔄 Substitute"}
                {selectedPlayer.isFouledOut && " • ⚠️ Fouled Out"}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-gray-700 p-2 rounded text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Points</div>
                  <div className="font-bold text-lg">{selectedPlayer.points}</div>
                </div>
                <div className="bg-white dark:bg-gray-700 p-2 rounded text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Rebounds</div>
                  <div className="font-bold text-lg">{selectedPlayer.rebounds}</div>
                </div>
                <div className="bg-white dark:bg-gray-700 p-2 rounded text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Assists</div>
                  <div className="font-bold text-lg">{selectedPlayer.assists}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BasketballLineupTab;