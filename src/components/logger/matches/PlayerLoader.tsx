import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';

interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  status: string;
}

interface Team {
  id: string;
  name: string;
  players: Player[];
}

interface PlayerLoaderProps {
  homeTeam: Team;
  awayTeam: Team;
  selectedTeamId: string | null;
  onSelectTeam: (teamId: string) => void;
  onPlayerSelect: (playerId: string) => void;
  disabled: boolean;
}

export const PlayerLoader: React.FC<PlayerLoaderProps> = ({ 
  homeTeam, 
  awayTeam, 
  selectedTeamId, 
  onSelectTeam, 
  onPlayerSelect, 
  disabled 
}) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Update selected team when prop changes
  useEffect(() => {
    if (selectedTeamId) {
      setSelectedTeam(selectedTeamId === homeTeam.id ? homeTeam : awayTeam);
    }
  }, [selectedTeamId, homeTeam, awayTeam]);
  
  // Filter players based on search term
  const getFilteredPlayers = () => {
    if (!selectedTeam) return [];
    
    return selectedTeam.players.filter(player => {
      const searchLower = searchTerm.toLowerCase();
      return (
        player.name.toLowerCase().includes(searchLower) ||
        player.id.toString().includes(searchLower) ||
        player.jerseyNumber.toString().includes(searchLower) ||
        player.position.toLowerCase().includes(searchLower)
      );
    });
  };
  
  const handleTeamSelect = (teamId: string) => {
    if (!disabled) {
      onSelectTeam(teamId);
    }
  };
  
  const handlePlayerSelect = (playerId: string) => {
    if (!disabled) {
      onPlayerSelect(playerId);
    }
  };
  
  return (
    <div className="player-loader p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">Players</h3>
      
      <div className="team-selectors flex gap-2 mb-4">
        <Button 
          variant={selectedTeamId === homeTeam.id ? "default" : "outline"}
          className="flex-1"
          onClick={() => handleTeamSelect(homeTeam.id)}
          disabled={disabled}
        >
          {homeTeam.name}
        </Button>
        <Button 
          variant={selectedTeamId === awayTeam.id ? "default" : "outline"}
          className="flex-1"
          onClick={() => handleTeamSelect(awayTeam.id)}
          disabled={disabled}
        >
          {awayTeam.name}
        </Button>
      </div>
      
      {selectedTeam && (
        <>
          <div className="mb-4">
            <input 
              type="text" 
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={disabled}
            />
          </div>
          
          <div className="players-list">
            <h4 className="font-bold mb-2">{selectedTeam.name} Players</h4>
            <div className="space-y-1">
              {getFilteredPlayers().map((player) => (
                <Button 
                  key={player.id}
                  variant="ghost"
                  className={`w-full justify-start p-2 text-left ${player.status === 'injured' ? 'text-red-600' : ''}`}
                  onClick={() => handlePlayerSelect(player.id)}
                  disabled={disabled}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <span className="font-medium w-8">{player.jerseyNumber}</span>
                      <span>{player.name}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {player.position} - {player.status}
                    </div>
                  </div>
                </Button>
              ))}
              
              {getFilteredPlayers().length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No players found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};