
export type SportType =
  | 'football'
  | 'basketball'
  | 'volleyball'
  | 'track_events'
  | 'table_tennis'
  | 'badminton';
  'all';


export type FootballEvent =
  | 'goal' | 'assist' | 'save' | 'yellow_card' | 'red_card' | 'foul'
  | 'substitution' | 'corner' | 'free_kick' | 'penalty';

export type BasketballEvent =
  | 'field_goal' | 'three_pointer' | 'free_throw' | 'rebound' | 'assist'
  | 'steal' | 'block' | 'turnover' | 'foul' | 'timeout';

export type TrackFieldEvent =
  | 'race_start' | 'race_finish' | 'lap_time' | 'false_start' | 'disqualification'
  | 'record_attempt' | 'jump_attempt' | 'throw_attempt' | 'measurement';

export type VolleyballEvent =
  | 'serve' | 'spike' | 'block' | 'dig' | 'set' | 'ace' | 'error';

export type TableTennisEvent = 'point' | 'serve' | 'error' | 'timeout';
export type BadmintonEvent = 'point' | 'serve' | 'error' | 'timeout';

export type CampusEventType =
  | FootballEvent
  | BasketballEvent
  | TrackFieldEvent
  | VolleyballEvent
  | TableTennisEvent
  | BadmintonEvent;


export type Semester = string; 
export type EventScope = 'internal' | 'external';

export interface Player {
  id: string;
  name: string;
  number?: string;
  teamId: string;
  position?: string;
  college?: string;
  department?: string;
  team?: string; 
  teamColor?: string;
  injured?: boolean;
  suspended?: boolean;
  captain?: boolean;
}

export interface Team {
  id: string;
  name: string;
  color: string; 
  logoUrl?: string;
  players: Player[];
}
export interface Match {
  id: string;
  sportType: SportType;
  teams: Team[];
  startTime: number;
  endTime?: number;
  status: 'upcoming' | 'live' | 'paused' | 'finished';
  events: EventLog[];
  semester?: Semester;
}
export interface EventLog {
  id: string;
  matchId: string;
  teamId?: string;
  playerId?: string;
  eventType: CampusEventType;
  timestamp: number;
  value?: number | string; 
  offline?: boolean; 
  eventScope?: EventScope;
  semester?: Semester;
  createdBy?: string; 
  editedBy?: string; 
  createdAt?: number;
  editedAt?: number;
}

export interface Tournament {
  id: string;
  name: string;
  sportType: SportType;
  startDate: number;
  endDate: number;
  matches: Match[];
  teams: Team[];
  status: 'upcoming' | 'live' | 'completed';
  semester?: Semester;
}

export type UserRole = 'logger' | 'admin' | 'viewer';
export interface User {
  id: string;
  name: string;
  role: UserRole;
}
export interface UI_Match {
  status: 'Live' | 'Upcoming';
  time: string;
  team1: string;
  team2: string;
  score1?: number;
  score2?: number;
  team1Color: string;
  team2Color: string;
  sportType?: SportType; // Add sportType property
}

export interface UI_TrackResult {
  position: string;
  team: string;
}

export interface UI_TrackEvent {
  status: 'Ended' | 'Live' | 'Upcoming';
  event: string;
  results: UI_TrackResult[];
}

export type TabType = 'Fixtures' | 'Live' | 'Favourites' | 'Competition' | 'Profile';


export interface UI_TeamLogoProps {
  color: string;
}

export interface UI_MatchCardProps {
  match: UI_Match;
  isBasketball?: boolean;
}

export interface UI_TrackEventCardProps {
  event: UI_TrackEvent;
}
