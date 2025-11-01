// Match event types
export type MatchStatus = 'scheduled' | 'live' | 'half-time' | 'full-time' | 'postponed';

export type EventType = 
  | 'goal'
  | 'card'
  | 'substitution'
  | 'foul'
  | 'injury'
  | 'VAR'
  | 'penalty'
  | 'kick-off'
  | 'half-time'
  | 'full-time'
  | 'other';

export type CardType = 'yellow' | 'red';

export type GoalType = 'regular' | 'penalty' | 'free-kick' | 'header' | 'own-goal';

export type FoulType = 'tackle' | 'handball' | 'offside' | 'foul-play' | 'dissent' | 'time-wasting' | 'unsporting';

export type InjurySeverity = 'minor' | 'moderate' | 'severe';

export interface PlayerStats {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passesCompleted: number;
  tackles: number;
  interceptions: number;
  clearances: number;
  saves: number;
  foulsCommitted: number;
  foulsSuffered: number;
  minutesPlayed: number;
  substitutions: number;
  offside: number;
  possession: number;
  corners?: number;
  throwIns?: number;
  passAccuracy?: number;
  fouls?: number;
  offsides?: number;
}

export interface TeamStats extends PlayerStats {
  substitutionsUsed: number;
  formation: string;
  possession: number;
  cornerKicks: number;
  goalAttempts: number;
  dangerousAttacks: number;
}

// Add the new interface for match stats response
export interface MatchStatsResponse {
  matchId: string;
  homeTeam: TeamStats & {
    teamId: string;
    teamName: string;
    goals: number;
    events: number;
    goalsEvents: number;
    cardEvents: number;
    shots: number;
    shotsOnTarget: number;
    corners: number;
    fouls: number;
    yellowCards: number;
    redCards: number;
    offsides: number;
    throwIns: number;
    passes: number;
    passAccuracy: number;
  };
  awayTeam: TeamStats & {
    teamId: string;
    teamName: string;
    goals: number;
    events: number;
    goalsEvents: number;
    cardEvents: number;
    shots: number;
    shotsOnTarget: number;
    corners: number;
    fouls: number;
    yellowCards: number;
    redCards: number;
    offsides: number;
    throwIns: number;
    passes: number;
    passAccuracy: number;
  };
}

export interface MatchEvent {
  description: string;
  id: string; // UUID
  matchId: string;
  type: EventType;
  timestamp: string; // ISO 8601 format with milliseconds
  minute: number;
  second: number;
  millisecond: number;
  teamId?: string;
  playerId?: string;
  secondaryPlayerId?: string; // For assists, substitutions, fouled players, etc.
  metadata: {
    goalType?: GoalType;
    cardType?: CardType;
    foulType?: FoulType;
    injurySeverity?: InjurySeverity;
    notes?: string;
    penaltyType?: string;
    VARDecision?: string;
  };
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  competitionId: string;
  loggerId: string;
  dateTime: string; // ISO 8601 format
  venue: string;
  status: MatchStatus;
  events: MatchEvent[];
  homeTeamStats?: TeamStats;
  awayTeamStats?: TeamStats;
  playerStats?: Record<string, PlayerStats>; // Player stats by player ID
}

export interface Team {
  id: string;
  name: string;
  logoUrl: string;
  coachName: string;
  players: Player[];
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  jerseyNumber: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  status: 'on-field' | 'substituted' | 'injured';
}

// Real-time update types
export interface TimelineUpdate {
  eventType: 'event' | 'stat' | 'match-status';
  timestamp: string; // ISO 8601 format with milliseconds
  data: MatchEvent | MatchStatus | PlayerStats | TeamStats;
  sequence: number; // For ordering events that happen simultaneously
}

export interface WebSocketMessage {
  type: 'timeline-update' | 'match-status' | 'stats-update' | 'error';
  payload: any;
  timestamp: string;
  matchId?: string;
  correlationId?: string; // For matching requests and responses
}