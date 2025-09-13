import React, { useState } from 'react';
import { Team, Player, CampusEventType } from '../../../types/campus';
import { EventTypeButtons } from '../forms/EventTypeButtons';
import { PlayerSelector } from '../players/PlayerSelector';
import { TrackFieldTimer } from '../forms/TrackFieldTimer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TrackFieldLoggerProps {
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

const TRACK_FIELD_EVENTS: CampusEventType[] = [
  'race_start', 'race_finish', 'lap_time', 'false_start', 'disqualification',
  'record_attempt', 'jump_attempt', 'throw_attempt', 'measurement'
];

export const TrackFieldLogger: React.FC<TrackFieldLoggerProps> = ({
  teams,
  onEventSubmit,
  disabled = false
}) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<CampusEventType | null>(null);
  const [eventValue, setEventValue] = useState<string | number>('');
  const [eventName, setEventName] = useState<string>('100m Sprint');
  const [raceStarted, setRaceStarted] = useState<boolean>(false);
  const [raceFinished, setRaceFinished] = useState<boolean>(false);

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setSelectedPlayerId(null);
  };

  const handleSubmit = () => {
    if (!selectedEventType) return;
    
    // For race events, we might not need a team
    const requiresTeam = !['race_start', 'race_finish', 'lap_time', 'false_start'].includes(selectedEventType);
    
    if (requiresTeam && !selectedTeam) return;
    
    onEventSubmit({
      teamId: requiresTeam ? selectedTeam?.id : undefined,
      playerId: selectedPlayerId || undefined,
      eventType: selectedEventType,
      timestamp: Date.now(),
      value: eventValue || undefined
    });
    
    // Reset selection but keep team
    setSelectedEventType(null);
    setSelectedPlayerId(null);
    setEventValue('');
  };

  const handleLap = (lapTime: number) => {
    onEventSubmit({
      eventType: 'lap_time',
      timestamp: Date.now(),
      value: lapTime
    });
  };

  const handleFinish = (totalTime: number, laps: number[]) => {
    onEventSubmit({
      eventType: 'race_finish',
      timestamp: Date.now(),
      value: totalTime
    });
    setRaceFinished(true);
  };

  const getEventColor = (eventType: CampusEventType) => {
    switch (eventType) {
      case 'race_start': return 'bg-green-500';
      case 'race_finish': return 'bg-blue-500';
      case 'false_start': return 'bg-yellow-500';
      case 'disqualification': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Track & Field Event Logger</span>
            <Badge variant="secondary">{eventName}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="eventName">Event Name</Label>
            <Input
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g., 100m Sprint, Long Jump"
              disabled={disabled}
            />
          </div>

          {/* Track Timer */}
          <div className="space-y-2">
            <h3 className="font-medium">Race Timer</h3>
            <TrackFieldTimer
              onLap={handleLap}
              onFinish={handleFinish}
              disabled={disabled}
              preset="custom"
            />
          </div>

          {/* Team Selection (for field events) */}
          <div className="space-y-2">
            <h3 className="font-medium">Select Team (for field events)</h3>
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
          </div>

          {/* Player Selection */}
          {selectedTeam && (
            <div className="space-y-2">
              <h3 className="font-medium">Select Athlete</h3>
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
          <div className="space-y-2">
            <h3 className="font-medium">Select Event Type</h3>
            <EventTypeButtons
              eventTypes={TRACK_FIELD_EVENTS}
              selectedEventType={selectedEventType}
              onSelect={setSelectedEventType}
              disabled={disabled}
              sportType="track_events"
            />
          </div>

          {/* Value Input (for measurements) */}
          {(selectedEventType === 'measurement' || selectedEventType === 'jump_attempt' || selectedEventType === 'throw_attempt') && (
            <div className="space-y-2">
              <Label htmlFor="eventValue">Measurement Value</Label>
              <Input
                id="eventValue"
                value={eventValue}
                onChange={(e) => setEventValue(e.target.value)}
                placeholder="e.g., 5.25m, 12.34s"
                disabled={disabled}
              />
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              className={`${getEventColor('race_start')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('race_start');
                handleSubmit();
              }}
              disabled={disabled || raceStarted}
            >
              Start Race
            </Button>
            <Button
              variant="outline"
              className={`${getEventColor('race_finish')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('race_finish');
                handleSubmit();
              }}
              disabled={disabled || !raceStarted || raceFinished}
            >
              Finish Race
            </Button>
            <Button
              variant="outline"
              className={`${getEventColor('false_start')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('false_start');
                handleSubmit();
              }}
              disabled={disabled}
            >
              False Start
            </Button>
            <Button
              variant="outline"
              className={`${getEventColor('disqualification')} text-white hover:opacity-90`}
              onClick={() => {
                setSelectedEventType('disqualification');
                handleSubmit();
              }}
              disabled={disabled}
            >
              DQ
            </Button>
          </div>

          {/* Submit Button */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={disabled || !selectedEventType}
          >
            Log Event
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};