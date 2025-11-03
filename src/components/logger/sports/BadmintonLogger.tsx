import React, { useState } from 'react';
import { Team, CampusEventType } from '../../../types/campus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface BadmintonLoggerProps {
  teams: Team[];
  onEventSubmit: (event: {
    teamId?: string;
    playerId?: string;
    eventType: CampusEventType;
    timestamp: number;
    value?: string | number;
  }) => void;
  disabled?: boolean;
}

export const BadmintonLogger: React.FC<BadmintonLoggerProps> = ({
  teams,
  onEventSubmit,
  disabled = false
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<CampusEventType | null>(null);
  const [scoreTeam1, setScoreTeam1] = useState<number>(0);
  const [scoreTeam2, setScoreTeam2] = useState<number>(0);
  const [gameNumber, setGameNumber] = useState<number>(1);

  const badmintonEvents: CampusEventType[] = [
    'point', 'serve', 'error', 'timeout'
  ];

  const selectedTeam = teams.find(team => team.id === selectedTeamId);
  const players = selectedTeam?.players || [];

  const handleSubmitEvent = () => {
    if (!selectedEventType) {
      toast({
        title: 'Error',
        description: 'Please select an event type',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedTeamId) {
      toast({
        title: 'Error',
        description: 'Please select a team/player',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedPlayerId && selectedEventType !== 'error' && selectedEventType !== 'timeout') {
      toast({
        title: 'Error',
        description: 'Please select a player',
        variant: 'destructive'
      });
      return;
    }

    onEventSubmit({
      teamId: selectedTeamId,
      playerId: selectedPlayerId,
      eventType: selectedEventType,
      timestamp: Date.now(),
      value: selectedEventType === 'error' ? 'unforced_error' : undefined
    });

    toast({
      title: 'Event Logged',
      description: `${selectedEventType} recorded for ${selectedTeam?.name || 'Unknown Player'}`
    });

    // Reset selections
    setSelectedEventType(null);
    setSelectedPlayerId('');
  };

  const handleScoreUpdate = (teamIndex: number, increment: boolean) => {
    if (teamIndex === 0) {
      setScoreTeam1(prev => increment ? prev + 1 : Math.max(0, prev - 1));
    } else {
      setScoreTeam2(prev => increment ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  return (
    <div className="space-y-6">
      {/* Score Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Score Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-2xl font-bold">{teams[0]?.name || 'Player 1'}</div>
              <div className="text-4xl font-bold my-2">{scoreTeam1}</div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleScoreUpdate(0, false)} 
                  disabled={disabled}
                  variant="outline"
                  size="sm"
                >
                  -
                </Button>
                <Button 
                  onClick={() => handleScoreUpdate(0, true)} 
                  disabled={disabled}
                  size="sm"
                >
                  +
                </Button>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold">Game {gameNumber}</div>
              <div className="my-2">
                <Button 
                  onClick={() => setGameNumber(prev => Math.max(1, prev - 1))} 
                  disabled={disabled}
                  variant="outline"
                  size="sm"
                >
                  ←
                </Button>
                <Button 
                  onClick={() => setGameNumber(prev => prev + 1)} 
                  disabled={disabled}
                  variant="outline"
                  size="sm"
                  className="ml-2"
                >
                  →
                </Button>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{teams[1]?.name || 'Player 2'}</div>
              <div className="text-4xl font-bold my-2">{scoreTeam2}</div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleScoreUpdate(1, false)} 
                  disabled={disabled}
                  variant="outline"
                  size="sm"
                >
                  -
                </Button>
                <Button 
                  onClick={() => handleScoreUpdate(1, true)} 
                  disabled={disabled}
                  size="sm"
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Logger */}
      <Card>
        <CardHeader>
          <CardTitle>Event Logger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Team/Player</label>
              <Select 
                value={selectedTeamId} 
                onValueChange={setSelectedTeamId}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Player (if applicable)</label>
              <Select 
                value={selectedPlayerId} 
                onValueChange={setSelectedPlayerId}
                disabled={disabled || !selectedTeamId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {players.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} {player.number && `(#${player.number})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Event Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {badmintonEvents.map(event => (
                <Button
                  key={event}
                  variant={selectedEventType === event ? "default" : "outline"}
                  onClick={() => setSelectedEventType(event)}
                  disabled={disabled}
                  className="text-xs h-16 flex flex-col items-center justify-center"
                >
                  <span className="font-medium">{event.replace('_', ' ')}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={handleSubmitEvent} 
            disabled={disabled || !selectedEventType}
            className="w-full"
          >
            Log Event
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};