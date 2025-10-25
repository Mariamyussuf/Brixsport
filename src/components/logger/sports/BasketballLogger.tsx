import React, { useState, useEffect, useRef } from 'react';
import { Team, Player, CampusEventType } from '../../../types/campus';
import { EventTypeButtons } from '../forms/EventTypeButtons';
import { PlayerSelector } from '../players/PlayerSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Play, Pause, Undo, Clock, ArrowLeftRight, Plus, Minus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PlayerStats {
  pts: number;
  ast: number;
  reb: number;
  stl: number;
  blk: number;
  to: number;
  fouls: number;
  twoPointers: number;
  threePointers: number;
  freeThrows: number;
}

interface EnhancedPlayer extends Player {
  number: string;
  isOnPitch: boolean;
  stats: PlayerStats;
}

interface EnhancedTeam extends Team {
  timeouts: number;
  fouls: number;
  turnovers: number;
  steals: number;
  rebounds: number;
  assists: number;
  players: EnhancedPlayer[];
}

interface GameEvent {
  id: string;
  timestamp: string;
  teamId: string;
  playerId: string;
  playerName: string;
  eventType: CampusEventType;
  points?: number;
  description: string;
}

interface BasketballLoggerProps {
  teams: Team[];
  onEventSubmit: (event: {
    teamId: string;
    playerId?: string;
    eventType: CampusEventType;
    timestamp: number;
    value?: string | number;
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
  // Convert teams to enhanced teams with stats
  const convertTeams = (teams: Team[]): EnhancedTeam[] => {
    return teams.map((team, teamIndex) => ({
      ...team,
      score: team.score || 0,
      timeouts: 7,
      fouls: 0,
      turnovers: 0,
      steals: 0,
      rebounds: 0,
      assists: 0,
      players: team.players.map((player, playerIndex) => ({
        ...player,
        number: player.number || `${teamIndex * 10 + playerIndex + 1}`,
        isOnPitch: playerIndex < 5, // First 5 players are starters
        stats: {
          pts: 0,
          ast: 0,
          reb: 0,
          stl: 0,
          blk: 0,
          to: 0,
          fouls: 0,
          twoPointers: 0,
          threePointers: 0,
          freeThrows: 0
        }
      }))
    }));
  };

  const [enhancedTeams, setEnhancedTeams] = useState<EnhancedTeam[]>(() => convertTeams(teams));
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const [period, setPeriod] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(12 * 60); // in seconds (12 minutes)
  const [isRunning, setIsRunning] = useState(false);
  const [events, setEvents] = useState<GameEvent[]>([]);
  
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  
  const [playerModal, setPlayerModal] = useState<{
    isOpen: boolean;
    eventType: 'free_throw' | 'field_goal' | 'three_pointer' | 'assist' | 'rebound' | 'steal' | 'block' | 'turnover' | 'foul' | null;
  }>({ isOpen: false, eventType: null });
  
  const [subModal, setSubModal] = useState<{ isOpen: boolean; playerOut: EnhancedPlayer | null }>({ isOpen: false, playerOut: null });
  const [statsModal, setStatsModal] = useState<{ isOpen: boolean; player: EnhancedPlayer | null }>({ isOpen: false, player: null });
  const [timeoutModal, setTimeoutModal] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [scoringMode, setScoringMode] = useState(false);

  const selectedTeam = enhancedTeams.find(team => team.id === selectedTeamId) || enhancedTeams[0];
  const setSelectedTeam = (teamId: string) => setSelectedTeamId(teamId);

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current + pausedTimeRef.current) / 1000);
      const remaining = Math.max(0, 12 * 60 - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setIsRunning(false);
        toast({ title: `Q${period} ended!` });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, period]);

  const toggleTimer = () => {
    if (!isRunning) {
      startTimeRef.current = Date.now();
      setIsRunning(true);
    } else {
      pausedTimeRef.current += Date.now() - startTimeRef.current;
      setIsRunning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addEvent = (playerId: string, playerName: string, eventType: CampusEventType, description: string, points?: number) => {
    const timestamp = formatTime(timeRemaining);
    const event: GameEvent = {
      id: Date.now().toString(),
      timestamp,
      teamId: selectedTeam.id,
      playerId,
      playerName,
      eventType,
      points,
      description
    };
    setEvents(prev => [event, ...prev]);
  };

  const handleEventTap = (eventType: typeof playerModal.eventType) => {
    setPlayerModal({ isOpen: true, eventType });
  };

  const handlePlayerSelection = (player: EnhancedPlayer) => {
    if (!playerModal.eventType) return;

    const eventType = playerModal.eventType;
    
    // Update team stats and player stats
    setEnhancedTeams(prev => prev.map(team => {
      if (team.id !== selectedTeam.id) return team;
      
      return {
        ...team,
        score: team.score + (eventType === 'free_throw' ? 1 : eventType === 'field_goal' ? 2 : eventType === 'three_pointer' ? 3 : 0),
        players: team.players.map(p => {
          if (p.id !== player.id) return p;
          
          const newStats = { ...p.stats };
          
          if (eventType === 'free_throw') {
            newStats.pts += 1;
            newStats.freeThrows += 1;
          } else if (eventType === 'field_goal') {
            newStats.pts += 2;
            newStats.twoPointers += 1;
          } else if (eventType === 'three_pointer') {
            newStats.pts += 3;
            newStats.threePointers += 1;
          } else if (eventType === 'assist') {
            newStats.ast += 1;
          } else if (eventType === 'rebound') {
            newStats.reb += 1;
          } else if (eventType === 'steal') {
            newStats.stl += 1;
          } else if (eventType === 'block') {
            newStats.blk += 1;
          } else if (eventType === 'turnover') {
            newStats.to += 1;
          } else if (eventType === 'foul') {
            newStats.fouls += 1;
          }
          
          return { ...p, stats: newStats };
        })
      };
    }));

    const points = eventType === 'free_throw' ? 1 : eventType === 'field_goal' ? 2 : eventType === 'three_pointer' ? 3 : undefined;
    const emoji = eventType === 'free_throw' || eventType === 'field_goal' || eventType === 'three_pointer' ? '🏀' :
                  eventType === 'assist' ? '🅰️' :
                  eventType === 'rebound' ? '↩️' :
                  eventType === 'steal' ? '🤚' :
                  eventType === 'block' ? '🚫' :
                  eventType === 'turnover' ? '❌' :
                  eventType === 'foul' ? '⚠️' : '📊';

    addEvent(
      player.id,
      player.name,
      eventType,
      `${emoji} ${eventType === 'free_throw' ? 'Free Throw' :
          eventType === 'field_goal' ? '2-Point' :
          eventType === 'three_pointer' ? '3-Point' :
          eventType === 'assist' ? 'Assist' :
          eventType === 'rebound' ? 'Rebound' :
          eventType === 'steal' ? 'Steal' :
          eventType === 'block' ? 'Block' :
          eventType === 'turnover' ? 'Turnover' :
          'Foul'} by #${player.number} ${player.name}`,
      points
    );

    // Submit event to parent component
    onEventSubmit({
      teamId: selectedTeam.id,
      playerId: player.id,
      eventType,
      timestamp: Date.now(),
      value: points?.toString()
    });

    toast({ 
      title: `${eventType === 'free_throw' ? 'Free Throw' :
              eventType === 'field_goal' ? '2-Point' :
              eventType === 'three_pointer' ? '3-Point' :
              eventType === 'assist' ? 'Assist' :
              eventType === 'rebound' ? 'Rebound' :
              eventType === 'steal' ? 'Steal' :
              eventType === 'block' ? 'Block' :
              eventType === 'turnover' ? 'Turnover' :
              'Foul'} logged!`,
      description: `${player.name} - ${selectedTeam.name}`
    });

    setPlayerModal({ isOpen: false, eventType: null });
  };

  const handleSubstitution = (playerIn: EnhancedPlayer) => {
    if (!subModal.playerOut) return;
    
    setEnhancedTeams(prev => prev.map(team => {
      if (team.id !== selectedTeam.id) return team;
      
      return {
        ...team,
        players: team.players.map(p => {
          if (p.id === subModal.playerOut!.id) return { ...p, isOnPitch: false };
          if (p.id === playerIn.id) return { ...p, isOnPitch: true };
          return p;
        })
      };
    }));
    
    addEvent(
      subModal.playerOut.id,
      subModal.playerOut.name,
      'substitution',
      `🔄 Sub: ${playerIn.name} → ${subModal.playerOut.name}`
    );
    
    // Submit substitution event
    onEventSubmit({
      teamId: selectedTeam.id,
      playerId: subModal.playerOut.id,
      eventType: 'substitution',
      timestamp: Date.now()
    });
    
    setSubModal({ isOpen: false, playerOut: null });
    toast({ 
      title: "Substitution complete!",
      description: `${playerIn.name} in for ${subModal.playerOut.name}`
    });
  };

  const undoLastEvent = () => {
    if (events.length === 0) return;
    
    const lastEvent = events[0];
    
    setEnhancedTeams(prev => prev.map(team => {
      if (team.id !== lastEvent.teamId) return team;
      
      return {
        ...team,
        score: team.score - (lastEvent.points || 0),
        players: team.players.map(p => {
          if (p.id !== lastEvent.playerId) return p;
          
          const newStats = { ...p.stats };
          
          if (lastEvent.eventType === 'free_throw') {
            newStats.pts = Math.max(0, newStats.pts - 1);
            newStats.freeThrows = Math.max(0, newStats.freeThrows - 1);
          } else if (lastEvent.eventType === 'field_goal') {
            newStats.pts = Math.max(0, newStats.pts - 2);
            newStats.twoPointers = Math.max(0, newStats.twoPointers - 1);
          } else if (lastEvent.eventType === 'three_pointer') {
            newStats.pts = Math.max(0, newStats.pts - 3);
            newStats.threePointers = Math.max(0, newStats.threePointers - 1);
          } else if (lastEvent.eventType === 'assist') {
            newStats.ast = Math.max(0, newStats.ast - 1);
          } else if (lastEvent.eventType === 'rebound') {
            newStats.reb = Math.max(0, newStats.reb - 1);
          } else if (lastEvent.eventType === 'steal') {
            newStats.stl = Math.max(0, newStats.stl - 1);
          } else if (lastEvent.eventType === 'block') {
            newStats.blk = Math.max(0, newStats.blk - 1);
          } else if (lastEvent.eventType === 'turnover') {
            newStats.to = Math.max(0, newStats.to - 1);
          } else if (lastEvent.eventType === 'foul') {
            newStats.fouls = Math.max(0, newStats.fouls - 1);
          }
          
          return { ...p, stats: newStats };
        })
      };
    }));
    
    setEvents(prev => prev.slice(1));
    toast({ title: "Event undone" });
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

  // Two-tap scoring system
  const quickScore = (points: number) => {
    if (selectedPlayerId) {
      const player = selectedTeam.players.find(p => p.id === selectedPlayerId);
      if (player) {
        // Update score based on points
        setEnhancedTeams(prev => prev.map(team => {
          if (team.id !== selectedTeam.id) return team;
          
          return {
            ...team,
            score: team.score + points,
            players: team.players.map(p => {
              if (p.id !== player.id) return p;
              
              const newStats = { ...p.stats };
              if (points === 1) {
                newStats.pts += 1;
                newStats.freeThrows += 1;
              } else if (points === 2) {
                newStats.pts += 2;
                newStats.twoPointers += 1;
              } else if (points === 3) {
                newStats.pts += 3;
                newStats.threePointers += 1;
              }
              
              return { ...p, stats: newStats };
            })
          };
        }));
        
        // Add event
        addEvent(
          player.id,
          player.name,
          points === 1 ? 'free_throw' : points === 2 ? 'field_goal' : 'three_pointer',
          `🏀 ${points === 1 ? 'Free Throw' : points === 2 ? '2-Point' : '3-Point'} by #${player.number} ${player.name}`,
          points
        );
        
        // Submit event
        onEventSubmit({
          teamId: selectedTeam.id,
          playerId: player.id,
          eventType: points === 1 ? 'free_throw' : points === 2 ? 'field_goal' : 'three_pointer',
          timestamp: Date.now(),
          value: points.toString()
        });
        
        toast({ 
          title: `${points === 1 ? 'Free Throw' : points === 2 ? '2-Point' : '3-Point'} logged!`,
          description: `${player.name} - ${selectedTeam.name}`
        });
        
        setSelectedPlayerId(null);
        setScoringMode(false);
      }
    } else {
      setScoringMode(true);
    }
  };

  const quickAssist = () => {
    if (selectedPlayerId) {
      const player = selectedTeam.players.find(p => p.id === selectedPlayerId);
      if (player) {
        // Update assist stat
        setEnhancedTeams(prev => prev.map(team => {
          if (team.id !== selectedTeam.id) return team;
          
          return {
            ...team,
            assists: team.assists + 1,
            players: team.players.map(p => {
              if (p.id !== player.id) return p;
              
              const newStats = { ...p.stats };
              newStats.ast += 1;
              
              return { ...p, stats: newStats };
            })
          };
        }));
        
        // Add event
        addEvent(
          player.id,
          player.name,
          'assist',
          `🅰️ Assist by #${player.number} ${player.name}`
        );
        
        // Submit event
        onEventSubmit({
          teamId: selectedTeam.id,
          playerId: player.id,
          eventType: 'assist',
          timestamp: Date.now()
        });
        
        toast({ 
          title: "Assist logged!",
          description: `${player.name} - ${selectedTeam.name}`
        });
        
        setSelectedPlayerId(null);
        setScoringMode(false);
      }
    } else {
      setScoringMode(true);
    }
  };

  const selectPlayerForAction = (playerId: string) => {
    setSelectedPlayerId(playerId);
  };

  const updateScore = (teamId: string, points: number) => {
    setEnhancedTeams(prev => prev.map(team => {
      if (team.id !== teamId) return team;
      
      return {
        ...team,
        score: Math.max(0, team.score + points)
      };
    }));
  };

  const updateTimeouts = (teamId: string, change: number) => {
    setEnhancedTeams(prev => prev.map(team => {
      if (team.id !== teamId) return team;
      
      return {
        ...team,
        timeouts: Math.max(0, Math.min(7, team.timeouts + change))
      };
    }));
  };

  const updateFouls = (teamId: string, change: number) => {
    setEnhancedTeams(prev => prev.map(team => {
      if (team.id !== teamId) return team;
      
      return {
        ...team,
        fouls: Math.max(0, team.fouls + change)
      };
    }));
  };

  const updateTeamName = (teamId: string, name: string) => {
    setEnhancedTeams(prev => prev.map(team => {
      if (team.id !== teamId) return team;
      
      return {
        ...team,
        name
      };
    }));
  };

  const updateStat = (teamId: string, stat: 'turnovers' | 'steals' | 'rebounds' | 'assists', change: number) => {
    setEnhancedTeams(prev => prev.map(team => {
      if (team.id !== teamId) return team;
      
      return {
        ...team,
        [stat]: Math.max(0, team[stat] + change)
      };
    }));
  };

  const ScoreCard = ({ team }: { team: EnhancedTeam }) => (
    <Card className="p-4 border-2 transition-all duration-300 border-border">
      <div className="space-y-4">
        <Input
          value={team.name}
          onChange={(e) => updateTeamName(team.id, e.target.value)}
          className="text-center font-bold text-lg"
          placeholder={team.id === enhancedTeams[0].id ? 'Home Team' : 'Away Team'}
        />
        
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2 font-mono">
            {team.score}
          </div>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateScore(team.id, -1)}
              className="h-8 w-8 p-0"
              disabled={disabled}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateScore(team.id, 1)}
              className="h-8 w-8 p-0"
              disabled={disabled}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateScore(team.id, 2)}
              className="h-8 w-12 p-0 text-xs"
              disabled={disabled}
            >
              +2
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateScore(team.id, 3)}
              className="h-8 w-12 p-0 text-xs"
              disabled={disabled}
            >
              +3
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Timeouts</div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateTimeouts(team.id, -1)}
                className="h-6 w-6 p-0"
                disabled={disabled}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-mono font-bold">{team.timeouts}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateTimeouts(team.id, 1)}
                className="h-6 w-6 p-0"
                disabled={disabled}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-muted-foreground">Team Fouls</div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFouls(team.id, -1)}
                className="h-6 w-6 p-0"
                disabled={disabled}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-mono font-bold">{team.fouls}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFouls(team.id, 1)}
                className="h-6 w-6 p-0"
                disabled={disabled}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 text-xs border-t border-border pt-4">
          <div className="space-y-1">
            <div className="text-muted-foreground">Turnovers</div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateStat(team.id, 'turnovers', -1)}
                className="h-5 w-5 p-0"
                disabled={disabled}
              >
                <Minus className="h-2 w-2" />
              </Button>
              <span className="font-mono font-bold text-sm">{team.turnovers}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateStat(team.id, 'turnovers', 1)}
                className="h-5 w-5 p-0"
                disabled={disabled}
              >
                <Plus className="h-2 w-2" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-muted-foreground">Steals</div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateStat(team.id, 'steals', -1)}
                className="h-5 w-5 p-0"
                disabled={disabled}
              >
                <Minus className="h-2 w-2" />
              </Button>
              <span className="font-mono font-bold text-sm">{team.steals}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateStat(team.id, 'steals', 1)}
                className="h-5 w-5 p-0"
                disabled={disabled}
              >
                <Plus className="h-2 w-2" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-muted-foreground">Rebounds</div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateStat(team.id, 'rebounds', -1)}
                className="h-5 w-5 p-0"
                disabled={disabled}
              >
                <Minus className="h-2 w-2" />
              </Button>
              <span className="font-mono font-bold text-sm">{team.rebounds}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateStat(team.id, 'rebounds', 1)}
                className="h-5 w-5 p-0"
                disabled={disabled}
              >
                <Plus className="h-2 w-2" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-muted-foreground">Assists</div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateStat(team.id, 'assists', -1)}
                className="h-5 w-5 p-0"
                disabled={disabled}
              >
                <Minus className="h-2 w-2" />
              </Button>
              <span className="font-mono font-bold text-sm">{team.assists}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateStat(team.id, 'assists', 1)}
                className="h-5 w-5 p-0"
                disabled={disabled}
              >
                <Plus className="h-2 w-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header - Game Clock and Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Basketball Event Logger</span>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">Period: {period}</Badge>
              <div className="flex items-center gap-2">
                <span className="font-bold">{enhancedTeams[0]?.score || 0}</span>
                <span>-</span>
                <span className="font-bold">{enhancedTeams[1]?.score || 0}</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Clock */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-muted-foreground">Q{period}</div>
              <div className="text-2xl font-mono font-bold text-primary">{formatTime(timeRemaining)}</div>
              <Button
                variant={isRunning ? "secondary" : "default"}
                size="sm"
                onClick={toggleTimer}
                className="h-8 w-8 p-0"
                disabled={disabled}
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={undoLastEvent}
              disabled={disabled || events.length === 0}
              className="h-8 px-3"
            >
              <Undo className="h-4 w-4 mr-1" />
              <span className="text-xs">Undo</span>
            </Button>
          </div>

          {/* Quarter Selection */}
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4].map((q) => (
              <Button
                key={q}
                variant={period === q ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(q)}
                className="w-12"
                disabled={disabled}
              >
                Q{q}
              </Button>
            ))}
          </div>

          {/* Score Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <ScoreCard team={enhancedTeams[0]} />
            <ScoreCard team={enhancedTeams[1]} />
          </div>

          {/* Team Selection */}
          <div className="grid grid-cols-2 gap-3">
            {enhancedTeams.map((team) => (
              <Button
                key={team.id}
                variant={selectedTeamId === team.id ? "default" : "outline"}
                className="flex items-center gap-2 h-12"
                style={{ borderColor: team.color }}
                onClick={() => setSelectedTeam(team.id)}
                disabled={disabled}
              >
                {team.name}
              </Button>
            ))}
          </div>

          {/* Player Cards - Active Only, Clickable for Stats */}
          <Card className="p-3 bg-card border-border">
            <h3 className="font-medium mb-2">Active Players</h3>
            <div className="grid grid-cols-5 gap-2">
              {selectedTeam.players.filter(p => p.isOnPitch).map((player) => (
                <div
                  key={player.id}
                  onClick={() => setStatsModal({ isOpen: true, player })}
                  className="p-1.5 bg-muted/30 rounded border border-border text-center cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <div className="text-xs font-bold">#{player.number}</div>
                  <div className="text-[9px] truncate">{player.name.split(' ')[1] || player.name}</div>
                  <div className="text-[10px] font-mono text-primary mt-1">{player.stats.pts}p</div>
                  <div className="text-[8px] text-muted-foreground">
                    {player.stats.ast}a {player.stats.reb}r
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Player Selection for Actions */}
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
              {scoringMode || selectedPlayerId ? '1. Select Player → 2. Select Action' : 'Select Team Above'}
            </h4>
            <div className="grid grid-cols-5 gap-2">
              {selectedTeam.players.map((player) => (
                <Button
                  key={player.id}
                  variant={selectedPlayerId === player.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectPlayerForAction(player.id)}
                  className="h-10 text-xs flex flex-col p-1"
                  disabled={disabled}
                >
                  <span className="font-bold">#{player.number}</span>
                  <span className="truncate text-[10px]">{player.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Actions - Two Tap System */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Quick Actions</h4>
            
            {/* Scoring */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant={selectedPlayerId && scoringMode ? "default" : "outline"}
                size="sm"
                onClick={() => quickScore(1)}
                className="h-12 flex flex-col"
                disabled={disabled || (!selectedPlayerId && !scoringMode)}
              >
                <span className="text-lg font-bold">+1</span>
                <span className="text-xs">Free Throw</span>
              </Button>
              <Button
                variant={selectedPlayerId && scoringMode ? "default" : "outline"}
                size="sm"
                onClick={() => quickScore(2)}
                className="h-12 flex flex-col"
                disabled={disabled || (!selectedPlayerId && !scoringMode)}
              >
                <span className="text-lg font-bold">+2</span>
                <span className="text-xs">Field Goal</span>
              </Button>
              <Button
                variant={selectedPlayerId && scoringMode ? "default" : "outline"}
                size="sm"
                onClick={() => quickScore(3)}
                className="h-12 flex flex-col"
                disabled={disabled || (!selectedPlayerId && !scoringMode)}
              >
                <span className="text-lg font-bold">+3</span>
                <span className="text-xs">Three Point</span>
              </Button>
              <Button
                variant={selectedPlayerId && scoringMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => quickAssist()}
                className="h-12 flex flex-col"
                disabled={disabled || (!selectedPlayerId && !scoringMode)}
              >
                <span className="text-lg font-bold">AST</span>
                <span className="text-xs">Assist</span>
              </Button>
            </div>

            {/* Other Actions */}
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10"
                onClick={() => setTimeoutModal(true)}
                disabled={disabled}
              >
                <Clock className="h-4 w-4 mr-1" />
                Timeout
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10"
                onClick={() => setSubModal({ isOpen: true, playerOut: null })}
                disabled={disabled}
              >
                <ArrowLeftRight className="h-4 w-4 mr-1" />
                Sub
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10"
                onClick={() => handleEventTap('foul')}
                disabled={disabled}
              >
                Foul
              </Button>
            </div>
          </div>

          {selectedPlayerId && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-center">
                <span className="font-medium">Selected:</span> {selectedTeam.players.find(p => p.id === selectedPlayerId)?.name} 
                <span className="text-muted-foreground ml-2">Now select an action above</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {setSelectedPlayerId(null); setScoringMode(false);}}
                className="w-full mt-2 text-xs"
              >
                Cancel Selection
              </Button>
            </div>
          )}

          {/* Event Type Selection */}
          {selectedTeam && (
            <div className="space-y-2">
              <h3 className="font-medium">Select Event Type</h3>
              <EventTypeButtons
                eventTypes={BASKETBALL_EVENTS}
                selectedEventType={playerModal.eventType}
                onSelect={(eventType) => handleEventTap(eventType as any)}
                disabled={disabled}
                sportType="basketball"
              />
            </div>
          )}

          {/* Event Log */}
          <Card className="p-3 bg-card border-border max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-muted-foreground">RECENT ACTIONS</h4>
              <span className="text-[10px] text-muted-foreground">{events.length} events</span>
            </div>
            <div className="space-y-1.5">
              {events.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No events logged</p>
              ) : (
                events.slice(0, 10).map((event, idx) => (
                  <div 
                    key={event.id} 
                    className="flex items-start gap-2 p-2 rounded text-xs border bg-muted/20 border-border"
                  >
                    <span className="font-mono text-[10px] text-primary min-w-[35px]">{event.timestamp}</span>
                    <div className="flex-1">
                      <div className="font-medium">{event.description}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {enhancedTeams.find(t => t.id === event.teamId)?.name || 'Unknown Team'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Player Selection Modal */}
          <Dialog open={playerModal.isOpen} onOpenChange={(open) => {
            if (!open) setPlayerModal({ isOpen: false, eventType: null });
          }}>
            <DialogContent className="max-w-sm bg-popover z-50">
              <DialogHeader>
                <DialogTitle>Select Player</DialogTitle>
                <DialogDescription>
                  Tap player to log {
                    playerModal.eventType === 'free_throw' ? 'Free Throw (+1)' :
                    playerModal.eventType === 'field_goal' ? '2-Point (+2)' :
                    playerModal.eventType === 'three_pointer' ? '3-Point (+3)' :
                    playerModal.eventType === 'assist' ? 'Assist' :
                    playerModal.eventType === 'rebound' ? 'Rebound' :
                    playerModal.eventType === 'steal' ? 'Steal' :
                    playerModal.eventType === 'block' ? 'Block' :
                    playerModal.eventType === 'turnover' ? 'Turnover' :
                    playerModal.eventType === 'foul' ? 'Foul' : ''
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                {selectedTeam.players.map((player) => (
                  <Button
                    key={player.id}
                    variant="outline"
                    onClick={() => handlePlayerSelection(player)}
                    className="h-16 text-xs flex flex-col p-1 font-bold hover:bg-primary/20"
                    disabled={disabled}
                  >
                    <span className="text-sm">#{player.number}</span>
                    <span className="text-[9px] truncate w-full">{player.name}</span>
                    <span className="text-[10px] text-primary">{player.stats.pts}p</span>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Substitution Modal */}
          <Dialog open={subModal.isOpen} onOpenChange={(open) => {
            if (!open) setSubModal({ isOpen: false, playerOut: null });
          }}>
            <DialogContent className="max-w-sm bg-popover z-50">
              <DialogHeader>
                <DialogTitle>Substitution</DialogTitle>
                <DialogDescription>
                  {!subModal.playerOut ? 'Select player to come OUT' : 'Select player to come IN'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                {!subModal.playerOut ? (
                  selectedTeam.players.filter(p => p.isOnPitch).map((player) => (
                    <Button
                      key={player.id}
                      variant="outline"
                      onClick={() => setSubModal({ isOpen: true, playerOut: player })}
                      className="h-16 text-xs flex flex-col p-1 hover:bg-destructive/20"
                      disabled={disabled}
                    >
                      <span className="text-sm">#{player.number}</span>
                      <span className="text-[9px] truncate w-full">{player.name}</span>
                      <span className="text-[8px] text-muted-foreground">OUT</span>
                    </Button>
                  ))
                ) : (
                  selectedTeam.players.filter(p => !p.isOnPitch).map((player) => (
                    <Button
                      key={player.id}
                      variant="outline"
                      onClick={() => handleSubstitution(player)}
                      className="h-16 text-xs flex flex-col p-1 hover:bg-accent/20"
                      disabled={disabled}
                    >
                      <span className="text-sm">#{player.number}</span>
                      <span className="text-[9px] truncate w-full">{player.name}</span>
                      <span className="text-[8px] text-muted-foreground">IN</span>
                    </Button>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Quick Stats Modal */}
          <Dialog open={statsModal.isOpen} onOpenChange={(open) => {
            if (!open) setStatsModal({ isOpen: false, player: null });
          }}>
            <DialogContent className="max-w-sm bg-popover z-50">
              <DialogHeader>
                <DialogTitle>Player Stats</DialogTitle>
                <DialogDescription>
                  #{statsModal.player?.number} {statsModal.player?.name}
                </DialogDescription>
              </DialogHeader>
              
              {statsModal.player && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <div className="text-2xl font-bold text-primary">{statsModal.player.stats.pts}</div>
                    <div className="text-[10px] text-muted-foreground">PTS</div>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <div className="text-2xl font-bold text-primary">{statsModal.player.stats.ast}</div>
                    <div className="text-[10px] text-muted-foreground">AST</div>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <div className="text-2xl font-bold text-primary">{statsModal.player.stats.reb}</div>
                    <div className="text-[10px] text-muted-foreground">REB</div>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <div className="text-2xl font-bold text-primary">{statsModal.player.stats.stl}</div>
                    <div className="text-[10px] text-muted-foreground">STL</div>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <div className="text-2xl font-bold text-primary">{statsModal.player.stats.blk}</div>
                    <div className="text-[10px] text-muted-foreground">BLK</div>
                  </div>
                  <div className="text-center p-2 bg-muted/30 rounded">
                    <div className="text-2xl font-bold text-primary">{statsModal.player.stats.fouls}</div>
                    <div className="text-[10px] text-muted-foreground">FOULS</div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Timeout Confirmation Modal */}
          <Dialog open={timeoutModal} onOpenChange={setTimeoutModal}>
            <DialogContent className="max-w-sm bg-popover z-50">
              <DialogHeader>
                <DialogTitle>Confirm Timeout</DialogTitle>
                <DialogDescription>
                  Log timeout for {selectedTeam.name}?
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setTimeoutModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setEnhancedTeams(prev => prev.map(team => {
                      if (team.id !== selectedTeam.id) return team;
                      return {
                        ...team,
                        timeouts: Math.max(0, team.timeouts - 1)
                      };
                    }));
                    addEvent('timeout', 'Team', 'timeout', `⏱️ Timeout called`);
                    setTimeoutModal(false);
                    
                    // Submit timeout event
                    onEventSubmit({
                      teamId: selectedTeam.id,
                      eventType: 'timeout',
                      timestamp: Date.now()
                    });
                    
                    toast({ title: "Timeout logged!" });
                  }}
                  className="flex-1"
                >
                  Confirm
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};