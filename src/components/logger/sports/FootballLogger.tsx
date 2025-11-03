import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, X, Undo, ArrowLeftRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useMatchTimer, type MatchType } from "@/hooks/useMatchTimer";
import { usePlayerRating } from "@/hooks/usePlayerRating";
import { useSubstitution } from "@/hooks/useSubstitution";
import { Team, CampusEventType } from '../../../types/campus';

interface Player {
  id: string;
  name: string;
  number: string;
  isOnPitch: boolean;
  isEligible: boolean;
  minutesPlayed: number;
  rating: number;
  events: Array<{ type: string; value?: number }>;
}

interface TeamLocal {
  name: string;
  goals: number;
  corners: number;
  assists: number;
  ownGoals: number;
  freeKicks: number;
  penalties: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  saves: number;
  yellowCards: number;
  redCards: number;
  players: Player[];
}

interface GameEvent {
  id: string;
  timestamp: string;
  team: 'home' | 'away';
  player?: string;
  eventType: string;
  details: string;
  suggestedStoppageTime?: number; // Auto-calculated stoppage time suggestion
}

interface GameState {
  homeTeam: TeamLocal;
  awayTeam: TeamLocal;
  half: number;
  timeElapsed: number;
  isRunning: boolean;
  events: GameEvent[];
  penaltyShootout?: {
    homeScore: number;
    awayScore: number;
    rounds: Array<{ team: 'home' | 'away'; outcome: 'scored' | 'missed'; player?: string }>;
  };
}

type ConfirmBarType = 'goal' | 'foul-card' | 'corner' | 'shot-on' | 'shot-off' | 'offside' | 'substitution' | 'save' | 'tackle' | null;

interface PlayerModalState {
  isOpen: boolean;
  mode: 'scorer' | 'assist' | 'foul-card-player' | 'shot-player' | 'sub-out' | 'sub-in' | 'save-player' | 'tackle-player' | 'edit-event' | null;
  eventType: string;
  editEventId?: string;
}

interface FoulModalState {
  isOpen: boolean;
  outcome: 'yellow' | 'red' | null;
  cardReason: string;
  result: 'freekick' | 'penalty' | null;
  penaltyMode: boolean;
  penaltyAwardedTeam: 'home' | 'away' | null;
  penaltyOutcome: 'scored' | 'missed' | 'overturned' | null;
  selectedPlayer: string | null;
}

interface FootballLoggerProps {
  teams?: Team[];
  onEventSubmit: (event: {
    teamId?: string;
    playerId?: string;
    eventType: CampusEventType;
    timestamp: number;
    value?: string | number;
  }) => void;
  disabled?: boolean;
}

const FootballLogger: React.FC<FootballLoggerProps> = ({ teams = [], onEventSubmit, disabled = false }) => {
  // Match configuration state
  const [matchType, setMatchType] = useState<MatchType>("Normal");
  const [halfDuration, setHalfDuration] = useState(45);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize hooks
  const matchTimer = useMatchTimer({
    matchType,
    halfDuration,
    onPhaseComplete: (phase) => {
      toast({ title: `${phase} complete!` });
    }
  });

  const ratingEngine = usePlayerRating("football");
  const subManager = useSubstitution({ 
    maxPerTeam: 5, 
    allowDuringExtraTime: true, 
    extraSubsInET: 1, 
    allowReentry: false 
  });

  const [gameState, setGameState] = useState<GameState>({
    homeTeam: { 
      name: "JOGA FC", 
      goals: 0,
      corners: 0,
      assists: 0,
      ownGoals: 0,
      freeKicks: 0,
      penalties: 0,
      shotsOnTarget: 0,
      shotsOffTarget: 0,
      saves: 0,
      yellowCards: 0,
      redCards: 0,
      players: Array.from({ length: 11 }, (_, i) => ({
        id: `home-${i + 1}`,
        name: `Player ${i + 1}`,
        number: `${i + 1}`,
        isOnPitch: true,
        isEligible: true,
        minutesPlayed: 0,
        rating: 5.0,
        events: []
      }))
    },
    awayTeam: { 
      name: "Pirates", 
      goals: 0,
      corners: 0,
      assists: 0,
      ownGoals: 0,
      freeKicks: 0,
      penalties: 0,
      shotsOnTarget: 0,
      shotsOffTarget: 0,
      saves: 0,
      yellowCards: 0,
      redCards: 0,
      players: Array.from({ length: 11 }, (_, i) => ({
        id: `away-${i + 1}`,
        name: `Player ${i + 12}`,
        number: `${i + 12}`,
        isOnPitch: true,
        isEligible: true,
        minutesPlayed: 0,
        rating: 5.0,
        events: []
      }))
    },
    half: 1,
    timeElapsed: 0,
    isRunning: false,
    events: [],
  });

  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  const [confirmBar, setConfirmBar] = useState<ConfirmBarType>(null);
  const [goalScorerId, setGoalScorerId] = useState<string | null>(null);
  const [subOutPlayerId, setSubOutPlayerId] = useState<string | null>(null);
  
  const [playerModal, setPlayerModal] = useState<PlayerModalState>({
    isOpen: false,
    mode: null,
    eventType: '',
  });
  
  const [foulModal, setFoulModal] = useState<FoulModalState>({
    isOpen: false,
    outcome: null,
    cardReason: '',
    result: null,
    penaltyMode: false,
    penaltyAwardedTeam: null,
    penaltyOutcome: null,
    selectedPlayer: null,
  });

  // Sync game timer with match timer
  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      timeElapsed: matchTimer.displayTime,
      isRunning: matchTimer.isRunning
    }));
  }, [matchTimer.displayTime, matchTimer.isRunning]);

  // Update player minutes every second when running
  useEffect(() => {
    if (!matchTimer.isRunning) return;
    
    const interval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        homeTeam: {
          ...prev.homeTeam,
          players: prev.homeTeam.players.map(p => 
            p.isOnPitch ? { ...p, minutesPlayed: p.minutesPlayed + (1/60) } : p
          )
        },
        awayTeam: {
          ...prev.awayTeam,
          players: prev.awayTeam.players.map(p => 
            p.isOnPitch ? { ...p, minutesPlayed: p.minutesPlayed + (1/60) } : p
          )
        }
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [matchTimer.isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addPlayerEvent = (team: 'home' | 'away', playerId: string, eventType: string, value?: number) => {
    setGameState(prev => ({
      ...prev,
      [team === 'home' ? 'homeTeam' : 'awayTeam']: {
        ...prev[team === 'home' ? 'homeTeam' : 'awayTeam'],
        players: prev[team === 'home' ? 'homeTeam' : 'awayTeam'].players.map(p =>
          p.id === playerId
            ? { ...p, events: [...p.events, { type: eventType, value }] }
            : p
        )
      }
    }));
  };

  const updatePlayerRating = (team: 'home' | 'away', playerId: string) => {
    const player = gameState[team === 'home' ? 'homeTeam' : 'awayTeam'].players.find(p => p.id === playerId);
    if (!player) return;

    const rating = ratingEngine.calculateRating(
      player.events,
      player.minutesPlayed,
      matchTimer.displayTime / 60,
      1
    );

    setGameState(prev => ({
      ...prev,
      [team === 'home' ? 'homeTeam' : 'awayTeam']: {
        ...prev[team === 'home' ? 'homeTeam' : 'awayTeam'],
        players: prev[team === 'home' ? 'homeTeam' : 'awayTeam'].players.map(p =>
          p.id === playerId ? { ...p, rating } : p
        )
      }
    }));
  };

  const calculateStoppageTime = (eventType: string): number => {
    switch (eventType) {
      case 'Substitution':
        return 30; // 30 seconds per substitution
      case 'Foul':
      case 'Red Card':
        return 60; // 60 seconds for injury/card
      case 'Goal':
        return 30; // 30 seconds for goal celebration
      default:
        return 0;
    }
  };

  const addEvent = (eventType: string, details: string, playerId?: string) => {
    const suggestedStoppageTime = calculateStoppageTime(eventType);
    
    const newEvent: GameEvent = {
      id: Date.now().toString(),
      timestamp: formatTime(gameState.timeElapsed),
      team: selectedTeam,
      player: playerId,
      eventType,
      details,
      suggestedStoppageTime,
    };
    
    setGameState(prev => ({
      ...prev,
      events: [newEvent, ...prev.events],
    }));

    // Send event to logger service for real-time broadcasting
    if (onEventSubmit) {
      onEventSubmit({
        teamId: selectedTeam === 'home' ? '1' : '2', // Assuming team IDs
        playerId: playerId,
        eventType: eventType.toLowerCase().replace(' ', '_') as any,
        timestamp: Date.now(),
        value: details
      });
    }

    // Auto-suggest stoppage time if applicable
    if (suggestedStoppageTime > 0 && matchTimer.isRunning) {
      setTimeout(() => {
        const shouldAdd = confirm(`Add ${suggestedStoppageTime}s stoppage time for ${eventType}?`);
        if (shouldAdd) {
          matchTimer.addStoppageTime(suggestedStoppageTime);
          toast({ 
            title: "Stoppage time added", 
            description: `+${suggestedStoppageTime}s added`
          });
        }
      }, 500);
    }
  };

  const updateEvent = (eventId: string, playerId: string, playerName: string) => {
    setGameState(prev => ({
      ...prev,
      events: prev.events.map(event => 
        event.id === eventId 
          ? { 
              ...event, 
              player: playerId,
              details: event.details.includes('(Unknown)') 
                ? event.details.replace('(Unknown)', `(${playerName})`)
                : event.details + ` (${playerName})`
            }
          : event
      )
    }));
  };

  const updateStat = (team: 'home' | 'away', stat: keyof Omit<TeamLocal, 'name' | 'players'>, change: number) => {
    setGameState(prev => ({
      ...prev,
      [team === 'home' ? 'homeTeam' : 'awayTeam']: {
        ...prev[team === 'home' ? 'homeTeam' : 'awayTeam'],
        [stat]: Math.max(0, prev[team === 'home' ? 'homeTeam' : 'awayTeam'][stat] + change)
      }
    }));
  };

  const updateTeamName = (team: 'home' | 'away', name: string) => {
    setGameState(prev => ({
      ...prev,
      [team === 'home' ? 'homeTeam' : 'awayTeam']: {
        ...prev[team === 'home' ? 'homeTeam' : 'awayTeam'],
        name
      }
    }));
  };

  const getPlayerName = (playerId: string) => {
    const allPlayers = [...gameState.homeTeam.players, ...gameState.awayTeam.players];
    return allPlayers.find(p => p.id === playerId)?.name || 'Unknown';
  };

  const undoLastEvent = () => {
    if (gameState.events.length === 0) return;
    const lastEvent = gameState.events[0];
    
    // Revert stats based on event type
    if (lastEvent.eventType === 'Goal') {
      updateStat(lastEvent.team, 'goals', -1);
    } else if (lastEvent.eventType === 'Corner') {
      updateStat(lastEvent.team, 'corners', -1);
    } else if (lastEvent.eventType === 'Shot on Target') {
      updateStat(lastEvent.team, 'shotsOnTarget', -1);
      const opposingTeam = lastEvent.team === 'home' ? 'away' : 'home';
      updateStat(opposingTeam, 'saves', -1);
    }
    
    setGameState(prev => ({
      ...prev,
      events: prev.events.slice(1),
    }));
    toast({ title: "Event undone" });
  };

  // TAP-CONFIRM-PUSH: Step 1 - Initial tap shows confirm bar
  const handleEventTap = (eventType: ConfirmBarType) => {
    setConfirmBar(eventType);
  };

  const handlePenaltyShootoutKick = (team: 'home' | 'away') => {
    setSelectedTeam(team);
    setPlayerModal({ isOpen: true, mode: 'scorer', eventType: 'Penalty Shootout Kick' });
  };

  const logPenaltyShootoutKick = (playerId: string, outcome: 'scored' | 'missed') => {
    const playerName = getPlayerName(playerId);
    
    setGameState(prev => ({
      ...prev,
      penaltyShootout: {
        homeScore: prev.penaltyShootout?.homeScore || 0,
        awayScore: prev.penaltyShootout?.awayScore || 0,
        rounds: [
          ...(prev.penaltyShootout?.rounds || []),
          { team: selectedTeam, outcome, player: playerId }
        ],
        ...(outcome === 'scored' && selectedTeam === 'home' ? 
          { homeScore: (prev.penaltyShootout?.homeScore || 0) + 1 } : {}),
        ...(outcome === 'scored' && selectedTeam === 'away' ? 
          { awayScore: (prev.penaltyShootout?.awayScore || 0) + 1 } : {})
      }
    }));

    addEvent(
      'Penalty Shootout', 
      outcome === 'scored' ? 
        `⚽ Penalty scored by ${playerName}` : 
        `❌ Penalty missed by ${playerName}`, 
      playerId
    );

    toast({ 
      title: outcome === 'scored' ? "Penalty scored!" : "Penalty missed!",
      description: `${selectedTeam === 'home' ? gameState.homeTeam.name : gameState.awayTeam.name} - ${playerName}`
    });
  };

  // TAP-CONFIRM-PUSH: Step 2 - Push confirmed, open player modal or log directly
  const handlePushEvent = (eventType: ConfirmBarType) => {
    setConfirmBar(null);
    
    if (eventType === 'goal') {
      // Push goal event first, then select player
      addEvent('Goal', `⚽ Goal scored`);
      setPlayerModal({ isOpen: true, mode: 'scorer', eventType: 'Goal' });
    } else if (eventType === 'shot-on') {
      setPlayerModal({ isOpen: true, mode: 'shot-player', eventType: 'Shot on Target' });
    } else if (eventType === 'shot-off') {
      setPlayerModal({ isOpen: true, mode: 'shot-player', eventType: 'Shot off Target' });
    } else if (eventType === 'foul-card') {
      setPlayerModal({ isOpen: true, mode: 'foul-card-player', eventType: 'Foul/Card' });
    } else if (eventType === 'substitution') {
      setPlayerModal({ isOpen: true, mode: 'sub-out', eventType: 'Substitution' });
    } else if (eventType === 'corner') {
      updateStat(selectedTeam, 'corners', 1);
      addEvent('Corner', `⚽ Corner kick`);
      toast({ title: "Corner logged!" });
    } else if (eventType === 'offside') {
      addEvent('Offside', `🚩 Offside`);
      toast({ title: "Offside logged!" });
    } else if (eventType === 'save') {
      addEvent('Save', `🧤 Save (Unknown)`);
      setPlayerModal({ isOpen: true, mode: 'save-player', eventType: 'Save' });
    } else if (eventType === 'tackle') {
      addEvent('Tackle', `💪 Tackle (Unknown)`);
      setPlayerModal({ isOpen: true, mode: 'tackle-player', eventType: 'Tackle' });
    }
  };

  const handleEditEvent = (eventId: string) => {
    const event = gameState.events.find(e => e.id === eventId);
    if (!event) return;
    
    setPlayerModal({ 
      isOpen: true, 
      mode: 'edit-event', 
      eventType: event.eventType,
      editEventId: eventId
    });
  };

  const handleCancelConfirm = () => {
    setConfirmBar(null);
  };

  // TAP-CONFIRM-PUSH: Step 3 - Player selected from modal
  const handlePlayerSelection = (playerId: string) => {
    const playerName = getPlayerName(playerId);
    
    // Handle penalty shootout kicks
    if (playerModal.eventType === 'Penalty Shootout Kick') {
      setPlayerModal({ isOpen: false, mode: null, eventType: '' });
      // Ask for outcome
      setFoulModal({
        isOpen: true,
        outcome: null,
        cardReason: '',
        result: null,
        penaltyMode: true,
        penaltyAwardedTeam: selectedTeam,
        penaltyOutcome: null,
        selectedPlayer: playerId,
      });
      return;
    }
    
    if (playerModal.mode === 'edit-event' && playerModal.editEventId) {
      updateEvent(playerModal.editEventId, playerId, playerName);
      setPlayerModal({ isOpen: false, mode: null, eventType: '' });
      toast({ title: "Event updated!", description: `Player added: ${playerName}` });
    } else if (playerModal.mode === 'save-player') {
      updateStat(selectedTeam, 'saves', 1);
      const lastEvent = gameState.events[0];
      if (lastEvent && lastEvent.eventType === 'Save') {
        updateEvent(lastEvent.id, playerId, playerName);
      }
      setPlayerModal({ isOpen: false, mode: null, eventType: '' });
      toast({ title: "Save logged!", description: `Goalkeeper: ${playerName}` });
    } else if (playerModal.mode === 'tackle-player') {
      const lastEvent = gameState.events[0];
      if (lastEvent && lastEvent.eventType === 'Tackle') {
        updateEvent(lastEvent.id, playerId, playerName);
      }
      addPlayerEvent(selectedTeam, playerId, 'tackle');
      updatePlayerRating(selectedTeam, playerId);
      setPlayerModal({ isOpen: false, mode: null, eventType: '' });
      toast({ title: "Tackle logged!", description: `Player: ${playerName}` });
    } else if (playerModal.mode === 'scorer') {
      updateStat(selectedTeam, 'goals', 1);
      addPlayerEvent(selectedTeam, playerId, 'goal');
      updatePlayerRating(selectedTeam, playerId);
      addEvent('Goal', `⚽ Goal scored by ${getPlayerName(playerId)}`, playerId);
      setGoalScorerId(playerId);
      setPlayerModal({ isOpen: true, mode: 'assist', eventType: 'Goal' });
      toast({ title: "Goal logged!", description: "Select assist player or skip" });
    } else if (playerModal.mode === 'assist') {
      if (playerId === goalScorerId) {
        toast({ title: "Scorer cannot assist", variant: "destructive" });
        return;
      }
      updateStat(selectedTeam, 'assists', 1);
      addPlayerEvent(selectedTeam, playerId, 'assist');
      updatePlayerRating(selectedTeam, playerId);
      addEvent('Assist', `🅰️ Assist by ${getPlayerName(playerId)}`, playerId);
      setPlayerModal({ isOpen: false, mode: null, eventType: '' });
      setGoalScorerId(null);
      toast({ title: "Assist logged!" });
    } else if (playerModal.mode === 'shot-player') {
      if (playerModal.eventType === 'Shot on Target') {
        updateStat(selectedTeam, 'shotsOnTarget', 1);
        addPlayerEvent(selectedTeam, playerId, 'shotOnTarget');
        updatePlayerRating(selectedTeam, playerId);
        const opposingTeam = selectedTeam === 'home' ? 'away' : 'home';
        updateStat(opposingTeam, 'saves', 1);
        addEvent('Shot on Target', `🎯 Shot on target by ${getPlayerName(playerId)} - Save`, playerId);
        toast({ title: "Shot on target logged as save" });
      } else {
        updateStat(selectedTeam, 'shotsOffTarget', 1);
        addPlayerEvent(selectedTeam, playerId, 'shotOffTarget');
        updatePlayerRating(selectedTeam, playerId);
        addEvent('Shot off Target', `❌ Shot off target by ${getPlayerName(playerId)}`, playerId);
        toast({ title: "Shot off target logged" });
      }
      setPlayerModal({ isOpen: false, mode: null, eventType: '' });
    } else if (playerModal.mode === 'foul-card-player') {
      setPlayerModal({ isOpen: false, mode: null, eventType: '' });
      setFoulModal({ ...foulModal, isOpen: true, selectedPlayer: playerId });
    } else if (playerModal.mode === 'sub-out') {
      const player = currentTeam.players.find(p => p.id === playerId);
      if (!player?.isOnPitch) {
        toast({ title: "Player not on pitch", variant: "destructive" });
        return;
      }
      setSubOutPlayerId(playerId);
      setPlayerModal({ isOpen: true, mode: 'sub-in', eventType: 'Substitution' });
    } else if (playerModal.mode === 'sub-in') {
      if (!subOutPlayerId) return;
      
      const playerOut = currentTeam.players.find(p => p.id === subOutPlayerId);
      const playerIn = currentTeam.players.find(p => p.id === playerId);
      
      if (!playerOut || !playerIn) return;
      
      if (playerIn.isOnPitch) {
        toast({ title: "Player already on pitch", variant: "destructive" });
        return;
      }

      // Convert to substitution hook player format
      const playerOutFormatted = {
        id: parseInt(playerOut.id.split('-')[1]),
        name: playerOut.name,
        number: parseInt(playerOut.number),
        position: 'Player',
        isOnPitch: playerOut.isOnPitch,
        isEligible: playerOut.isEligible,
        minutesPlayed: playerOut.minutesPlayed
      };

      const playerInFormatted = {
        id: parseInt(playerIn.id.split('-')[1]),
        name: playerIn.name,
        number: parseInt(playerIn.number),
        position: 'Player',
        isOnPitch: playerIn.isOnPitch,
        isEligible: playerIn.isEligible,
        minutesPlayed: playerIn.minutesPlayed
      };

      const result = subManager.makeSubstitution(
        playerOutFormatted, 
        playerInFormatted, 
        matchTimer.displayTime
      );
      
      if (!result.success) {
        toast({ title: result.message, variant: "destructive" });
        return;
      }

      setGameState(prev => ({
        ...prev,
        [selectedTeam === 'home' ? 'homeTeam' : 'awayTeam']: {
          ...prev[selectedTeam === 'home' ? 'homeTeam' : 'awayTeam'],
          players: prev[selectedTeam === 'home' ? 'homeTeam' : 'awayTeam'].players.map(p => {
            if (p.id === subOutPlayerId) return { ...p, isOnPitch: false, isEligible: false };
            if (p.id === playerId) return { ...p, isOnPitch: true };
            return p;
          })
        }
      }));

      addEvent('Substitution', `🔄 ${getPlayerName(playerId)} IN for ${getPlayerName(subOutPlayerId)}`);
      setPlayerModal({ isOpen: false, mode: null, eventType: '' });
      setSubOutPlayerId(null);
      toast({ title: "Substitution complete!", description: `${subManager.getRemainingSubstitutions()} subs remaining` });
    }
  };

  const handleSkipAssist = () => {
    setPlayerModal({ isOpen: false, mode: null, eventType: '' });
    setGoalScorerId(null);
    toast({ title: "Assist skipped" });
  };

  const handleFoulSubmit = () => {
    let details = '';
    const player = foulModal.selectedPlayer ? 
      [...gameState.homeTeam.players, ...gameState.awayTeam.players].find(p => p.id === foulModal.selectedPlayer) : 
      null;
    
    // Handle card if selected
    if (foulModal.outcome === 'yellow') {
      const yellowCardCount = player?.events.filter(e => e.type === 'yellowCard').length || 0;
      
      if (yellowCardCount >= 1) {
        // Second yellow = automatic red card
        updateStat(selectedTeam, 'redCards', 1);
        if (foulModal.selectedPlayer) {
          addPlayerEvent(selectedTeam, foulModal.selectedPlayer, 'redCard');
          addPlayerEvent(selectedTeam, foulModal.selectedPlayer, 'yellowCard');
          updatePlayerRating(selectedTeam, foulModal.selectedPlayer);
          
          setGameState(prev => ({
            ...prev,
            [selectedTeam === 'home' ? 'homeTeam' : 'awayTeam']: {
              ...prev[selectedTeam === 'home' ? 'homeTeam' : 'awayTeam'],
              players: prev[selectedTeam === 'home' ? 'homeTeam' : 'awayTeam'].players.map(p => 
                p.id === foulModal.selectedPlayer ? { ...p, isOnPitch: false, isEligible: false } : p
              )
            }
          }));
        }
        details = `🟨🟥 Second Yellow Card → Red Card${foulModal.cardReason ? ` (${foulModal.cardReason})` : ''}`;
        toast({ 
          title: "Second Yellow Card!", 
          description: `${getPlayerName(foulModal.selectedPlayer || '')} sent off`,
          variant: "destructive"
        });
      } else {
        updateStat(selectedTeam, 'yellowCards', 1);
        if (foulModal.selectedPlayer) {
          addPlayerEvent(selectedTeam, foulModal.selectedPlayer, 'yellowCard');
          updatePlayerRating(selectedTeam, foulModal.selectedPlayer);
        }
        details = `🟨 Yellow Card${foulModal.cardReason ? ` (${foulModal.cardReason})` : ''}`;
      }
    } else if (foulModal.outcome === 'red') {
      updateStat(selectedTeam, 'redCards', 1);
      if (foulModal.selectedPlayer) {
        addPlayerEvent(selectedTeam, foulModal.selectedPlayer, 'redCard');
        updatePlayerRating(selectedTeam, foulModal.selectedPlayer);
        
        setGameState(prev => ({
          ...prev,
          [selectedTeam === 'home' ? 'homeTeam' : 'awayTeam']: {
            ...prev[selectedTeam === 'home' ? 'homeTeam' : 'awayTeam'],
            players: prev[selectedTeam === 'home' ? 'homeTeam' : 'awayTeam'].players.map(p => 
              p.id === foulModal.selectedPlayer ? { ...p, isOnPitch: false, isEligible: false } : p
            )
          }
        }));
      }
      details = `🟥 Red Card${foulModal.cardReason ? ` (${foulModal.cardReason})` : ''}`;
      toast({ 
        title: "Red Card!", 
        description: `${getPlayerName(foulModal.selectedPlayer || '')} sent off`,
        variant: "destructive"
      });
    } else {
      details = '⚠️ Foul';
    }

    // Handle foul result
    if (foulModal.result === 'freekick') {
      updateStat(selectedTeam, 'freeKicks', 1);
      details += ' - Free Kick';
      addEvent('Foul', details, foulModal.selectedPlayer || undefined);
      toast({ title: "Foul logged!", description: details });
      
      setFoulModal({
        isOpen: false,
        outcome: null,
        cardReason: '',
        result: null,
        penaltyMode: false,
        penaltyAwardedTeam: null,
        penaltyOutcome: null,
        selectedPlayer: null,
      });
    } else if (foulModal.result === 'penalty') {
      if (!foulModal.penaltyMode) {
        // Push penalty awarded event first, then ask for outcome
        const opposingTeam = selectedTeam === 'home' ? 'away' : 'home';
        details += ' - ⚠️ Penalty Awarded';
        addEvent('Penalty Awarded', details, foulModal.selectedPlayer || undefined);
        toast({ title: "Penalty awarded!", description: `Select penalty outcome for ${opposingTeam === 'home' ? gameState.homeTeam.name : gameState.awayTeam.name}` });
        setFoulModal({ ...foulModal, penaltyMode: true, penaltyAwardedTeam: opposingTeam });
        return;
      }
      
      // Penalty outcome - goal goes to the team that was fouled (opposing team)
      const scoringTeam = foulModal.penaltyAwardedTeam!;
      
      // Check if this is a penalty shootout kick
      if (matchTimer.phase === 'penalties' && foulModal.selectedPlayer) {
        if (foulModal.penaltyOutcome === 'scored') {
          logPenaltyShootoutKick(foulModal.selectedPlayer, 'scored');
        } else if (foulModal.penaltyOutcome === 'missed') {
          logPenaltyShootoutKick(foulModal.selectedPlayer, 'missed');
        }
      } else {
        // In-match penalty
        if (foulModal.penaltyOutcome === 'scored') {
          updateStat(scoringTeam, 'goals', 1);
          updateStat(scoringTeam, 'penalties', 1);
          addEvent('Penalty Scored', `⚽ Penalty scored by ${scoringTeam === 'home' ? gameState.homeTeam.name : gameState.awayTeam.name}`);
          toast({ title: "Penalty scored!" });
        } else if (foulModal.penaltyOutcome === 'missed') {
          updateStat(scoringTeam, 'penalties', 1);
          addEvent('Penalty Missed', `❌ Penalty missed by ${scoringTeam === 'home' ? gameState.homeTeam.name : gameState.awayTeam.name}`);
          toast({ title: "Penalty missed!" });
        } else if (foulModal.penaltyOutcome === 'overturned') {
          addEvent('Penalty Overturned', `🔄 Penalty overturned`);
          toast({ title: "Penalty overturned!" });
        }
      }
      
      setFoulModal({
        isOpen: false,
        outcome: null,
        cardReason: '',
        result: null,
        penaltyMode: false,
        penaltyAwardedTeam: null,
        penaltyOutcome: null,
        selectedPlayer: null,
      });
    } else {
      // No specific foul result (just a foul, possibly with card)
      addEvent('Foul', details, foulModal.selectedPlayer || undefined);
      toast({ title: "Foul logged!", description: details });
      
      setFoulModal({
        isOpen: false,
        outcome: null,
        cardReason: '',
        result: null,
        penaltyMode: false,
        penaltyAwardedTeam: null,
        penaltyOutcome: null,
        selectedPlayer: null,
      });
    }
  };

  const currentTeam = gameState[selectedTeam === 'home' ? 'homeTeam' : 'awayTeam'];

  return (
    <div className="min-h-screen bg-background p-3 pb-6">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-1 pt-2">
          <div className="flex items-center justify-center gap-2">
            <div className="text-primary text-xs font-bold tracking-wider">BRIXSPORTS LOGGER</div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSettings(!showSettings)}
              className="h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
          <h1 className="text-sm text-muted-foreground">Live Football Match Logging</h1>
          <div className="text-xs text-muted-foreground">{matchType} • {halfDuration} min halves</div>
        </div>

        {/* Match Settings */}
        {showSettings && (
          <Card className="p-4 bg-card border-primary/50 animate-in slide-in-from-top-2">
            <h3 className="text-sm font-semibold mb-3">Match Configuration</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Match Type</label>
                <Select value={matchType} onValueChange={(value) => setMatchType(value as MatchType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal Match</SelectItem>
                    <SelectItem value="Group Stage">Group Stage</SelectItem>
                    <SelectItem value="Knockout">Knockout</SelectItem>
                    <SelectItem value="Quarter Finals">Quarter Finals</SelectItem>
                    <SelectItem value="Semi Finals">Semi Finals</SelectItem>
                    <SelectItem value="Finals">Finals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Half Duration (minutes)</label>
                <Select value={halfDuration.toString()} onValueChange={(value) => setHalfDuration(parseInt(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[20, 25, 30, 35, 40, 45].map(duration => (
                      <SelectItem key={duration} value={duration.toString()}>{duration} minutes</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setShowSettings(false)}
                className="w-full"
              >
                Close Settings
              </Button>
            </div>
          </Card>
        )}

        {/* Score Display */}
        <Card className="bg-card border-border overflow-hidden">
          <div className="bg-primary/10 px-4 py-3 flex items-center justify-between">
            <Input
              value={gameState.homeTeam.name}
              onChange={(e) => updateTeamName('home', e.target.value)}
              className="text-sm font-bold bg-transparent border-none text-foreground w-24 p-0 h-auto focus-visible:ring-0"
            />
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold font-mono">{gameState.homeTeam.goals}</span>
              <span className="text-muted-foreground">:</span>
              <span className="text-3xl font-bold font-mono">{gameState.awayTeam.goals}</span>
            </div>
            <Input
              value={gameState.awayTeam.name}
              onChange={(e) => updateTeamName('away', e.target.value)}
              className="text-sm font-bold bg-transparent border-none text-foreground w-24 p-0 h-auto text-right focus-visible:ring-0"
            />
          </div>
          
          {/* Match Timer */}
          <div className="px-4 py-2 flex items-center justify-center gap-3 border-t border-border">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">
                {matchTimer.phase === 'first-half' ? '1st Half' : 
                 matchTimer.phase === 'second-half' ? '2nd Half' : 
                 matchTimer.phase === 'extra-time-1' ? 'ET 1st' : 
                 matchTimer.phase === 'extra-time-2' ? 'ET 2nd' : 
                 matchTimer.phase === 'penalties' ? 'Penalties' : 'Finished'}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-mono font-bold text-primary">
                  {matchTimer.formatTime(matchTimer.displayTime)}
                </span>
                {matchTimer.stoppageTime > 0 && (
                  <span className="text-xs text-muted-foreground">
                    +{Math.floor(matchTimer.stoppageTime / 60)}'
                  </span>
                )}
              </div>
            </div>
            <Button
              variant={matchTimer.isRunning ? "secondary" : "default"}
              size="sm"
              onClick={() => matchTimer.isRunning ? matchTimer.pause() : matchTimer.start()}
              className="h-10 w-10 p-0"
            >
              {matchTimer.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </Card>

        {/* Team Selection */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={selectedTeam === 'home' ? "default" : "outline"}
            onClick={() => setSelectedTeam('home')}
            className="h-12 font-bold"
          >
            {gameState.homeTeam.name}
          </Button>
          <Button
            variant={selectedTeam === 'away' ? "default" : "outline"}
            onClick={() => setSelectedTeam('away')}
            className="h-12 font-bold"
          >
            {gameState.awayTeam.name}
          </Button>
        </div>

        {/* Penalty Shootout Mode */}
        {matchTimer.phase === 'penalties' && (
          <Card className="p-4 bg-primary/10 border-primary/50 shadow-lg">
            <h3 className="text-sm font-bold text-center mb-3">⚽ PENALTY SHOOTOUT ⚽</h3>
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{gameState.penaltyShootout?.homeScore || 0}</div>
                <div className="text-xs text-muted-foreground">{gameState.homeTeam.name}</div>
              </div>
              <div className="text-xl font-bold text-muted-foreground">-</div>
              <div className="text-center">
                <div className="text-2xl font-bold">{gameState.penaltyShootout?.awayScore || 0}</div>
                <div className="text-xs text-muted-foreground">{gameState.awayTeam.name}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => handlePenaltyShootoutKick('home')}
                className="h-12"
              >
                {gameState.homeTeam.name} Kick
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handlePenaltyShootoutKick('away')}
                className="h-12"
              >
                {gameState.awayTeam.name} Kick
              </Button>
            </div>
          </Card>
        )}

        {/* Timer Prompt */}
        {matchTimer.prompt && (
          <Card className="p-4 bg-primary/10 border-primary/50 animate-in slide-in-from-top-2 shadow-lg">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 bg-primary rounded-full mt-1.5 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{matchTimer.prompt.message}</p>
                  {matchTimer.prompt.type === 'continue' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Timer continues to run - you have full control
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {matchTimer.prompt.onCancel && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={matchTimer.prompt.onCancel} 
                    className="flex-1"
                  >
                    {matchTimer.prompt.type === 'extra-time' ? 'End Match' : 
                     matchTimer.prompt.type === 'penalties' ? 'No Penalties' : 'End Half'}
                  </Button>
                )}
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={matchTimer.prompt.onConfirm} 
                  className="flex-1"
                >
                  {matchTimer.prompt.type === 'stoppage' ? 'Add Stoppage Time' : 
                   matchTimer.prompt.type === 'extra-time' ? 'Start Extra Time' : 
                   matchTimer.prompt.type === 'penalties' ? 'Start Penalties' : 
                   'Continue Playing'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Confirm Bar */}
        {confirmBar && (
          <Card className="p-3 bg-accent/20 border-accent animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                Confirm {confirmBar === 'goal' ? 'Goal' : confirmBar === 'foul-card' ? 'Foul/Card' : confirmBar === 'corner' ? 'Corner' : confirmBar === 'shot-on' ? 'Shot on Target' : confirmBar === 'shot-off' ? 'Shot off Target' : confirmBar === 'substitution' ? 'Substitution' : 'Offside'} for {selectedTeam === 'home' ? gameState.homeTeam.name : gameState.awayTeam.name}?
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancelConfirm} className="h-8">
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={() => handlePushEvent(confirmBar)} className="h-8">
                  Push
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Unified Event Panel */}
        <Card className="p-4 bg-card border-border">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3">UNIFIED EVENT PANEL</h4>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleEventTap('goal')}
              className="h-16 flex flex-col gap-1"
            >
              <span className="text-xl">⚽</span>
              <span className="text-[10px] font-medium">Goal</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleEventTap('foul-card')}
              className="h-16 flex flex-col gap-1"
            >
              <span className="text-xl">⚠️</span>
              <span className="text-[10px] font-medium">Foul</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleEventTap('corner')}
              className="h-16 flex flex-col gap-1"
            >
              <span className="text-xl">🚩</span>
              <span className="text-[10px] font-medium">Corner</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleEventTap('shot-on')}
              className="h-16 flex flex-col gap-1"
            >
              <span className="text-xl">🎯</span>
              <span className="text-[10px] font-medium">Shot On</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleEventTap('shot-off')}
              className="h-16 flex flex-col gap-1"
            >
              <span className="text-xl">❌</span>
              <span className="text-[10px] font-medium">Shot Off</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleEventTap('offside')}
              className="h-16 flex flex-col gap-1"
            >
              <span className="text-xl">🚩</span>
              <span className="text-[10px] font-medium">Offside</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleEventTap('substitution')}
              className="h-16 flex flex-col gap-1"
            >
              <ArrowLeftRight className="h-5 w-5" />
              <span className="text-[10px] font-medium">Sub</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleEventTap('save')}
              className="h-16 flex flex-col gap-1"
            >
              <span className="text-xl">🧤</span>
              <span className="text-[10px] font-medium">Save</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleEventTap('tackle')}
              className="h-16 flex flex-col gap-1"
            >
              <span className="text-xl">💪</span>
              <span className="text-[10px] font-medium">Tackle</span>
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              onClick={undoLastEvent}
              className="h-16 flex flex-col gap-1"
              disabled={gameState.events.length === 0}
            >
              <Undo className="h-4 w-4" />
              <span className="text-[10px] font-medium">Undo</span>
            </Button>
          </div>
        </Card>

        {/* Event Log */}
        <Card className="p-3 bg-card border-border max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-muted-foreground">EVENT LOG</h4>
            <span className="text-[10px] text-muted-foreground">{gameState.events.length} events</span>
          </div>
          <div className="space-y-1.5">
            {gameState.events.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No events logged yet</p>
            ) : (
              gameState.events.map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-start gap-2 p-2 bg-muted/30 rounded text-xs border border-border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleEditEvent(event.id)}
                >
                  <span className="font-mono text-[10px] text-primary min-w-[35px]">{event.timestamp}</span>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{event.details}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {event.team === 'home' ? gameState.homeTeam.name : gameState.awayTeam.name}
                      {!event.player && event.details.includes('(Unknown)') && (
                        <span className="ml-1 text-yellow-500">• Tap to add player</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Player Selection Modal */}
        <Dialog open={playerModal.isOpen} onOpenChange={(open) => {
          if (!open) {
            setPlayerModal({ isOpen: false, mode: null, eventType: '' });
            setGoalScorerId(null);
          }
        }}>
          <DialogContent className="max-w-sm bg-popover z-50">
            <DialogHeader>
              <DialogTitle>
                {playerModal.mode === 'scorer' ? 'Select Goal Scorer' : 
                 playerModal.mode === 'assist' ? 'Select Assist Player' : 
                 playerModal.mode === 'foul-card-player' ? 'Select Fouling Player' : 
                 playerModal.mode === 'sub-out' ? 'Select Player to Sub Out' :
                 playerModal.mode === 'sub-in' ? 'Select Player to Sub In' :
                 playerModal.mode === 'save-player' ? 'Select Goalkeeper' :
                 playerModal.mode === 'tackle-player' ? 'Select Player (Tackle)' :
                 playerModal.mode === 'edit-event' ? 'Update Event Player' :
                 'Select Player'}
              </DialogTitle>
              <DialogDescription>
                {playerModal.mode === 'sub-out' ? 'Select player currently on pitch' : 
                 playerModal.mode === 'sub-in' ? 'Select player to bring on' : 
                 'Tap player to confirm'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
              {currentTeam.players
                .filter(player => {
                  // During penalties, only players on pitch can be selected
                  if (matchTimer.phase === 'penalties') return player.isOnPitch;
                  if (playerModal.mode === 'sub-out') return player.isOnPitch;
                  if (playerModal.mode === 'sub-in') return !player.isOnPitch && player.isEligible;
                  return true;
                })
                .map((player) => (
                  <Button
                    key={player.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePlayerSelection(player.id)}
                    className="h-14 text-xs flex flex-col p-1 font-bold relative"
                  >
                    <span className="text-sm">#{player.number}</span>
                    <span className="text-[9px] truncate w-full">{player.name}</span>
                    {(playerModal.mode === 'scorer' || playerModal.mode === 'assist') && (
                      <span className="absolute top-0 right-0 text-[8px] bg-primary/20 px-1 rounded">
                        {player.rating.toFixed(1)}
                      </span>
                    )}
                  </Button>
                ))}
            </div>

            {playerModal.mode === 'assist' && (
              <Button variant="secondary" onClick={handleSkipAssist} className="w-full">
                Skip Assist
              </Button>
            )}
          </DialogContent>
        </Dialog>

        {/* Foul Modal */}
        <Dialog open={foulModal.isOpen} onOpenChange={(open) => {
          if (!open) {
            setFoulModal({
              isOpen: false,
              outcome: null,
              cardReason: '',
              result: null,
              penaltyMode: false,
              penaltyAwardedTeam: null,
              penaltyOutcome: null,
              selectedPlayer: null,
            });
          }
        }}>
          <DialogContent className="max-w-sm bg-popover z-50">
            <DialogHeader>
              <DialogTitle>Log Foul</DialogTitle>
              <DialogDescription>
                {!foulModal.penaltyMode ? 'Select card outcome and result' : 'Select penalty outcome'}
              </DialogDescription>
            </DialogHeader>
            
            {!foulModal.penaltyMode ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">1. Card Outcome (Optional)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={foulModal.outcome === 'yellow' ? "default" : "outline"}
                      onClick={() => setFoulModal({ ...foulModal, outcome: 'yellow' })}
                      className="h-12"
                    >
                      🟨 Yellow
                    </Button>
                    <Button
                      variant={foulModal.outcome === 'red' ? "destructive" : "outline"}
                      onClick={() => setFoulModal({ ...foulModal, outcome: 'red' })}
                      className="h-12"
                    >
                      🟥 Red
                    </Button>
                  </div>
                </div>

                {(foulModal.outcome === 'yellow' || foulModal.outcome === 'red') && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Card Reason (Optional)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['Violent Conduct', 'Speech Abuse', 'Dangerous Play', 'Unsporting Behavior', 
                        'Dissent', 'Delay of Game'].map(reason => (
                        <Button
                          key={reason}
                          variant={foulModal.cardReason === reason ? "default" : "outline"}
                          onClick={() => setFoulModal({ ...foulModal, cardReason: reason })}
                          className="h-10 text-xs"
                        >
                          {reason}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold mb-2">2. Foul Result (Optional)</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={foulModal.result === 'freekick' ? "default" : "outline"}
                      onClick={() => setFoulModal({ ...foulModal, result: 'freekick' })}
                      className="h-12"
                    >
                      Free Kick
                    </Button>
                    <Button
                      variant={foulModal.result === 'penalty' ? "default" : "outline"}
                      onClick={() => setFoulModal({ ...foulModal, result: 'penalty' })}
                      className="h-12"
                    >
                      Penalty
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleFoulSubmit} 
                  className="w-full"
                >
                  Push Foul
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Penalty Outcome</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant={foulModal.penaltyOutcome === 'scored' ? "default" : "outline"}
                      onClick={() => setFoulModal({ ...foulModal, penaltyOutcome: 'scored' })}
                      className="h-12"
                    >
                      ⚽ Penalty Scored
                    </Button>
                    <Button
                      variant={foulModal.penaltyOutcome === 'missed' ? "destructive" : "outline"}
                      onClick={() => setFoulModal({ ...foulModal, penaltyOutcome: 'missed' })}
                      className="h-12"
                    >
                      ❌ Penalty Missed
                    </Button>
                    <Button
                      variant={foulModal.penaltyOutcome === 'overturned' ? "secondary" : "outline"}
                      onClick={() => setFoulModal({ ...foulModal, penaltyOutcome: 'overturned' })}
                      className="h-12"
                    >
                      🔄 Penalty Overturned
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleFoulSubmit} 
                  className="w-full"
                  disabled={!foulModal.penaltyOutcome}
                >
                  Confirm Penalty
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FootballLogger;