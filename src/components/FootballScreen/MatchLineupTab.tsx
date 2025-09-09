import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Player {
  id: number;
  name: string;
  position: string;
  isCaptain?: boolean;
  isBooked?: boolean;
  isSubstitute?: boolean;
}

const MatchLineupTab: React.FC = () => {
  const router = useRouter();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Mock data for team lineups
  const homeTeam = {
    name: 'Pirates FC',
    color: 'bg-blue-600',
    players: [
      { id: 1, name: 'Davidson', position: 'GK' },
      { id: 2, name: 'Johnson', position: 'LB', isBooked: true },
      { id: 3, name: 'Thiago Silva', position: 'CB', isCaptain: true },
      { id: 4, name: 'Thiago Santos', position: 'CB' },
      { id: 5, name: 'Diogo Barbosa', position: 'RB' },
      { id: 6, name: 'André', position: 'CDM' },
      { id: 7, name: 'Martinelli', position: 'CDM' },
      { id: 8, name: 'Jhon Arias', position: 'CAM' },
      { id: 9, name: 'Paulo Henrique Ganso', position: 'CAM' },
      { id: 10, name: 'Marquinhos', position: 'RW' },
      { id: 11, name: 'Germán Cano', position: 'ST' }
    ] as Player[],
    substitutes: [
      { id: 12, name: 'Vitor Eudes', position: 'GK', isSubstitute: true },
      { id: 13, name: 'Guga', position: 'RB', isSubstitute: true },
      { id: 14, name: 'Ignácio', position: 'CB', isSubstitute: true },
      { id: 15, name: 'Facundo Bernal', position: 'CM', isSubstitute: true },
      { id: 16, name: 'Nonato', position: 'CM', isSubstitute: true },
      { id: 17, name: 'Lima', position: 'LW', isSubstitute: true },
      { id: 18, name: 'Keno', position: 'LW', isSubstitute: true }
    ] as Player[]
  };

  const awayTeam = {
    name: 'Joga FC',
    color: 'bg-red-600',
    players: [
      { id: 1, name: 'Robert Sanchez', position: 'GK' },
      { id: 2, name: 'Reece James', position: 'RB', isCaptain: true },
      { id: 3, name: 'Thiago Silva', position: 'CB' },
      { id: 4, name: 'Levi Colwill', position: 'CB' },
      { id: 5, name: 'Ben Chilwell', position: 'LB' },
      { id: 6, name: 'Enzo Fernandez', position: 'CM' },
      { id: 7, name: 'Moisés Caicedo', position: 'CM' },
      { id: 8, name: 'Conor Gallagher', position: 'CM' },
      { id: 9, name: 'Cole Palmer', position: 'RW' },
      { id: 10, name: 'Nicolas Jackson', position: 'ST' },
      { id: 11, name: 'Raheem Sterling', position: 'LW' }
    ] as Player[],
    substitutes: [
      { id: 12, name: 'Đorđe Petrović', position: 'GK', isSubstitute: true },
      { id: 13, name: 'Malo Gusto', position: 'RB', isSubstitute: true },
      { id: 14, name: 'Axel Disasi', position: 'CB', isSubstitute: true },
      { id: 15, name: 'Romeo Lavia', position: 'CM', isSubstitute: true },
      { id: 16, name: 'Carney Chukwuemeka', position: 'CM', isSubstitute: true },
      { id: 17, name: 'Christopher Nkunku', position: 'CAM', isSubstitute: true },
      { id: 18, name: 'Mykhaylo Mudryk', position: 'LW', isSubstitute: true }
    ] as Player[]
  };

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
          <div className="text-sm text-gray-500 dark:text-gray-400">{player.position}</div>
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
                #{selectedPlayer.id} • {selectedPlayer.position}
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