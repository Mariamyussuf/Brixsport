import React from 'react';
import { TeamStats, PlayerStats } from '@/types/matchEvents';

interface MatchStatsProps {
  homeTeamStats?: TeamStats;
  awayTeamStats?: TeamStats;
  playerStats: Record<string, PlayerStats>;
  players: Record<string, { id: string; name: string; jerseyNumber: number; position: string }[]>;
}

export const MatchStats: React.FC<MatchStatsProps> = ({ 
  homeTeamStats, 
  awayTeamStats, 
  playerStats, 
  players 
}) => {
  // Default stats if not provided
  const defaultStats: TeamStats = {
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    shots: 0,
    shotsOnTarget: 0,
    passes: 0,
    passesCompleted: 0,
    tackles: 0,
    interceptions: 0,
    clearances: 0,
    saves: 0,
    foulsCommitted: 0,
    foulsSuffered: 0,
    minutesPlayed: 0,
    substitutions: 0,
    offside: 0,
    possession: 0,
    substitutionsUsed: 0,
    formation: 'Unknown',
    cornerKicks: 0,
    goalAttempts: 0,
    dangerousAttacks: 0
  };

  const homeStats = homeTeamStats || defaultStats;
  const awayStats = awayTeamStats || defaultStats;

  return (
    <div className="match-stats">
      <h3 className="text-lg font-bold mb-4">Live Statistics</h3>
      
      {/* Team stats */}
      <div className="team-stats grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="home-team-stats bg-gray-50 p-4 rounded-lg">
          <h4 className="font-bold mb-3 text-center">Home Team Stats</h4>
          <div className="stats-grid grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="font-medium">Possession</div>
            <div className="text-right">{homeStats.possession}%</div>
            
            <div className="font-medium">Goals</div>
            <div className="text-right font-bold text-lg">{homeStats.goals}</div>
            
            <div className="font-medium">Shots (on target)</div>
            <div className="text-right">{homeStats.shots} ({homeStats.shotsOnTarget})</div>
            
            <div className="font-medium">Passes</div>
            <div className="text-right">{homeStats.passesCompleted}/{homeStats.passes} ({homeStats.passes > 0 ? Math.round((homeStats.passesCompleted / homeStats.passes) * 100) : 0}%)</div>
            
            <div className="font-medium">Tackles</div>
            <div className="text-right">{homeStats.tackles}</div>
            
            <div className="font-medium">Fouls</div>
            <div className="text-right">{homeStats.foulsCommitted}</div>
            
            <div className="font-medium">Cards</div>
            <div className="text-right">
              <span className="text-yellow-600">🟨 {homeStats.yellowCards}</span> 
              <span className="ml-2 text-red-600">🟥 {homeStats.redCards}</span>
            </div>
            
            <div className="font-medium">Corner Kicks</div>
            <div className="text-right">{homeStats.cornerKicks}</div>
            
            <div className="font-medium">Offsides</div>
            <div className="text-right">{homeStats.offside}</div>
            
            <div className="font-medium">Saves</div>
            <div className="text-right">{homeStats.saves}</div>
          </div>
        </div>
        
        <div className="away-team-stats bg-gray-50 p-4 rounded-lg">
          <h4 className="font-bold mb-3 text-center">Away Team Stats</h4>
          <div className="stats-grid grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="font-medium">Possession</div>
            <div className="text-right">{awayStats.possession}%</div>
            
            <div className="font-medium">Goals</div>
            <div className="text-right font-bold text-lg">{awayStats.goals}</div>
            
            <div className="font-medium">Shots (on target)</div>
            <div className="text-right">{awayStats.shots} ({awayStats.shotsOnTarget})</div>
            
            <div className="font-medium">Passes</div>
            <div className="text-right">{awayStats.passesCompleted}/{awayStats.passes} ({awayStats.passes > 0 ? Math.round((awayStats.passesCompleted / awayStats.passes) * 100) : 0}%)</div>
            
            <div className="font-medium">Tackles</div>
            <div className="text-right">{awayStats.tackles}</div>
            
            <div className="font-medium">Fouls</div>
            <div className="text-right">{awayStats.foulsCommitted}</div>
            
            <div className="font-medium">Cards</div>
            <div className="text-right">
              <span className="text-yellow-600">🟨 {awayStats.yellowCards}</span> 
              <span className="ml-2 text-red-600">🟥 {awayStats.redCards}</span>
            </div>
            
            <div className="font-medium">Corner Kicks</div>
            <div className="text-right">{awayStats.cornerKicks}</div>
            
            <div className="font-medium">Offsides</div>
            <div className="text-right">{awayStats.offside}</div>
            
            <div className="font-medium">Saves</div>
            <div className="text-right">{awayStats.saves}</div>
          </div>
        </div>
      </div>
      
      {/* Player stats */}
      <div className="player-stats">
        <h4 className="font-bold mb-3">Player Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Home team players */}
          <div>
            <h5 className="font-semibold mb-2 text-center">Home Team Players</h5>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {players.homeTeam?.map((player) => (
                <div key={player.id} className="p-3 bg-white rounded-md shadow-sm border">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        #{player.jerseyNumber} {player.name}
                        <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                          {player.position}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500">Goals</div>
                      <div className="font-medium">{playerStats[player.id]?.goals || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Assists</div>
                      <div className="font-medium">{playerStats[player.id]?.assists || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Minutes</div>
                      <div className="font-medium">{playerStats[player.id]?.minutesPlayed || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Shots</div>
                      <div className="font-medium">{playerStats[player.id]?.shots || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Passes</div>
                      <div className="font-medium">
                        {playerStats[player.id]?.passesCompleted || 0}/{playerStats[player.id]?.passes || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Cards</div>
                      <div className="font-medium">
                        <span className="text-yellow-600">🟨 {playerStats[player.id]?.yellowCards || 0}</span>
                        <span className="ml-1 text-red-600">🟥 {playerStats[player.id]?.redCards || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!players.homeTeam || players.homeTeam.length === 0) && (
                <div className="text-center text-gray-500 py-4">
                  No players available
                </div>
              )}
            </div>
          </div>
          
          {/* Away team players */}
          <div>
            <h5 className="font-semibold mb-2 text-center">Away Team Players</h5>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {players.awayTeam?.map((player) => (
                <div key={player.id} className="p-3 bg-white rounded-md shadow-sm border">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        #{player.jerseyNumber} {player.name}
                        <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                          {player.position}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500">Goals</div>
                      <div className="font-medium">{playerStats[player.id]?.goals || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Assists</div>
                      <div className="font-medium">{playerStats[player.id]?.assists || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Minutes</div>
                      <div className="font-medium">{playerStats[player.id]?.minutesPlayed || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Shots</div>
                      <div className="font-medium">{playerStats[player.id]?.shots || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Passes</div>
                      <div className="font-medium">
                        {playerStats[player.id]?.passesCompleted || 0}/{playerStats[player.id]?.passes || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Cards</div>
                      <div className="font-medium">
                        <span className="text-yellow-600">🟨 {playerStats[player.id]?.yellowCards || 0}</span>
                        <span className="ml-1 text-red-600">🟥 {playerStats[player.id]?.redCards || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {(!players.awayTeam || players.awayTeam.length === 0) && (
                <div className="text-center text-gray-500 py-4">
                  No players available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};