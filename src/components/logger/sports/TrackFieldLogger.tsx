import React, { useState, useEffect, useRef } from "react";
import { Team, Player, CampusEventType } from '../../../types/campus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Play, Pause, Square, Plus, Trophy, Timer, User, Undo2, RotateCcw, Search, Filter, ChevronDown, ChevronRight, Info, BarChart3, TrendingUp, Edit, Save, X } from "lucide-react";
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { PlayerSelector } from '@/components/logger/players/PlayerSelector';
import { trackPlayerService, TrackRecord } from '@/services/trackPlayerService';

interface Runner {
  id: string;
  name: string;
  lane: number;
  time?: number;
  position?: number;
  rating?: number;
  // Track-specific fields
  personalBest?: number;
  seasonBest?: number;
  previousPositions?: number[];
  trackRecords?: TrackRecord[];
}

interface Race {
  event: string;
  runners: Runner[];
  isRunning: boolean;
  startTime?: number;
  elapsedTime: number;
  isFinished: boolean;
}

// Enhanced TrackEvent interface with more metadata
interface TrackEvent {
  id: string;
  teamId?: string;
  playerId?: string;
  eventType: CampusEventType;
  timestamp: number;
  value?: string | number;
  playerName?: string;
  teamName?: string;
  // Additional metadata fields
  notes?: string;
  location?: string; // For field events like where on the field
  attemptNumber?: number; // For multiple attempts
  windSpeed?: number; // For wind-affected events
  temperature?: number; // Environmental conditions
  isValid?: boolean; // Whether the attempt was valid
  foulType?: string; // Type of foul if applicable
  injurySeverity?: string; // Severity level for injuries
  recordType?: string; // Type of record being attempted
}

// Analytics interfaces
interface EventStats {
  total: number;
  byType: Record<string, number>;
  byTeam: Record<string, number>;
  byPlayer: Record<string, number>;
}

interface PerformanceTrend {
  date: string;
  value: number;
}

interface PlayerPerformance {
  playerId: string;
  playerName: string;
  eventType: string;
  bestValue?: number | string;
  averageValue?: number;
  attempts: number;
  successRate: number;
  // Track-specific performance data
  personalBest?: number;
  seasonBest?: number;
  previousPositions?: number[];
}

interface GroupedEvents {
  [key: string]: TrackEvent[];
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

// Add event type filter options
const EVENT_TYPE_FILTERS = [
  { value: 'all', label: 'All Event Types' },
  { value: 'race_start', label: 'Race Start' },
  { value: 'race_finish', label: 'Race Finish' },
  { value: 'lap_time', label: 'Lap Time' },
  { value: 'false_start', label: 'False Start' },
  { value: 'disqualification', label: 'Disqualification' },
  { value: 'record_attempt', label: 'Record Attempt' },
  { value: 'jump_attempt', label: 'Jump Attempt' },
  { value: 'throw_attempt', label: 'Throw Attempt' },
  { value: 'measurement', label: 'Measurement' }
];

// Injury severity options
const INJURY_SEVERITY_OPTIONS = [
  { value: 'minor', label: 'Minor' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' }
];

// Foul types
const FOUL_TYPES = [
  { value: 'false_start', label: 'False Start' },
  { value: 'lane_violation', label: 'Lane Violation' },
  { value: 'interference', label: 'Interference' },
  { value: 'equipment_violation', label: 'Equipment Violation' },
  { value: 'other', label: 'Other' }
];

// Record types
const RECORD_TYPES = [
  { value: 'world', label: 'World Record' },
  { value: 'olympic', label: 'Olympic Record' },
  { value: 'championship', label: 'Championship Record' },
  { value: 'national', label: 'National Record' },
  { value: 'personal', label: 'Personal Best' },
  { value: 'season', label: 'Season Best' }
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
  
  // Enhanced metadata states
  const [eventNotes, setEventNotes] = useState<string>('');
  const [eventLocation, setEventLocation] = useState<string>('');
  const [attemptNumber, setAttemptNumber] = useState<number>(1);
  const [windSpeed, setWindSpeed] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(20);
  const [isValidAttempt, setIsValidAttempt] = useState<boolean>(true);
  const [foulType, setFoulType] = useState<string>('');
  const [injurySeverity, setInjurySeverity] = useState<string>('');
  const [recordType, setRecordType] = useState<string>('');
  
  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  // Event editing state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState<TrackEvent | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'race' | 'field'>('race');
  const [events, setEvents] = useState<TrackEvent[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<TrackEvent | null>(null);
  const [selectedEventCategory, setSelectedEventCategory] = useState<'all' | 'race' | 'field'>('all');
  const [newRunnerName, setNewRunnerName] = useState("");
  
  // Add new filter states
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  
  // Add grouping states
  const [groupBy, setGroupBy] = useState<'time' | 'event' | 'team'>('time');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Pre-fetch track records for all players
  const [playerTrackRecords, setPlayerTrackRecords] = useState<Record<string, TrackRecord[]>>({});
  const [loadingTrackRecords, setLoadingTrackRecords] = useState(false);
  
  // Refs for two-tap confirmation system
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{eventType: CampusEventType, timestamp: number} | null>(null);
  
  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
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
  
  // Pre-fetch track records for all players
  useEffect(() => {
    const fetchAllPlayerTrackRecords = async () => {
      if (teams.length === 0) return;
      
      setLoadingTrackRecords(true);
      const allPlayers = teams.flatMap(team => team.players);
      const playerIds = allPlayers.map(player => player.id);
      
      try {
        const records = await trackPlayerService.getMultiplePlayerTrackRecords(playerIds);
        setPlayerTrackRecords(records);
      } catch (error) {
        console.error('Error fetching player track records:', error);
      } finally {
        setLoadingTrackRecords(false);
      }
    };
    
    fetchAllPlayerTrackRecords();
  }, [teams]);
  
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
      teamName: selectedTeam?.name,
      notes: eventNotes || undefined,
      location: eventLocation || undefined,
      attemptNumber: attemptNumber > 1 ? attemptNumber : undefined,
      windSpeed: windSpeed !== 0 ? windSpeed : undefined,
      temperature: temperature !== 20 ? temperature : undefined,
      isValid: isValidAttempt,
      foulType: foulType || undefined,
      injurySeverity: injurySeverity || undefined,
      recordType: recordType || undefined
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
    setEventNotes('');
    setEventLocation('');
    setAttemptNumber(1);
    setWindSpeed(0);
    setTemperature(20);
    setIsValidAttempt(true);
    setFoulType('');
    setInjurySeverity('');
    setRecordType('');
    
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
  
  const undoLastEvent = () => {
    if (events.length === 0) return;
    
    const lastEvent = events[0];
    setEvents(prev => prev.slice(1));
    
    toast({
      title: "Event Undone",
      description: `Last event (${lastEvent.eventType}) has been removed`
    });
  };
  
  // Enhanced addRunner function to include track records
  const addRunner = async () => {
    if (!newRunnerName.trim()) return;
    
    // Check if this is a player from our database
    let player: Player | undefined;
    let trackRecords: TrackRecord[] = [];
    
    // Look for the player in all teams
    for (const team of teams) {
      player = team.players.find(p => p.name === newRunnerName);
      if (player) break;
    }
    
    // If player is found, fetch their track records
    if (player) {
      trackRecords = await trackPlayerService.getPlayerTrackRecords(player.id);
      
      // Log the fetched records for debugging
      console.log('Fetched track records for player:', player.name, trackRecords);
    }
    
    // Get best times from track records for display
    const bestTimes = trackPlayerService.getBestTimes(trackRecords);
    const previousPositions = trackRecords.length > 0 ? trackRecords[0].previousPositions : undefined;
    
    const newRunner: Runner = {
      id: player?.id || Date.now().toString(),
      name: newRunnerName,
      lane: currentRace.runners.length + 1,
      rating: 5.0,
      personalBest: bestTimes.personalBest,
      seasonBest: bestTimes.seasonBest,
      previousPositions,
      trackRecords
    };

    setCurrentRace(prev => ({
      ...prev,
      runners: [...prev.runners, newRunner]
    }));
    
    // Show a toast notification with the player's track record info
    if (player && trackRecords.length > 0 && bestTimes.personalBest) {
      const summary = trackPlayerService.getPlayerPerformanceSummary(trackRecords);
      if (summary.bestEvent) {
        toast({
          title: "Athlete Added",
          description: `${player.name} added with personal best ${bestTimes.personalBest.toFixed(2)}s in ${summary.bestEvent.eventName}`
        });
      } else {
        toast({
          title: "Athlete Added",
          description: `${player.name} added with personal best ${bestTimes.personalBest.toFixed(2)}s`
        });
      }
    }
    
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

  const getEventIcon = (eventType: CampusEventType) => {
    switch (eventType) {
      case 'race_start': return <Play className="h-4 w-4" />;
      case 'race_finish': return <Square className="h-4 w-4" />;
      case 'false_start': return <Pause className="h-4 w-4" />;
      case 'disqualification': return <Undo2 className="h-4 w-4" />;
      case 'measurement': return <Timer className="h-4 w-4" />;
      case 'jump_attempt': return <User className="h-4 w-4" />;
      case 'throw_attempt': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  }

  // Enhanced filtering function
  const filteredEvents = events.filter(event => {
    // Category filter
    if (selectedEventCategory === 'race') {
      if (!['race_start', 'race_finish', 'lap_time', 'false_start', 'disqualification'].includes(event.eventType)) {
        return false;
      }
    }
    if (selectedEventCategory === 'field') {
      if (!['record_attempt', 'jump_attempt', 'throw_attempt', 'measurement'].includes(event.eventType)) {
        return false;
      }
    }
    
    // Event type filter
    if (eventTypeFilter !== 'all' && event.eventType !== eventTypeFilter) {
      return false;
    }
    
    // Team filter
    if (teamFilter !== 'all' && event.teamId !== teamFilter) {
      return false;
    }
    
    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesEventType = event.eventType.toLowerCase().includes(term);
      const matchesTeamName = event.teamName?.toLowerCase().includes(term);
      const matchesPlayerName = event.playerName?.toLowerCase().includes(term);
      const matchesValue = event.value?.toString().toLowerCase().includes(term);
      const matchesNotes = event.notes?.toLowerCase().includes(term);
      
      if (!matchesEventType && !matchesTeamName && !matchesPlayerName && !matchesValue && !matchesNotes) {
        return false;
      }
    }
    
    return true;
  });

  // Group events based on selected grouping option
  const groupEvents = (): GroupedEvents => {
    const groups: GroupedEvents = {};
    
    filteredEvents.forEach(event => {
      let groupKey: string;
      
      switch (groupBy) {
        case 'time':
          // Group by 15-minute intervals
          const date = new Date(event.timestamp);
          const minutes = Math.floor(date.getMinutes() / 15) * 15;
          groupKey = `${date.getHours()}:${minutes.toString().padStart(2, '0')}`;
          break;
        case 'event':
          groupKey = event.eventType;
          break;
        case 'team':
          groupKey = event.teamName || 'No Team';
          break;
        default:
          groupKey = 'All Events';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(event);
    });
    
    return groups;
  };

  // Toggle group expansion
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const groupedEvents = groupEvents();

  // Format metadata for display
  const formatMetadata = (event: TrackEvent) => {
    const metadataItems = [];
    
    if (event.notes) {
      metadataItems.push(`Notes: ${event.notes}`);
    }
    
    if (event.location) {
      metadataItems.push(`Location: ${event.location}`);
    }
    
    if (event.attemptNumber && event.attemptNumber > 1) {
      metadataItems.push(`Attempt #${event.attemptNumber}`);
    }
    
    if (event.windSpeed !== undefined && event.windSpeed !== 0) {
      metadataItems.push(`Wind: ${event.windSpeed} m/s`);
    }
    
    if (event.temperature !== undefined && event.temperature !== 20) {
      metadataItems.push(`Temp: ${event.temperature}°C`);
    }
    
    if (event.isValid === false) {
      metadataItems.push('Invalid Attempt');
    }
    
    if (event.foulType) {
      metadataItems.push(`Foul: ${event.foulType}`);
    }
    
    if (event.injurySeverity) {
      metadataItems.push(`Injury: ${event.injurySeverity}`);
    }
    
    if (event.recordType) {
      metadataItems.push(`Record: ${event.recordType}`);
    }
    
    return metadataItems.join(' • ');
  };

  // Calculate event statistics
  const calculateEventStats = (): EventStats => {
    const stats: EventStats = {
      total: filteredEvents.length,
      byType: {},
      byTeam: {},
      byPlayer: {}
    };
    
    filteredEvents.forEach(event => {
      // Count by event type
      stats.byType[event.eventType] = (stats.byType[event.eventType] || 0) + 1;
      
      // Count by team
      if (event.teamName) {
        stats.byTeam[event.teamName] = (stats.byTeam[event.teamName] || 0) + 1;
      }
      
      // Count by player
      if (event.playerName) {
        stats.byPlayer[event.playerName] = (stats.byPlayer[event.playerName] || 0) + 1;
      }
    });
    
    return stats;
  };

  // Get player performance data
  const getPlayerPerformance = (): PlayerPerformance[] => {
    const playerMap: Record<string, PlayerPerformance> = {};
    
    filteredEvents.forEach(event => {
      if (!event.playerId || !event.playerName) return;
      
      const key = `${event.playerId}-${event.eventType}`;
      if (!playerMap[key]) {
        playerMap[key] = {
          playerId: event.playerId,
          playerName: event.playerName,
          eventType: event.eventType,
          attempts: 0,
          successRate: 0
        };
        
        // Add track records if available
        const runner = currentRace.runners.find(r => r.id === event.playerId);
        if (runner) {
          playerMap[key].personalBest = runner.personalBest;
          playerMap[key].seasonBest = runner.seasonBest;
          playerMap[key].previousPositions = runner.previousPositions;
        }
      }
      
      playerMap[key].attempts += 1;
      
      // For numeric values, track best and average
      if (typeof event.value === 'number') {
        if (playerMap[key].bestValue === undefined || event.value > (playerMap[key].bestValue as number)) {
          playerMap[key].bestValue = event.value;
        }
        
        const currentAvg = playerMap[key].averageValue || 0;
        playerMap[key].averageValue = ((currentAvg * (playerMap[key].attempts - 1)) + event.value) / playerMap[key].attempts;
      }
      
      // Count valid attempts for success rate
      if (event.isValid !== false) {
        playerMap[key].successRate = ((playerMap[key].successRate * (playerMap[key].attempts - 1)) + 1) / playerMap[key].attempts;
      }
    });
    
    return Object.values(playerMap);
  };

  // Get performance trends
  const getPerformanceTrends = (): PerformanceTrend[] => {
    // Group events by day and calculate average performance
    const dailyData: Record<string, { total: number; count: number }> = {};
    
    filteredEvents
      .filter(event => typeof event.value === 'number')
      .forEach(event => {
        const date = new Date(event.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
        if (!dailyData[date]) {
          dailyData[date] = { total: 0, count: 0 };
        }
        dailyData[date].total += event.value as number;
        dailyData[date].count += 1;
      });
    
    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        value: data.total / data.count // Average value for the day
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Open edit dialog for an event
  const openEditDialog = (event: TrackEvent) => {
    setEditingEventId(event.id);
    setEditEvent({ ...event });
    setShowEditDialog(true);
  };

  // Save edited event
  const saveEditedEvent = () => {
    if (!editEvent) return;
    
    setEvents(prevEvents => 
      prevEvents.map(event => 
        event.id === editEvent.id ? editEvent : event
      )
    );
    
    setShowEditDialog(false);
    setEditEvent(null);
    setEditingEventId(null);
    
    toast({
      title: "Event Updated",
      description: "Event has been successfully updated"
    });
  };

  // Delete an event
  const deleteEvent = (eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    
    toast({
      title: "Event Deleted",
      description: "Event has been successfully removed"
    });
  };

  const eventStats = calculateEventStats();
  const playerPerformance = getPlayerPerformance();
  const performanceTrends = getPerformanceTrends();

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Track & Field Logger</span>
            <Badge variant="secondary">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'race' | 'field')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="race">Race Events</TabsTrigger>
              <TabsTrigger value="field">Field Events</TabsTrigger>
            </TabsList>
            
            <TabsContent value="race" className="space-y-6">
              {/* Race Setup */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="raceEvent" className="text-sm font-medium">Race Event</label>
                    <Select value={currentRace.event} onValueChange={(value) => setCurrentRace(prev => ({ ...prev, event: value }))}>
                      <SelectTrigger id="raceEvent">
                        <SelectValue placeholder="Select event" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRACK_EVENTS.map(event => (
                          <SelectItem key={event.value} value={event.value}>
                            {event.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
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
                        placeholder="Runner name or select from database"
                        value={newRunnerName}
                        onChange={(e) => setNewRunnerName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addRunner()}
                      />
                      <Button onClick={addRunner} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                    
                    {/* Player Selector for Track Athletes */}
                    <div className="border rounded-lg p-3">
                      <h4 className="text-sm font-medium mb-2">Select from Database</h4>
                      {loadingTrackRecords && (
                        <div className="text-xs text-muted-foreground mb-2">Loading athlete records...</div>
                      )}
                      <PlayerSelector
                        players={teams.flatMap(team => team.players)}
                        selectedPlayerId={null}
                        onSelect={async (playerId) => {
                          const player = teams.flatMap(team => team.players).find(p => p.id === playerId);
                          if (player) {
                            // Use pre-fetched track records if available, otherwise fetch them
                            const trackRecords = playerTrackRecords[playerId] || await trackPlayerService.getPlayerTrackRecords(player.id);
                            
                            // Set runner name
                            setNewRunnerName(player.name);
                            
                            // Get best times across all events
                            const bestTimes = trackPlayerService.getBestTimes(trackRecords);
                            
                            // Create runner object with track records
                            const newRunner: Runner = {
                              id: player.id,
                              name: player.name,
                              lane: currentRace.runners.length + 1,
                              rating: 5.0,
                              personalBest: bestTimes.personalBest,
                              seasonBest: bestTimes.seasonBest,
                              previousPositions: trackRecords.length > 0 ? trackRecords[0].previousPositions : undefined,
                              trackRecords: trackRecords
                            };
                            
                            // Add the runner to the race
                            setCurrentRace(prev => ({
                              ...prev,
                              runners: [...prev.runners, newRunner]
                            }));
                            
                            // Show toast with athlete info
                            const summary = trackPlayerService.getPlayerPerformanceSummary(trackRecords);
                            if (summary.bestPersonalTime && summary.bestEvent) {
                              toast({
                                title: "Athlete Added",
                                description: `${player.name} added with personal best ${summary.bestPersonalTime.toFixed(2)}s in ${summary.bestEvent.eventName}`
                              });
                            } else if (bestTimes.personalBest) {
                              toast({
                                title: "Athlete Added",
                                description: `${player.name} added with personal best ${bestTimes.personalBest.toFixed(2)}s`
                              });
                            }
                            
                            // Clear the input
                            setNewRunnerName("");
                          }
                        }}
                        placeholder="Select a track athlete..."
                        variant="compact"
                        showSearch={true}
                        showTrackInfo={true}
                        trackRecords={playerTrackRecords}
                        loadingTrackRecords={loadingTrackRecords}
                      />
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {currentRace.runners.map((runner) => (
                        <div key={runner.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                              {runner.lane}
                            </div>
                            <span className="font-medium text-sm">{runner.name}</span>
                            {/* Display track records if available */}
                            {runner.personalBest && (
                              <span className="text-xs text-muted-foreground">
                                PB: {runner.personalBest.toFixed(2)}s
                              </span>
                            )}
                            {runner.seasonBest && (
                              <span className="text-xs text-muted-foreground ml-1">
                                SB: {runner.seasonBest.toFixed(2)}s
                              </span>
                            )}
                            {runner.previousPositions && runner.previousPositions.length > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                Last: {runner.previousPositions[0]}
                              </span>
                            )}
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
                          <th className="text-left p-2">Records</th>
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
                            <td className="p-2 text-xs">
                              {runner.personalBest && (
                                <div>
                                  <div>Personal Best: {runner.personalBest.toFixed(2)}s</div>
                                  {runner.seasonBest && <div>Season Best: {runner.seasonBest.toFixed(2)}s</div>}
                                  {runner.previousPositions && (
                                    <div>Previous: {runner.previousPositions.slice(0, 3).join(', ')}...</div>
                                  )}
                                </div>
                              )}
                              {runner.trackRecords && runner.trackRecords.length > 0 && (
                                <div className="mt-1">
                                  <div className="font-medium">Events:</div>
                                  {runner.trackRecords.slice(0, 2).map((record, idx) => (
                                    <div key={idx} className="text-xs">
                                      {record.eventName}: {record.personalBest?.toFixed(2)}s (SB: {record.seasonBest?.toFixed(2)}s)
                                    </div>
                                  ))}
                                  {runner.trackRecords.length > 2 && (
                                    <div className="text-xs text-muted-foreground">+{runner.trackRecords.length - 2} more events</div>
                                  )}
                                </div>
                              )}
                              {/* Display additional track record details */}
                              {runner.trackRecords && runner.trackRecords.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-muted">
                                  <div className="text-xs font-medium mb-1">Performance Trends:</div>
                                  <div className="flex gap-1">
                                    {runner.previousPositions && runner.previousPositions.slice(0, 5).map((pos, idx) => (
                                      <div 
                                        key={idx} 
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${pos <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
                                      >
                                        {pos}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* Display performance summary */}
                              {runner.trackRecords && runner.trackRecords.length > 0 && (
                                (() => {
                                  const summary = trackPlayerService.getPlayerPerformanceSummary(runner.trackRecords || []);
                                  return (
                                    <div className="mt-2 pt-2 border-t border-muted">
                                      <div className="text-xs font-medium mb-1">Summary:</div>
                                      <div className="text-xs">
                                        Events: {summary.totalEvents} | Avg PB: {summary.avgPersonalTime?.toFixed(2)}s
                                      </div>
                                    </div>
                                  );
                                })()
                              )}
                            </td>
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
                />
              </div>
              
              {/* Team Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team</label>
                  <div className="grid grid-cols-2 gap-2">
                    {teams.map(team => (
                      <Button
                        key={team.id}
                        variant={selectedTeam?.id === team.id ? "default" : "outline"}
                        onClick={() => handleTeamSelect(team)}
                        className="h-12 flex flex-col gap-1 text-xs"
                      >
                        <User className="h-3 w-3" />
                        <span className="truncate">{team.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Player</label>
                  {selectedTeam ? (
                    <PlayerSelector
                      players={selectedTeam.players}
                      selectedPlayerId={selectedPlayerId || ""}
                      onSelect={setSelectedPlayerId}
                      placeholder="Select a player..."
                      variant="dropdown"
                      showSearch={true}
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground p-3 border rounded-lg">
                      Select a team first
                    </div>
                  )}
                </div>
              </div>
              
              {/* Event Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Type</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {TRACK_FIELD_EVENTS
                    .filter(event => {
                      if (selectedEventCategory === 'race') return ['race_start', 'race_finish', 'lap_time', 'false_start'].includes(event);
                      if (selectedEventCategory === 'field') return !['race_start', 'race_finish', 'lap_time', 'false_start'].includes(event);
                      return true;
                    })
                    .map(eventType => (
                      <Button
                        key={eventType}
                        variant={selectedEventType === eventType ? "default" : "outline"}
                        onClick={() => setSelectedEventType(eventType)}
                        className="h-16 flex flex-col gap-1 text-xs capitalize"
                      >
                        {getEventIcon(eventType)}
                        <span className="truncate">{eventType.replace('_', ' ')}</span>
                      </Button>
                    ))}
                </div>
              </div>
              
              {/* Enhanced Metadata Fields */}
              {selectedEventType && (
                <div className="space-y-4 border rounded-lg p-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Event Details
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Event Value */}
                    <div className="space-y-2">
                      <label htmlFor="eventValue" className="text-sm font-medium">
                        {selectedEventType.includes('time') ? 'Time (seconds)' : 
                         selectedEventType.includes('attempt') ? 'Attempt Details' : 
                         selectedEventType.includes('measurement') ? 'Measurement' : 
                         'Value'}
                      </label>
                      <Input
                        id="eventValue"
                        value={eventValue}
                        onChange={(e) => setEventValue(e.target.value)}
                        placeholder={
                          selectedEventType.includes('time') ? 'e.g., 12.34' : 
                          selectedEventType.includes('attempt') ? 'e.g., Success/Fail' : 
                          selectedEventType.includes('measurement') ? 'e.g., 5.67m' : 
                          'Enter value'
                        }
                      />
                    </div>
                    
                    {/* Attempt Number */}
                    <div className="space-y-2">
                      <label htmlFor="attemptNumber" className="text-sm font-medium">Attempt Number</label>
                      <Input
                        id="attemptNumber"
                        type="number"
                        min="1"
                        value={attemptNumber}
                        onChange={(e) => setAttemptNumber(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    
                    {/* Wind Speed */}
                    <div className="space-y-2">
                      <label htmlFor="windSpeed" className="text-sm font-medium">Wind Speed (m/s)</label>
                      <Input
                        id="windSpeed"
                        type="number"
                        step="0.1"
                        value={windSpeed}
                        onChange={(e) => setWindSpeed(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    {/* Temperature */}
                    <div className="space-y-2">
                      <label htmlFor="temperature" className="text-sm font-medium">Temperature (°C)</label>
                      <Input
                        id="temperature"
                        type="number"
                        value={temperature}
                        onChange={(e) => setTemperature(parseInt(e.target.value) || 20)}
                      />
                    </div>
                    
                    {/* Location */}
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="eventLocation" className="text-sm font-medium">Location/Position</label>
                      <Input
                        id="eventLocation"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        placeholder="e.g., Lane 3, Jump Pit 1"
                      />
                    </div>
                    
                    {/* Notes */}
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="eventNotes" className="text-sm font-medium">Notes</label>
                      <Input
                        id="eventNotes"
                        value={eventNotes}
                        onChange={(e) => setEventNotes(e.target.value)}
                        placeholder="Additional details about the event"
                      />
                    </div>
                    
                    {/* Valid Attempt Toggle */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Valid Attempt</label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={isValidAttempt ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsValidAttempt(true)}
                        >
                          Valid
                        </Button>
                        <Button
                          variant={!isValidAttempt ? "default" : "outline"}
                          size="sm"
                          onClick={() => setIsValidAttempt(false)}
                        >
                          Invalid
                        </Button>
                      </div>
                    </div>
                    
                    {/* Foul Type (only for invalid attempts) */}
                    {!isValidAttempt && (
                      <div className="space-y-2">
                        <label htmlFor="foulType" className="text-sm font-medium">Foul Type</label>
                        <Select value={foulType} onValueChange={setFoulType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select foul" />
                          </SelectTrigger>
                          <SelectContent>
                            {FOUL_TYPES.map(foul => (
                              <SelectItem key={foul.value} value={foul.value}>
                                {foul.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {/* Record Type (for record attempts) */}
                    {selectedEventType === 'record_attempt' && (
                      <div className="space-y-2">
                        <label htmlFor="recordType" className="text-sm font-medium">Record Type</label>
                        <Select value={recordType} onValueChange={setRecordType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select record" />
                          </SelectTrigger>
                          <SelectContent>
                            {RECORD_TYPES.map(record => (
                              <SelectItem key={record.value} value={record.value}>
                                {record.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={undoLastEvent}
                  disabled={events.length === 0}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Undo Last
                </Button>
                
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={disabled || !selectedEventType}
                >
                  Log Event
                </Button>
              </div>

              {/* Enhanced Event History with Filtering and Grouping */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Recent Events</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAnalytics(!showAnalytics)}
                      className={showAnalytics ? "bg-muted" : ""}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analytics
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEvents([])}
                      disabled={events.length === 0}
                    >
                      <Undo2 className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                </div>
                
                {/* Analytics Panel */}
                {showAnalytics && (
                  <Card className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Performance Analytics
                      </h4>
                      <Select value={analyticsPeriod} onValueChange={(value) => setAnalyticsPeriod(value as 'all' | 'today' | 'week' | 'month')}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Summary Stats */}
                      <div className="border rounded-lg p-3">
                        <h5 className="font-medium text-sm mb-2">Event Summary</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Total Events:</span>
                            <span className="font-medium">{eventStats.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Event Types:</span>
                            <span className="font-medium">{Object.keys(eventStats.byType).length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Teams:</span>
                            <span className="font-medium">{Object.keys(eventStats.byTeam).length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Players:</span>
                            <span className="font-medium">{Object.keys(eventStats.byPlayer).length}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Top Event Types */}
                      <div className="border rounded-lg p-3">
                        <h5 className="font-medium text-sm mb-2">Top Event Types</h5>
                        <div className="space-y-1 text-sm">
                          {Object.entries(eventStats.byType)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 3)
                            .map(([type, count]) => (
                              <div key={type} className="flex justify-between">
                                <span className="capitalize">{type.replace('_', ' ')}</span>
                                <span className="font-medium">{count}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                      
                      {/* Top Performers */}
                      <div className="border rounded-lg p-3">
                        <h5 className="font-medium text-sm mb-2">Top Performers</h5>
                        <div className="space-y-1 text-sm">
                          {playerPerformance
                            .sort((a, b) => b.attempts - a.attempts)
                            .slice(0, 3)
                            .map(player => (
                              <div key={`${player.playerId}-${player.eventType}`} className="flex justify-between">
                                <span className="truncate">{player.playerName}</span>
                                <span className="font-medium">{player.attempts} attempts</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance Trends */}
                    {performanceTrends.length > 1 && (
                      <div className="mt-4">
                        <h5 className="font-medium text-sm mb-2">Performance Trend</h5>
                        <div className="h-32 flex items-end gap-1 border rounded p-2">
                          {performanceTrends.map((trend, index) => {
                            // Calculate height as percentage of max value
                            const maxValue = Math.max(...performanceTrends.map(t => t.value));
                            const height = maxValue > 0 ? (trend.value / maxValue) * 100 : 0;
                            return (
                              <div 
                                key={index} 
                                className="flex-1 bg-blue-500 rounded-t flex flex-col items-center"
                                style={{ height: `${Math.max(height, 5)}%` }}
                              >
                                <span className="text-xs -mb-5 text-foreground">{trend.value.toFixed(1)}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{performanceTrends[0]?.date}</span>
                          <span>{performanceTrends[performanceTrends.length - 1]?.date}</span>
                        </div>
                      </div>
                    )}
                  </Card>
                )}
                
                {/* Filter Controls */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  <div className="md:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  
                  <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Event Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPE_FILTERS.map(filter => (
                        <SelectItem key={filter.value} value={filter.value}>
                          {filter.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={groupBy} onValueChange={(value) => setGroupBy(value as 'time' | 'event' | 'team')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Group By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time">Time Periods</SelectItem>
                      <SelectItem value="event">Event Type</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {Object.keys(groupedEvents).length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Object.entries(groupedEvents).map(([groupKey, groupEvents]) => {
                      const isExpanded = expandedGroups[groupKey] ?? true;
                      return (
                        <div key={groupKey} className="border rounded-lg">
                          <div 
                            className="flex items-center justify-between p-3 bg-muted cursor-pointer"
                            onClick={() => toggleGroup(groupKey)}
                          >
                            <div className="font-medium">
                              {groupBy === 'time' ? `${groupKey} Period` : 
                               groupBy === 'event' ? groupKey.replace('_', ' ') : 
                               groupKey}
                              <span className="ml-2 text-sm text-muted-foreground">({groupEvents.length} events)</span>
                            </div>
                            {isExpanded ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                          </div>
                          
                          {isExpanded && (
                            <div className="space-y-1 p-2">
                              {groupEvents.map((event) => (
                                <div key={event.id} className="flex flex-col p-3 bg-background rounded text-sm border relative">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium capitalize">{event.eventType.replace('_', ' ')}</div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => openEditDialog(event)}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                        onClick={() => deleteEvent(event.id)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {event.teamName && `${event.teamName} - `}
                                    {event.playerName && `${event.playerName}`}
                                    {event.value && ` (${event.value})`}
                                  </div>
                                  
                                  {/* Metadata Display */}
                                  {formatMetadata(event) && (
                                    <div className="text-xs text-muted-foreground mt-1 italic">
                                      {formatMetadata(event)}
                                    </div>
                                  )}
                                  
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {new Date(event.timestamp).toLocaleTimeString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
              {pendingEvent && formatMetadata(pendingEvent) && (
                <div className="text-xs text-muted-foreground mt-1 italic">
                  {formatMetadata(pendingEvent)}
                </div>
              )}
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
      
      {/* Edit Event Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editEvent && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Event Type</label>
                  <Select 
                    value={editEvent.eventType} 
                    onValueChange={(value) => setEditEvent(prev => prev ? {...prev, eventType: value as CampusEventType} : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Event Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRACK_FIELD_EVENTS.map(eventType => (
                        <SelectItem key={eventType} value={eventType}>
                          {eventType.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team</label>
                  <Select 
                    value={editEvent.teamId || ""} 
                    onValueChange={(value) => setEditEvent(prev => prev ? {...prev, teamId: value || undefined} : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Team</SelectItem>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Player</label>
                  <Select 
                    value={editEvent.playerId || ""} 
                    onValueChange={(value) => setEditEvent(prev => prev ? {...prev, playerId: value || undefined} : null)}
                    disabled={!editEvent.teamId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Player" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Player</SelectItem>
                      {teams
                        .find(team => team.id === editEvent.teamId)
                        ?.players.map(player => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        )) || []}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Value</label>
                  <Input
                    value={editEvent.value || ''}
                    onChange={(e) => setEditEvent(prev => prev ? {...prev, value: e.target.value} : null)}
                    placeholder="Event value"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Input
                    value={editEvent.notes || ''}
                    onChange={(e) => setEditEvent(prev => prev ? {...prev, notes: e.target.value} : null)}
                    placeholder="Additional notes"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input
                    value={editEvent.location || ''}
                    onChange={(e) => setEditEvent(prev => prev ? {...prev, location: e.target.value} : null)}
                    placeholder="Location/position"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Attempt Number</label>
                  <Input
                    type="number"
                    min="1"
                    value={editEvent.attemptNumber || 1}
                    onChange={(e) => setEditEvent(prev => prev ? {...prev, attemptNumber: parseInt(e.target.value) || 1} : null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Wind Speed (m/s)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editEvent.windSpeed || 0}
                    onChange={(e) => setEditEvent(prev => prev ? {...prev, windSpeed: parseFloat(e.target.value) || 0} : null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Temperature (°C)</label>
                  <Input
                    type="number"
                    value={editEvent.temperature || 20}
                    onChange={(e) => setEditEvent(prev => prev ? {...prev, temperature: parseInt(e.target.value) || 20} : null)}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Valid Attempt</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={editEvent.isValid !== false ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEditEvent(prev => prev ? {...prev, isValid: true} : null)}
                    >
                      Valid
                    </Button>
                    <Button
                      variant={editEvent.isValid === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEditEvent(prev => prev ? {...prev, isValid: false} : null)}
                    >
                      Invalid
                    </Button>
                  </div>
                </div>
                
                {editEvent.isValid === false && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Foul Type</label>
                    <Select 
                      value={editEvent.foulType || ""} 
                      onValueChange={(value) => setEditEvent(prev => prev ? {...prev, foulType: value} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Foul Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {FOUL_TYPES.map(foul => (
                          <SelectItem key={foul.value} value={foul.value}>
                            {foul.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {editEvent.eventType === 'record_attempt' && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Record Type</label>
                    <Select 
                      value={editEvent.recordType || ""} 
                      onValueChange={(value) => setEditEvent(prev => prev ? {...prev, recordType: value} : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Record Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {RECORD_TYPES.map(record => (
                          <SelectItem key={record.value} value={record.value}>
                            {record.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedEvent}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};