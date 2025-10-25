import React, { useState, useEffect, useRef } from "react";
import { Team, Player, CampusEventType } from '../../../types/campus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Pause, Square, Plus, Trophy, Timer, User, Undo2 } from "lucide-react";
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Runner {
  id: string;
  name: string;
  lane: number;
  time?: number;
  position?: number;
  rating?: number;
}

interface Race {
  event: string;
  runners: Runner[];
  isRunning: boolean;
  startTime?: number;
  elapsedTime: number;
  isFinished: boolean;
}

interface TrackEvent {
  id: string;
  teamId?: string;
  playerId?: string;
  eventType: CampusEventType;
  timestamp: number;
  value?: string | number;
  playerName?: string;
  teamName?: string;
}

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

const TRACK_EVENTS = [
  { value: "100m", label: "100m Sprint" },
  { value: "200m", label: "200m Sprint" },
  { value: "400m", label: "400m Sprint" },
  { value: "800m", label: "800m Distance" },
  { value: "relay", label: "Relay Race" }
];

const TRACK_FIELD_EVENTS: CampusEventType[] = [
  'race_start', 'race_finish', 'lap_time', 'false_start', 'disqualification',
  'record_attempt', 'jump_attempt', 'throw_attempt', 'measurement'
];

const TRACK_EVENT_CATEGORIES = [
  { value: 'all', label: 'All Events' },
  { value: 'race', label: 'Race Events' },
  { value: 'field', label: 'Field Events' }
];

export const TrackFieldLogger: React.FC<TrackFieldLoggerProps> = ({
  teams,
  onEventSubmit,
  disabled = false
}) => {
  // Race timer state
  const [currentRace, setCurrentRace] = useState<Race>({
    event: "",
    runners: [],
    isRunning: false,
    elapsedTime: 0,
    isFinished: false
  });

  // Field event state
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<CampusEventType | null>(null);
  const [eventValue, setEventValue] = useState<string | number>('');
  const [eventName, setEventName] = useState<string>('100m Sprint');
  
  // UI state
  const [activeTab, setActiveTab] = useState<'race' | 'field'>('race');
  const [events, setEvents] = useState<TrackEvent[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<TrackEvent | null>(null);
  const [selectedEventCategory, setSelectedEventCategory] = useState<'all' | 'race' | 'field'>('all');
  const [newRunnerName, setNewRunnerName] = useState("");
  
  // Refs for two-tap confirmation system
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{eventType: CampusEventType, timestamp: number} | null>(null);
  
  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle timer logic
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 0.01);
      }, 10);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning]);
  
  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setSelectedPlayerId(null);
  };
  
  const addEvent = (event: TrackEvent) => {
    setEvents(prev => [event, ...prev]);
    onEventSubmit({
      teamId: event.teamId,
      playerId: event.playerId,
      eventType: event.eventType,
      timestamp: event.timestamp,
      value: event.value
    });
  };
  
  const handleSubmit = () => {
    if (!selectedEventType) return;
    
    // For race events, we might not need a team
    const requiresTeam = !['race_start', 'race_finish', 'lap_time', 'false_start'].includes(selectedEventType);
    
    if (requiresTeam && !selectedTeam) return;
    
    const event: TrackEvent = {
      id: Date.now().toString(),
      teamId: requiresTeam ? selectedTeam?.id : undefined,
      playerId: selectedPlayerId || undefined,
      eventType: selectedEventType,
      timestamp: Date.now(),
      value: eventValue || undefined,
      playerName: selectedTeam?.players.find(p => p.id === selectedPlayerId)?.name,
      teamName: selectedTeam?.name
    };
    
    // Two-tap confirmation system
    if (!lastTapRef.current || 
        lastTapRef.current.eventType !== selectedEventType || 
        Date.now() - lastTapRef.current.timestamp > 2000) {
      // First tap - show confirmation
      lastTapRef.current = { eventType: selectedEventType, timestamp: Date.now() };
      setPendingEvent(event);
      setShowConfirmDialog(true);
      return;
    }
    
    // Second tap within 2 seconds - execute action
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }
    lastTapRef.current = null;
    
    executeEvent(event);
  };
  
  const executeEvent = (event: TrackEvent) => {
    addEvent(event);
    
    // Reset selection but keep team
    setSelectedEventType(null);
    setSelectedPlayerId(null);
    setEventValue('');
    
    toast({
      title: "Event Logged",
      description: `${event.eventType} recorded successfully`
    });
  };
  
  const confirmEvent = () => {
    if (pendingEvent) {
      executeEvent(pendingEvent);
      setPendingEvent(null);
    }
    setShowConfirmDialog(false);
  };
  
  const addRunner = () => {
    if (!newRunnerName.trim()) return;
    
    const newRunner: Runner = {
      id: Date.now().toString(),
      name: newRunnerName,
      lane: currentRace.runners.length + 1,
      rating: 5.0
    };

    setCurrentRace(prev => ({
      ...prev,
      runners: [...prev.runners, newRunner]
    }));
    setNewRunnerName("");
  };

  const removeRunner = (runnerId: string) => {
    setCurrentRace(prev => ({
      ...prev,
      runners: prev.runners.filter(r => r.id !== runnerId)
        .map((runner, index) => ({ ...runner, lane: index + 1 }))
    }));
  };

  const startRace = () => {
    if (currentRace.runners.length === 0) return;
    
    setIsTimerRunning(true);
    setCurrentRace(prev => ({
      ...prev,
      isRunning: true,
      startTime: Date.now(),
      elapsedTime: 0,
      isFinished: false,
      runners: prev.runners.map(runner => ({ ...runner, time: undefined, position: undefined, rating: 5.0 }))
    }));
  };

  const pauseRace = () => {
    setIsTimerRunning(false);
    setCurrentRace(prev => ({ ...prev, isRunning: false }));
  };

  const stopRace = () => {
    setIsTimerRunning(false);
    setCurrentRace(prev => ({ 
      ...prev, 
      isRunning: false, 
      isFinished: true 
    }));
    
    toast({
      title: "Race Finished",
      description: `Race completed in ${formatTime(elapsedTime)} seconds`
    });
  };

  const resetRace = () => {
    setIsTimerRunning(false);
    setElapsedTime(0);
    setCurrentRace(prev => ({
      ...prev,
      isRunning: false,
      startTime: undefined,
      elapsedTime: 0,
      isFinished: false,
      runners: prev.runners.map(runner => ({ ...runner, time: undefined, position: undefined, rating: 5.0 }))
    }));
    
    toast({
      title: "Race Reset",
      description: "Race timer has been reset"
    });
  };

  const recordRunnerTime = (runnerId: string) => {
    const time = elapsedTime;
    
    setCurrentRace(prev => ({
      ...prev,
      runners: prev.runners.map(runner => 
        runner.id === runnerId ? { ...runner, time, rating: 5.0 } : runner
      )
    }));
    
    toast({
      title: "Time Recorded",
      description: `Time recorded for ${currentRace.runners.find(r => r.id === runnerId)?.name}`
    });
  };

  const setRunnerPosition = (runnerId: string, position: number) => {
    setCurrentRace(prev => ({
      ...prev,
      runners: prev.runners.map(runner => 
        runner.id === runnerId ? { ...runner, position } : runner
      )
    }));
  };

  const formatTime = (time: number) => {
    return time.toFixed(2);
  };

  const sortedRunners = [...currentRace.runners].sort((a, b) => {
    if (a.position && b.position) return a.position - b.position;
    if (a.position) return -1;
    if (b.position) return 1;
    if (a.time && b.time) return a.time - b.time;
    return 0;
  });

  const handleLap = (lapTime: number) => {
    onEventSubmit({
      eventType: 'lap_time',
      timestamp: Date.now(),
      value: lapTime
    });
    
    toast({
      title: "Lap Time Recorded",
      description: `Lap completed in ${lapTime.toFixed(2)} seconds`
    });
  };

  const handleFinish = (totalTime: number, laps: number[]) => {
    onEventSubmit({
      eventType: 'race_finish',
      timestamp: Date.now(),
      value: totalTime
    });
    
    toast({
      title: "Race Finished",
      description: `Race completed in ${totalTime.toFixed(2)} seconds`
    });
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

  const filteredEvents = events.filter(event => {
    if (selectedEventCategory === 'all') return true;
    if (selectedEventCategory === 'race') {
      return ['race_start', 'race_finish', 'lap_time', 'false_start', 'disqualification'].includes(event.eventType);
    }
    if (selectedEventCategory === 'field') {
      return ['record_attempt', 'jump_attempt', 'throw_attempt', 'measurement'].includes(event.eventType);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Track & Field Event Logger</span>
            <Badge variant="secondary">{currentRace.event || eventName}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'race' | 'field')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="race">Race Events</TabsTrigger>
              <TabsTrigger value="field">Field Events</TabsTrigger>
            </TabsList>
            
            <TabsContent value="race" className="space-y-6">
              {/* Race Header */}
              <div className="text-center space-y-4">
                {/* Event Selection */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                  <Select value={currentRace.event} onValueChange={(value) => 
                    setCurrentRace(prev => ({ ...prev, event: value }))
                  }>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select Event" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRACK_EVENTS.map(event => (
                        <SelectItem key={event.value} value={event.value}>
                          {event.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Stopwatch Display */}
                  <div className="flex items-center gap-2 text-2xl font-mono bg-background border rounded-lg px-4 py-2">
                    <Timer className="h-6 w-6" />
                    <span>{formatTime(elapsedTime)}s</span>
                  </div>
                </div>

                {/* Race Controls */}
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button 
                    onClick={startRace} 
                    disabled={currentRace.isRunning || currentRace.runners.length === 0}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start Race
                  </Button>
                  <Button 
                    onClick={pauseRace} 
                    disabled={!currentRace.isRunning}
                    variant="outline"
                    className="gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                  <Button 
                    onClick={stopRace} 
                    disabled={!currentRace.isRunning}
                    variant="outline"
                    className="gap-2"
                  >
                    <Square className="h-4 w-4" />
                    Finish
                  </Button>
                  <Button 
                    onClick={resetRace}
                    variant="outline"
                    className="gap-2"
                  >
                    Reset
                  </Button>
                </div>
              </div>

              {/* Runner Management */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Runners */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3">Race Participants</h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Runner name"
                        value={newRunnerName}
                        onChange={(e) => setNewRunnerName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addRunner()}
                      />
                      <Button onClick={addRunner} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {currentRace.runners.map((runner) => (
                        <div key={runner.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                              {runner.lane}
                            </div>
                            <span className="font-medium text-sm">{runner.name}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeRunner(runner.id)}
                            disabled={currentRace.isRunning}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Live Timing */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3">Live Timing</h3>
                  
                  {currentRace.isRunning && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-2">Tap to record finish time:</p>
                      {currentRace.runners.map((runner) => (
                        <Button
                          key={runner.id}
                          variant={runner.time ? "secondary" : "outline"}
                          className="w-full justify-between text-sm"
                          onClick={() => recordRunnerTime(runner.id)}
                          disabled={!!runner.time}
                        >
                          <span>Lane {runner.lane}: {runner.name}</span>
                          {runner.time && <span>{formatTime(runner.time)}s</span>}
                        </Button>
                      ))}
                    </div>
                  )}

                  {!currentRace.isRunning && !currentRace.isFinished && (
                    <div className="text-center text-muted-foreground py-4">
                      <Timer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Start the race to begin timing</p>
                    </div>
                  )}
                </Card>
              </div>

              {/* Results & Positions */}
              {(currentRace.isFinished || currentRace.runners.some(r => r.time)) && (
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Race Results - {currentRace.event}
                  </h3>
                  
                  {/* Position Assignment */}
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Assign Positions</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentRace.runners.filter(r => r.time).map((runner) => (
                        <div key={runner.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <span className="text-xs font-medium min-w-0 flex-1 truncate">{runner.name}</span>
                          <Select 
                            value={runner.position?.toString() || ""} 
                            onValueChange={(value) => setRunnerPosition(runner.id, parseInt(value))}
                          >
                            <SelectTrigger className="w-16 text-xs">
                              <SelectValue placeholder="Pos" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: currentRace.runners.length }, (_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                  {i + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Final Results Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Position</th>
                          <th className="text-left p-2">Lane</th>
                          <th className="text-left p-2">Runner</th>
                          <th className="text-left p-2">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRunners.filter(r => r.time).map((runner, index) => (
                          <tr key={runner.id} className="border-b">
                            <td className="p-2">
                              {runner.position ? (
                                <div className="flex items-center gap-1">
                                  {runner.position === 1 && <span className="text-yellow-500">🥇</span>}
                                  {runner.position === 2 && <span className="text-gray-400">🥈</span>}
                                  {runner.position === 3 && <span className="text-amber-600">🥉</span>}
                                  <span className="font-medium">{runner.position}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-2">{runner.lane}</td>
                            <td className="p-2 font-medium">{runner.name}</td>
                            <td className="p-2 font-mono">{runner.time ? formatTime(runner.time) : '-'}s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="field" className="space-y-6">
              {/* Event Name */}
              <div className="space-y-2">
                <label htmlFor="eventName" className="text-sm font-medium">Event Name</label>
                <Input
                  id="eventName"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., Long Jump, Shot Put"
                  disabled={disabled}
                />
              </div>

              {/* Event Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Filter Events</label>
                <Select value={selectedEventCategory} onValueChange={(value) => setSelectedEventCategory(value as 'all' | 'race' | 'field')}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACK_EVENT_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Team Selection (for field events) */}
              <div className="space-y-2">
                <h3 className="font-medium">Select Team</h3>
                <div className="flex flex-wrap gap-2">
                  {teams.map((team) => (
                    <Button
                      key={team.id}
                      variant={selectedTeam?.id === team.id ? "default" : "outline"}
                      className="flex items-center gap-2 text-sm"
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
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                    {selectedTeam.players.map((player) => (
                      <div 
                        key={player.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted",
                          selectedPlayerId === player.id && "bg-primary/10"
                        )}
                        onClick={() => setSelectedPlayerId(player.id)}
                      >
                        <User className="h-4 w-4" />
                        <span className="text-sm">{player.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Event Type Selection */}
              <div className="space-y-2">
                <h3 className="font-medium">Select Event Type</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TRACK_FIELD_EVENTS
                    .filter(event => {
                      if (selectedEventCategory === 'all') return true;
                      if (selectedEventCategory === 'race') {
                        return ['race_start', 'race_finish', 'lap_time', 'false_start', 'disqualification'].includes(event);
                      }
                      if (selectedEventCategory === 'field') {
                        return ['record_attempt', 'jump_attempt', 'throw_attempt', 'measurement'].includes(event);
                      }
                      return true;
                    })
                    .map((event) => (
                      <Button
                        key={event}
                        variant={selectedEventType === event ? "default" : "outline"}
                        className={cn(
                          "text-xs h-16 flex flex-col gap-1",
                          getEventColor(event as CampusEventType)
                        )}
                        onClick={() => setSelectedEventType(event as CampusEventType)}
                        disabled={disabled}
                      >
                        <span className="font-medium capitalize">{event.replace('_', ' ')}</span>
                      </Button>
                    ))}
                </div>
              </div>

              {/* Value Input (for measurements) */}
              {(selectedEventType === 'measurement' || selectedEventType === 'jump_attempt' || selectedEventType === 'throw_attempt') && (
                <div className="space-y-2">
                  <label htmlFor="eventValue" className="text-sm font-medium">Measurement Value</label>
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
                  className={cn(getEventColor('race_start'), "text-white hover:opacity-90")}
                  onClick={() => {
                    setSelectedEventType('race_start');
                    handleSubmit();
                  }}
                  disabled={disabled}
                >
                  Start
                </Button>
                <Button
                  variant="outline"
                  className={cn(getEventColor('race_finish'), "text-white hover:opacity-90")}
                  onClick={() => {
                    setSelectedEventType('race_finish');
                    handleSubmit();
                  }}
                  disabled={disabled}
                >
                  Finish
                </Button>
                <Button
                  variant="outline"
                  className={cn(getEventColor('false_start'), "text-white hover:opacity-90")}
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
                  className={cn(getEventColor('disqualification'), "text-white hover:opacity-90")}
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

              {/* Event History */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Recent Events</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setEvents([])}
                    disabled={events.length === 0}
                  >
                    <Undo2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
                
                {filteredEvents.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <div>
                          <div className="font-medium capitalize">{event.eventType.replace('_', ' ')}</div>
                          <div className="text-xs text-muted-foreground">
                            {event.teamName && `${event.teamName} - `}
                            {event.playerName && `${event.playerName}`}
                            {event.value && ` (${event.value})`}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground text-sm py-4">
                    No events recorded yet
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to log this event?</p>
            <div className="bg-muted p-3 rounded">
              <div className="font-medium capitalize">{pendingEvent?.eventType.replace('_', ' ')}</div>
              <div className="text-sm text-muted-foreground">
                {pendingEvent?.teamName && `${pendingEvent.teamName} - `}
                {pendingEvent?.playerName && `${pendingEvent.playerName}`}
                {pendingEvent?.value && ` (${pendingEvent.value})`}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmEvent}>
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};