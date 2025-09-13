import React, { useState } from 'react';
import { Team, Player, CampusEventType } from '../../../types/campus';
import { EventTypeButtons } from '../forms/EventTypeButtons';
import { PlayerSelector } from '../players/PlayerSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BasketballLoggerProps {
  teams: Team[];
  onEventSubmit: (event: {
    teamId: string;
    playerId?: string;
    eventType: CampusEventType;
    timestamp: number;
  }) => void;
  disabled?: boolean;
}

const BASKETBALL_EVENTS: CampusEventType[] = [
  'field_goal', 'three_pointer', 'free_throw', 'rebound', 'assist',
  'steal', 'block', 'turnover', 'foul', 'timeout'
];

export const BasketballLogger: React.FC<BasketballLoggerProps> = ({
  teams,
  onEventSubmit,
  disabled = false
}) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<CampusEventType | null>(null);
  const [period, setPeriod] = useState<number>(1);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setSelectedPlayerId(null);
  };

  const handleSubmit = () => {
    if (!selectedTeam || !selectedEventType) return;
    
    // Update score based on event type
    if (selectedEventType === 'field_goal') {
      if (selectedTeam.id === teams[0].id) {
        setHomeScore(prev => prev + 2);
      } else {
        setAwayScore(prev => prev + 2);
      }
    } else if (selectedEventType === 'three_pointer') {
      if (selectedTeam.id === teams[0].id) {
        setHomeScore(prev => prev + 3);
      } else {
        setAwayScore(prev => prev + 3);
      }
    } else if (selectedEventType === 'free_throw') {
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
      case 'field_goal': return 'bg-green-500';
      case 'three_pointer': return 'bg-blue-500';
      case 'free_throw': return 'bg-yellow-500';
      case 'foul': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Basketball Event Logger</span>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">Period: {period}</Badge>
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
                eventTypes={BASKETBALL_EVENTS}
                selectedEventType={selectedEventType}
                onSelect={setSelectedEventType}
                disabled={disabled}
                sportType="basketball"
              />
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Button
              variant="outline"
              className={`${getEventColor('field_goal')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('field_goal');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              2pt FG
            </Button>
            <Button
              variant="outline"
              className={`${getEventColor('three_pointer')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('three_pointer');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              3pt FG
            </Button>
            <Button
              variant="outline"
              className={`${getEventColor('free_throw')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('free_throw');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              Free Throw
            </Button>
            <Button
              variant="outline"
              className={`${getEventColor('foul')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('foul');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              Foul
            </Button>
            <Button
              variant="outline"
              className="bg-purple-500 text-white hover:opacity-90"
              onClick={() => {
                setSelectedEventType('timeout');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              Timeout
            </Button>
          </div>

          {/* Period Control */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Period:</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod(p)}
                >
                  {p}
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