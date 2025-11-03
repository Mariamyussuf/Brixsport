import React, { useState, useEffect, useRef } from 'react';
import MatchTrackerService from '@/services/MatchTrackerService';
import { Match, MatchEvent } from '@/types/matchTracker';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Trophy, Activity, Loader2, Calendar, MapPin, Users, Clock, Flag, Play, Pause, Square } from 'lucide-react';
import { Team as MatchEventsTeam, Player as MatchEventsPlayer } from '@/types/matchEvents';
import { TimerControl } from './TimerControl';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { realTimeSyncService } from '@/lib/realTimeSync';
import { SportLogger } from '../sports/SportLogger';
import { SportType } from '@/types/campus';
import { ErrorHandler } from '@/lib/errorHandler';
import { ValidationErrorDisplay } from '../shared/ValidationErrorDisplay';
import { PostMatchWrapUp } from './PostMatchWrapUp';
import { getCompetitions } from '@/lib/competitionService';
import TeamService from '@/services/TeamService';
import { ScoreUpdateForm } from './ScoreUpdateForm';
import { LiveEventForm } from './LiveEventForm';
import { Match as BrixMatch, LiveEvent } from '@/types/brixsports';
import { loggerService } from '@/lib/loggerService';

interface MatchForm {
  name: string;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  dateTime: string;
  venue: string;
  sportType: import('@/types/campus').SportType;
}

export default function MatchTrackerPage() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isPostMatchDialogOpen, setIsPostMatchDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Partial<MatchEvent> | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [matchFormData, setMatchFormData] = useState<MatchForm>({
    name: '',
    competitionId: '',
    homeTeamId: '',
    awayTeamId: '',
    dateTime: '',
    venue: '',
    sportType: 'football'
  });
  const [syncStats, setSyncStats] = useState({ total: 0, pending: 0, retrying: 0, failed: 0 });
  const [isLiveEventFormOpen, setIsLiveEventFormOpen] = useState(false);
  
  // State for competitions and teams data
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  
  // Load competitions and teams on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch from real API endpoints
        const [competitionsData, teamsData] = await Promise.all([
          getCompetitions(),
          TeamService.getAll()
        ]);
        
        setCompetitions(competitionsData);
        setTeams(teamsData);
      } catch (error) {
        console.error('Error loading data:', error);
        // Simple alert instead of toast for now
        alert('Failed to load competitions and teams data. Please try again.');
      }
    };
    
    loadData();
  }, []);
  
  // Load matches on component mount
  useEffect(() => {
    loadMatches();
    
    // Start auto-sync
    realTimeSyncService.startAutoSync(15000); // Sync every 15 seconds
    
    // Listen for sync updates
    const syncCallback = (pendingCount: number) => {
      setSyncStats(realTimeSyncService.getQueueStats());
    };
    
    realTimeSyncService.onSyncUpdate(syncCallback);
    
    return () => {
      realTimeSyncService.stopAutoSync();
      realTimeSyncService.offSyncUpdate(syncCallback);
    };
  }, []);

  // Load matches from API
  const loadMatches = async () => {
    try {
      setIsLoading(true);
      const matchesData = await MatchTrackerService.getMatches();
      setMatches(matchesData);
      
      if (matchesData.length > 0) {
        setSelectedMatch(matchesData[0]);
        loadMatchEvents(matchesData[0].id);
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      // Simple alert instead of toast for now
      alert('Failed to load matches. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load match events
  const loadMatchEvents = async (matchId: string) => {
    try {
      setIsLoading(true);
      const match = await MatchTrackerService.getMatch(matchId);
      setSelectedMatch(match);
      // Set events from the match data
      setEvents(match.events || []);
    } catch (error) {
      console.error('Error loading match events:', error);
      alert('Failed to load match events.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle match selection
  const handleMatchSelect = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (match) {
      setSelectedMatch(match);
      loadMatchEvents(matchId);
    }
  };

  // Handle score update
  const handleScoreUpdate = (updatedMatch: BrixMatch) => {
    // Update the selected match with the new data
    if (selectedMatch) {
      const updatedLocalMatch = {
        ...selectedMatch,
        homeScore: updatedMatch.home_score,
        awayScore: updatedMatch.away_score,
        status: updatedMatch.status as import('@/types/matchTracker').MatchStatus
      };
      setSelectedMatch(updatedLocalMatch);
    }
    
    // Update the match in the matches list
    setMatches(prevMatches => 
      prevMatches.map(m => {
        if (m.id === selectedMatch?.id) {
          return {
            ...m,
            homeScore: updatedMatch.home_score,
            awayScore: updatedMatch.away_score,
            status: updatedMatch.status as import('@/types/matchTracker').MatchStatus
          };
        }
        return m;
      })
    );
  };

  // Handle match form input changes
  const handleMatchFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMatchFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle match form submission
  const handleMatchFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Create match using the API
      const matchData = {
        name: matchFormData.name,
        competitionId: matchFormData.competitionId,
        homeTeamId: matchFormData.homeTeamId,
        awayTeamId: matchFormData.awayTeamId,
        startTime: matchFormData.dateTime,
        venue: matchFormData.venue,
        status: 'scheduled' as const,
        events: [] as MatchEvent[],
        sportType: matchFormData.sportType
      };
      
      await MatchTrackerService.createMatch(matchData);
      
      // Reset form and close dialog
      setMatchFormData({
        name: '',
        competitionId: '',
        homeTeamId: '',
        awayTeamId: '',
        dateTime: '',
        venue: '',
        sportType: 'football'
      });
      setIsMatchDialogOpen(false);
      
      // Reload matches
      loadMatches();
      
      alert('Match created successfully');
    } catch (error) {
      const handledError = ErrorHandler.handle(error);
      alert(`Failed to create match: ${handledError.message}`);
    }
  };

  // Handle event creation dialog
  const handleCreateEvent = () => {
    setCurrentEvent({
      id: Date.now().toString(),
      type: 'goal',
      time: selectedMatch?.status === 'live' ? calculateCurrentTime() : "0'",
      teamId: selectedMatch?.homeTeam.id || '',
      playerId: '',
      period: 1
    });
    setIsCreatingEvent(true);
    setIsEventDialogOpen(true);
  };

  // Calculate current time based on match status
  const calculateCurrentTime = () => {
    // Calculate based on actual match time
    return "0'";
  };

  // Handle event edit
  const handleEditEvent = (event: MatchEvent) => {
    setCurrentEvent(event);
    setIsCreatingEvent(false);
    setIsEventDialogOpen(true);
  };

  // Save event
  const handleSaveEvent = async () => {
    if (!selectedMatch || !currentEvent) return;
    
    try {
  if (isCreatingEvent && currentEvent) {
  const newEvent = await MatchTrackerService.addEvent(selectedMatch.id, currentEvent as Partial<import('@/types/matchTracker').MatchEvent>);
        setEvents([...events, newEvent]);
        alert('Event created successfully');
      } else {
        if (currentEvent.id) {
          const updatedEvent = await MatchTrackerService.updateEvent(selectedMatch.id, currentEvent.id, currentEvent);
          setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));
          alert('Event updated successfully');
        }
      }
      
      setIsEventDialogOpen(false);
    } catch (error) {
      const handledError = ErrorHandler.handle(error);
      alert(`Failed to save event: ${handledError.message}`);
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!selectedMatch) return;
    
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await MatchTrackerService.deleteEvent(selectedMatch.id, eventId);
        setEvents(events.filter(e => e.id !== eventId));
        alert('Event deleted successfully');
      } catch (error) {
        const handledError = ErrorHandler.handle(error);
        alert(`Failed to delete event: ${handledError.message}`);
      }
    }
  };

  // Handle match status change from timer
  const handleMatchStatusChange = (newStatus: import('@/types/matchTracker').MatchStatus) => {
    if (selectedMatch) {
      setSelectedMatch({
        ...selectedMatch,
        status: newStatus
      });
    }
  };

  // Handle time update from timer
  const handleTimeUpdate = (minutes: number, seconds: number) => {
    // Update the match with the current time
    console.log(`Match time updated: ${minutes}:${seconds}`);
  };

  // Handle live event added
  const handleLiveEventAdded = (newEvent: LiveEvent) => {
    // For now, we'll just show an alert and close the form
    // In a real implementation, you might want to update the events list
    alert('Live event added successfully');
    setIsLiveEventFormOpen(false);
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (selectedMatch) {
      const ws = MatchTrackerService.subscribeToMatch(selectedMatch.id, (message) => {
        if (message.type === 'update') {
          const data = message.data as any;
          if ('type' in data && 'playerId' in data) {
            // Event update
            setEvents(prevEvents => {
              const eventIndex = prevEvents.findIndex(e => e.id === data.id);
              if (eventIndex >= 0) {
                return prevEvents.map(e => 
                  e.id === data.id ? data as MatchEvent : e
                );
              } else {
                return [...prevEvents, data as MatchEvent];
              }
            });
          } else {
            // Match update
            setSelectedMatch(data as Match);
          }
        } else if (message.type === 'error') {
          console.error('WebSocket error:', message.data);
          alert('Connection issue. Reconnecting to match updates...');
        }
      });
      
      // Set match ID for real-time sync
      realTimeSyncService.setMatchId(selectedMatch.id);
      
      return () => {
        ws.close();
      };
    }
  }, [selectedMatch]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSpace: () => {
      // Play/pause timer if match is selected
      if (selectedMatch) {
        const playPauseButton = document.querySelector('button[aria-label="Play/Pause Timer"]');
        if (playPauseButton) {
          (playPauseButton as HTMLButtonElement).click();
        }
      }
    },
    onKeyS: () => {
      // Start match if match is selected and scheduled
      if (selectedMatch && selectedMatch.status === 'scheduled') {
        const startButton = document.querySelector('button[aria-label="Start Match"]');
        if (startButton) {
          (startButton as HTMLButtonElement).click();
        }
      }
      // Stop match if match is selected and running
      else if (selectedMatch && selectedMatch.status === 'live') {
        const stopButton = document.querySelector('button[aria-label="Stop Match"]');
        if (stopButton) {
          (stopButton as HTMLButtonElement).click();
        }
      }
    },
    onKeyR: () => {
      // Reset match if match is selected
      if (selectedMatch) {
        const resetButton = document.querySelector('button[aria-label="Reset Match"]');
        if (resetButton) {
          (resetButton as HTMLButtonElement).click();
        }
      }
    },
    onKeyL: () => {
      // Add event if match is live
      if (selectedMatch && selectedMatch.status === 'live') {
        handleCreateEvent();
      }
    },
    onKeyN: () => {
      // Create new match
      setIsMatchDialogOpen(true);
    },
    onKeyW: () => {
      // Open post-match wrap-up if match is completed
      if (selectedMatch && selectedMatch.status === 'completed') {
        setIsPostMatchDialogOpen(true);
      }
    },
    onKeyV: () => {
      // View reports - navigate to the reports page
      window.location.href = '/logger/reports';
    },
    onEscape: () => {
      // Close dialogs
      if (isEventDialogOpen) {
        setIsEventDialogOpen(false);
      }
      if (isMatchDialogOpen) {
        setIsMatchDialogOpen(false);
      }
      if (isPostMatchDialogOpen) {
        setIsPostMatchDialogOpen(false);
      }
    },
    onCtrlS: () => {
      // Save current event if event dialog is open
      if (isEventDialogOpen) {
        handleSaveEvent();
      }
    }
  }, [ selectedMatch, isEventDialogOpen, isMatchDialogOpen, isPostMatchDialogOpen]);

  // Get event display info
  const getEventDisplay = (event: MatchEvent) => {
    switch (event.type) {
      case 'goal':
        return { icon: '⚽', text: 'GOAL', color: 'bg-green-500' };
      case 'own_goal':
        return { icon: '⚽', text: 'OWN GOAL', color: 'bg-red-500' };
      case 'assist':
        return { icon: '🤝', text: 'ASSIST', color: 'bg-blue-500' };
      case 'substitution':
        return { icon: '🔄', text: 'SUBSTITUTION', color: 'bg-blue-500' };
      case 'yellow_card':
        return { icon: '🟨', text: 'YELLOW CARD', color: 'bg-yellow-500' };
      case 'red_card':
        return { icon: '🟥', text: 'RED CARD', color: 'bg-red-500' };
      case 'penalty':
        return { icon: '🥅', text: 'PENALTY', color: 'bg-purple-500' };
      case 'corner':
        return { icon: '🚩', text: 'CORNER', color: 'bg-orange-500' };
      case 'injury':
        return { icon: '🩹', text: 'INJURY', color: 'bg-red-500' };
      case 'start_first_half':
        return { icon: '▶️', text: 'KICK OFF', color: 'bg-blue-500' };
      case 'end_first_half':
        return { icon: '⏸️', text: 'HALF TIME', color: 'bg-yellow-500' };
      case 'start_second_half':
        return { icon: '▶️', text: 'SECOND HALF', color: 'bg-blue-500' };
      case 'end_second_half':
        return { icon: '⏱️', text: 'FULL TIME', color: 'bg-green-500' };
      default:
        return { icon: '⚪', text: event.type.toUpperCase().replace('_', ' '), color: 'bg-gray-500' };
    }
  };

  // Render match details
  const renderMatchDetails = () => {
    if (!selectedMatch) {
      return (
        <div className="text-center py-8 text-gray-500">
          Select a match to view details
        </div>
      );
    }

    // Determine sport type based on match data
  const sportType: import('@/types/campus').SportType = (selectedMatch.sportType || 'football') as import('@/types/campus').SportType;

    return (
      <div className="space-y-6">
        {/* Match Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold">{selectedMatch.name}</h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(selectedMatch.date).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(selectedMatch.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {selectedMatch.location}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedMatch.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              selectedMatch.status === 'live' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-500'
            }`}>
              {selectedMatch.status.toUpperCase()}
            </span>
            <Button
              variant="secondary"
              onClick={() => window.open('#', '_blank')}
            >
              Watch Live
            </Button>
            {selectedMatch.status === 'completed' && (
              <Button
                variant="default"
                onClick={() => setIsPostMatchDialogOpen(true)}
              >
                Post-Match Wrap-Up
              </Button>
            )}
          </div>
        </div>
        
        {/* Sync Status */}
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                syncStats.pending > 0 ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
              }`}></div>
              <span>
                {syncStats.pending > 0 
                  ? `Syncing ${syncStats.pending} events...` 
                  : 'All events synced'}
              </span>
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              {syncStats.total > 0 && (
                <span>
                  {syncStats.pending} pending, {syncStats.retrying} retrying, {syncStats.failed} failed
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Timer Control */}
        <div className="bg-gray-800 rounded-lg p-4">
          <TimerControl
            matchId={selectedMatch.id}
            status={selectedMatch.status}
            onStatusChange={handleMatchStatusChange}
            onTimeUpdate={handleTimeUpdate}
          />
        </div>
        
        {/* Score Update Form - New Component */}
        {selectedMatch.status === 'live' && (
          <ScoreUpdateForm
            matchId={parseInt(selectedMatch.id)}
            initialData={{
              home_score: selectedMatch.homeScore,
              away_score: selectedMatch.awayScore,
              current_minute: 0, // Default value since not available in local Match interface
              period: '1st Half', // Default value since not available in local Match interface
              status: selectedMatch.status
            }}
            onScoreUpdate={handleScoreUpdate}
          />
        )}
        
        {/* Live Event Form - New Component */}
        {selectedMatch.status === 'live' && isLiveEventFormOpen && (
          <LiveEventForm
            matchId={parseInt(selectedMatch.id)}
            teams={teams}
            onEventAdded={handleLiveEventAdded}
            onCancel={() => setIsLiveEventFormOpen(false)}
          />
        )}
        
        {/* Add Live Event Button */}
        {selectedMatch.status === 'live' && !isLiveEventFormOpen && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Live Events</h3>
              <Button onClick={() => setIsLiveEventFormOpen(true)}>
                Add Live Event
              </Button>
            </div>
          </div>
        )}
        
        {/* Team Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">Home Team</h3>
              <span className="text-2xl font-bold">
                {selectedMatch.homeScore}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3">
                <Users className="w-5 h-5 text-gray-500 dark:text-gray-300" />
              </div>
              <div>
                <div className="font-medium">
                  {teams.find(t => t.id === selectedMatch.homeTeam.id)?.name || selectedMatch.homeTeam.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Coach: {teams.find(t => t.id === selectedMatch.homeTeam.id)?.coachName || 'N/A'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">Away Team</h3>
              <span className="text-2xl font-bold">
                {selectedMatch.awayScore}
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3">
                <Users className="w-5 h-5 text-gray-500 dark:text-gray-300" />
              </div>
              <div>
                <div className="font-medium">
                  {teams.find(t => t.id === selectedMatch.awayTeam.id)?.name || selectedMatch.awayTeam.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Coach: {teams.find(t => t.id === selectedMatch.awayTeam.id)?.coachName || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sport-Specific Event Logger */}
        <div className="rounded-lg border p-4">
          <h3 className="text-lg font-bold mb-4">Event Logger</h3>
          <SportLogger
            sportType={sportType}
            teams={teams as any}
            onEventSubmit={async (event) => {
              // Handle event submission by adding it to the match
              console.log('Event submitted:', event);
              
              // Call the API to save the event (cast to partial to match service signature)
              const result = await MatchTrackerService.addEvent(selectedMatch.id, event as Partial<import('@/types/matchTracker').MatchEvent>);
              
              // Also send to logger service for real-time broadcasting
              try {
                await loggerService.addEvent(selectedMatch.id, {
                  type: event.eventType as any,
                  teamId: event.teamId,
                  playerId: event.playerId,
                  description: event.value?.toString() || '',
                  minute: Math.floor((event.timestamp || Date.now()) / 60000), // Approximate minute
                  second: 0,
                  millisecond: 0,
                  metadata: {
                    notes: event.value?.toString()
                  }
                });
              } catch (error) {
                console.error('Error broadcasting event:', error);
              }
              
              return result;
            }}
            disabled={selectedMatch.status !== 'live'}
          />
        </div>
        
        {/* Match Events */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Match Events</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Offline events: {syncStats.pending}
              </span>
              <Button onClick={handleCreateEvent} disabled={selectedMatch.status !== 'live'}>
                <Flag className="w-4 h-4 mr-2" />
                Add Event (L)
              </Button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {events.map(event => {
                const eventDisplay = getEventDisplay(event);
                // Add null checks for team and player
                const team = event.teamId ? teams.find(t => t.id === event.teamId) : undefined;
                const player = team && event.playerId ? team.players.find((p: any) => p.id === event.playerId) : undefined;
                
                return (
                  <div key={event.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400 w-12 text-center">
                        {event.time}
                      </span>
                      <div className={`w-3 h-3 rounded-full ${eventDisplay.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {eventDisplay.icon}
                          </span>
                          <div>
                            <p className="text-white font-medium">
                              {eventDisplay.text}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {team?.name || 'Unknown Team'} {player ? `• ${player.name || 'Unknown Player'}` : ''}
                            </p>
                            {event.description && (
                              <p className="text-gray-400 text-sm">{event.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Period {event.period}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditEvent(event)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {events.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No events logged yet</p>
                  <p className="text-sm">Start logging match events to see them here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render loading state
  const renderLoading = () => {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading matches...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Match Tracker Pro</h1>
                <p className="text-gray-300 text-sm">Live Event Logging with Validation</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button onClick={() => setIsMatchDialogOpen(true)}>
                <Play className="w-4 h-4 mr-2" />
                New Match (N)
              </Button>
              <select 
                value={selectedMatch?.id || ''}
                onChange={(e) => handleMatchSelect(e.target.value)}
                className="bg-white/10 text-white border border-white/20 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a match</option>
                {matches.map(match => (
                  <option key={match.id} value={match.id} className="bg-gray-900">
                    {match.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Match Details */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {isLoading ? renderLoading() : renderMatchDetails()}
      </div>
      
      {/* Match Dialog */}
      {isMatchDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold">Create New Match</h3>
            </div>
            
            <form onSubmit={handleMatchFormSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Match Name</label>
                  <input
                    type="text"
                    name="name"
                    value={matchFormData.name}
                    onChange={handleMatchFormChange}
                    placeholder="e.g., Team A vs Team B - Final"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Competition</label>
                    <select
                      name="competitionId"
                      value={matchFormData.competitionId}
                      onChange={handleMatchFormChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    >
                      <option value="">Select competition</option>
                      {competitions.map(competition => (
                        <option key={competition.id} value={competition.id}>
                          {competition.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sport Type</label>
                    <select
                      name="sportType"
                      value={matchFormData.sportType}
                      onChange={handleMatchFormChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    >
                      <option value="football">Football</option>
                      <option value="basketball">Basketball</option>
                      <option value="volleyball">Volleyball</option>
                      <option value="track_events">Track Events</option>
                      <option value="table_tennis">Table Tennis</option>
                      <option value="badminton">Badminton</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date & Time</label>
                    <input
                      type="datetime-local"
                      name="dateTime"
                      value={matchFormData.dateTime}
                      onChange={handleMatchFormChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Home Team</label>
                    <select
                      name="homeTeamId"
                      value={matchFormData.homeTeamId}
                      onChange={handleMatchFormChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    >
                      <option value="">Select home team</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Away Team</label>
                    <select
                      name="awayTeamId"
                      value={matchFormData.awayTeamId}
                      onChange={handleMatchFormChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    >
                      <option value="">Select away team</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Venue</label>
                  <input
                    type="text"
                    name="venue"
                    value={matchFormData.venue}
                    onChange={handleMatchFormChange}
                    placeholder="e.g., Main Stadium"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="secondary" onClick={() => setIsMatchDialogOpen(false)}>
                  Cancel (Esc)
                </Button>
                <Button type="submit">
                  Create Match (Ctrl+S)
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Event Dialog */}
      {isEventDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold">
                {isCreatingEvent ? 'Create Event' : 'Edit Event'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Event Type</label>
                  <select
                    value={currentEvent?.type || ''}
                    onChange={(e) => setCurrentEvent(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">Select event type</option>
                    <option value="goal">Goal</option>
                    <option value="own_goal">Own Goal</option>
                    <option value="assist">Assist</option>
                    <option value="substitution">Substitution</option>
                    <option value="yellow_card">Yellow Card</option>
                    <option value="red_card">Red Card</option>
                    <option value="penalty">Penalty</option>
                    <option value="corner">Corner</option>
                    <option value="injury">Injury</option>
                    <option value="start_first_half">Kick Off</option>
                    <option value="end_first_half">Half Time</option>
                    <option value="start_second_half">Second Half</option>
                    <option value="end_second_half">Full Time</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <input
                    type="text"
                    value={currentEvent?.time || "0'"}
                    onChange={(e) => setCurrentEvent(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="e.g., 23' or 45+2'"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Period</label>
                  <select
                    value={currentEvent?.period || 1}
                    onChange={(e) => setCurrentEvent(prev => ({ ...prev, period: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value={1}>First Half</option>
                    <option value={2}>Second Half</option>
                    <option value={3}>Extra Time 1</option>
                    <option value={4}>Extra Time 2</option>
                    <option value={5}>Penalty Shootout</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team</label>
                  <select
                    value={currentEvent?.teamId || ''}
                    onChange={(e) => setCurrentEvent(prev => ({ ...prev, teamId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="">Select team</option>
                    <option value={selectedMatch?.homeTeam.id || ''}>
                      {teams.find(t => t.id === selectedMatch?.homeTeam.id)?.name || selectedMatch?.homeTeam.name || 'Home Team'}
                    </option>
                    <option value={selectedMatch?.awayTeam.id || ''}>
                      {teams.find(t => t.id === selectedMatch?.awayTeam.id)?.name || selectedMatch?.awayTeam.name || 'Away Team'}
                    </option>
                  </select>
                </div>
                
                {currentEvent?.teamId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Player</label>
                    <select
                      value={currentEvent?.playerId || ''}
                      onChange={(e) => setCurrentEvent(prev => ({ ...prev, playerId: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="">Select player</option>
                      {teams
                        .find(t => t.id === currentEvent?.teamId)
                        ?.players.map((player: any) => (
                          <option key={player.id} value={player.id}>
                            {player.name} (#{player.jerseyNumber})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={currentEvent?.description || ''}
                    onChange={(e) => setCurrentEvent(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    rows={4}
                    placeholder="Additional details about the event"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Coordinates (Optional)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={currentEvent?.x || ''}
                      onChange={(e) => setCurrentEvent(prev => ({ ...prev, x: parseInt(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="X (0-100)"
                    />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={currentEvent?.y || ''}
                      onChange={(e) => setCurrentEvent(prev => ({ ...prev, y: parseInt(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Y (0-100)"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => setIsEventDialogOpen(false)}>
                Cancel (Esc)
              </Button>
              <Button onClick={handleSaveEvent}>
                Save (Ctrl+S)
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Post-Match Wrap-Up Dialog */}
      {isPostMatchDialogOpen && selectedMatch && (
        <PostMatchWrapUp
          match={selectedMatch}
          onClose={() => setIsPostMatchDialogOpen(false)}
        />
      )}
    </div>
  );
}