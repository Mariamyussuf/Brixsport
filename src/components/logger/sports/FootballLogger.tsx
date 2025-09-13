import React, { useState } from 'react';
import { Team, Player, CampusEventType } from '../../../types/campus';
import { EventTypeButtons } from '../forms/EventTypeButtons';
import { PlayerSelector } from '../players/PlayerSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FootballLoggerProps {
  teams: Team[];
  onEventSubmit: (event: {
    teamId: string;
    playerId?: string;
    eventType: CampusEventType;
    timestamp: number;
  }) => void;
  disabled?: boolean;
}

const FOOTBALL_EVENTS: CampusEventType[] = [
  'goal', 'assist', 'save', 'yellow_card', 'red_card', 'foul',
  'substitution', 'corner', 'free_kick', 'penalty'
];

export const FootballLogger: React.FC<FootballLoggerProps> = ({
  teams,
  onEventSubmit,
  disabled = false
}) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<CampusEventType | null>(null);
  const [formation, setFormation] = useState<string>('4-4-2');

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setSelectedPlayerId(null);
  };

  const handleSubmit = () => {
    if (!selectedTeam || !selectedEventType) return;
    
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
      case 'goal': return 'bg-green-500';
      case 'yellow_card': return 'bg-yellow-500';
      case 'red_card': return 'bg-red-500';
      case 'substitution': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Football Event Logger</span>
            <Badge variant="secondary">Formation: {formation}</Badge>
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
                eventTypes={FOOTBALL_EVENTS}
                selectedEventType={selectedEventType}
                onSelect={setSelectedEventType}
                disabled={disabled}
                sportType="football"
              />
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              className={`${getEventColor('goal')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('goal');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              Goal
            </Button>
            <Button
              variant="outline"
              className={`${getEventColor('yellow_card')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('yellow_card');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              Yellow Card
            </Button>
            <Button
              variant="outline"
              className={`${getEventColor('red_card')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('red_card');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              Red Card
            </Button>
            <Button
              variant="outline"
              className={`${getEventColor('substitution')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('substitution');
                handleSubmit();
              }}
              disabled={disabled || !selectedTeam}
            >
              Substitution
            </Button>
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