import React, { useState } from 'react';
import { Team, Player, CampusEventType } from '../../../types/campus';
import { EventTypeButtons } from '../forms/EventTypeButtons';
import { PlayerSelector } from '../players/PlayerSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface VolleyballLoggerProps {
  teams: Team[];
  onEventSubmit: (event: {
    teamId: string;
    playerId?: string;
    eventType: CampusEventType;
    timestamp: number;
  }) => void;
  disabled?: boolean;
}

const VOLLEYBALL_EVENTS: CampusEventType[] = [
  'serve', 'spike', 'block', 'dig', 'set', 'ace', 'error'
];

export const VolleyballLogger: React.FC<VolleyballLoggerProps> = ({
  teams,
  onEventSubmit,
  disabled = false
}) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<CampusEventType | null>(null);
  const [setNumber, setSetNumber] = useState<number>(1);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setSelectedPlayerId(null);
  };

  const handleSubmit = () => {
    if (!selectedTeam || !selectedEventType) return;
    
    // Update score for points
    if (selectedEventType === 'ace' || selectedEventType === 'spike' || selectedEventType === 'error') {
      if (selectedTeam.id === teams[0].id) {
        setHomeScore(prev => prev + 1);
      } else {
        setAwayScore(prev => prev + 1);
      }
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
      case 'ace': return 'bg-green-500';
      case 'spike': return 'bg-blue-500';
      case 'block': return 'bg-purple-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Volleyball Event Logger</span>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">Set: {setNumber}</Badge>
              <div className="flex items-center gap-2">
                <span className="font-bold">{homeScore}</span>
                <span>-</span>
                <span className="font-bold">{awayScore}</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
                variant="grid"
                disabled={disabled}
              />
            </div>
          )}

          {/* Event Type Selection */}
          {selectedTeam && (
            <div className="space-y-2">
              <h3 className="font-medium">Select Event Type</h3>
              <EventTypeButtons
                eventTypes={VOLLEYBALL_EVENTS}
                selectedEventType={selectedEventType}
                onSelect={setSelectedEventType}
                disabled={disabled}
                sportType="volleyball"
              />
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              className={`${getEventColor('ace')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('ace');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              Ace
            </Button>
            <Button
              variant="outline"
              className={`${getEventColor('spike')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('spike');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              Spike
            </Button>
            <Button
              variant="outline"
              className={`${getEventColor('block')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('block');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              Block
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
          </div>

          {/* Set Control */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Set Number:</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Button
                  key={s}
                  variant={setNumber === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSetNumber(s)}
                >
                  {s}
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