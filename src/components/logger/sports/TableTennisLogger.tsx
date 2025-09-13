import React, { useState } from 'react';
import { Team, Player, CampusEventType } from '../../../types/campus';
import { EventTypeButtons } from '../forms/EventTypeButtons';
import { PlayerSelector } from '../players/PlayerSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TableTennisLoggerProps {
  teams: Team[];
  onEventSubmit: (event: {
    teamId: string;
    playerId?: string;
    eventType: CampusEventType;
    timestamp: number;
  }) => void;
  disabled?: boolean;
}

const TABLE_TENNIS_EVENTS: CampusEventType[] = [
  'point', 'serve', 'error', 'timeout'
];

export const TableTennisLogger: React.FC<TableTennisLoggerProps> = ({
  teams,
  onEventSubmit,
  disabled = false
}) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<CampusEventType | null>(null);
  const [gameNumber, setGameNumber] = useState<number>(1);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [servingTeam, setServingTeam] = useState<string | null>(null);

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setSelectedPlayerId(null);
  };

  const handleSubmit = () => {
    if (!selectedTeam || !selectedEventType) return;
    
    // Update score for points
    if (selectedEventType === 'point') {
      if (selectedTeam.id === teams[0].id) {
        setHomeScore(prev => prev + 1);
      } else {
        setAwayScore(prev => prev + 1);
      }
    }
    
    // Toggle serving team for serves
    if (selectedEventType === 'serve') {
      setServingTeam(selectedTeam.id);
    }
    
    onEventSubmit({
      teamId: selectedTeam.id,
      playerId: selectedPlayerId || undefined,
      eventType: selectedEventType,
      timestamp: Date.now()
    });
    
    // Reset selection but keep team
    setSelectedEventType(null);
    setSelectedPlayerId(null);
  };

  const getEventColor = (eventType: CampusEventType) => {
    switch (eventType) {
      case 'point': return 'bg-green-500';
      case 'serve': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      case 'timeout': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Table Tennis Event Logger</span>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">Game: {gameNumber}</Badge>
              <div className="flex items-center gap-2">
                <span className="font-bold">{homeScore}</span>
                <span>-</span>
                <span className="font-bold">{awayScore}</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Serving Indicator */}
          {servingTeam && (
            <div className="text-center py-2 bg-blue-100 rounded-md">
              <span className="font-medium">
                Serving: {teams.find(t => t.id === servingTeam)?.name || 'Unknown'}
              </span>
            </div>
          )}

          {/* Team Selection */}
          <div className="flex flex-wrap gap-4">
            {teams.map((team) => (
              <Button
                key={team.id}
                variant={selectedTeam?.id === team.id ? "default" : "outline"}
                className="flex items-center gap-2"
                style={{ borderColor: team.color }}
                onClick={() => handleTeamSelect(team)}
                disabled={disabled}
              >
                {team.name}
              </Button>
            ))}
          </div>

          {/* Player Selection */}
          {selectedTeam && (
            <div className="space-y-2">
              <h3 className="font-medium">Select Player</h3>
              <PlayerSelector
                players={selectedTeam.players}
                selectedPlayerId={selectedPlayerId}
                onSelect={setSelectedPlayerId}
                teamColor={selectedTeam.color}
                variant="list"
                disabled={disabled}
              />
            </div>
          )}

          {/* Event Type Selection */}
          {selectedTeam && (
            <div className="space-y-2">
              <h3 className="font-medium">Select Event Type</h3>
              <EventTypeButtons
                eventTypes={TABLE_TENNIS_EVENTS}
                selectedEventType={selectedEventType}
                onSelect={setSelectedEventType}
                disabled={disabled}
                sportType="table_tennis"
              />
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              className={`${getEventColor('point')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('point');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              Point
            </Button>
            <Button
              variant="outline"
              className={`${getEventColor('serve')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('serve');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              Serve
            </Button>
            <Button
              variant="outline"
              className={`${getEventColor('error')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('error');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              Error
            </Button>
            <Button
              variant="outline"
              className={`${getEventColor('timeout')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('timeout');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              Timeout
            </Button>
          </div>

          {/* Game Control */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Game Number:</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((g) => (
                <Button
                  key={g}
                  variant={gameNumber === g ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGameNumber(g)}
                >
                  {g}
                </Button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={disabled || !selectedTeam || !selectedEventType}
          >
            Log Event
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};