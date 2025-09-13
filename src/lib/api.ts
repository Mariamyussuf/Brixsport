
export type Team = {
  id: string;
  name: string;
  logo_url?: string;
  founded_year?: number;
  stadium?: string;
  city?: string;
  color?: string;
};

export type Player = {
  id: string;
  name: string;
  position?: string;
  team_id?: string;
  nationality?: string;
  age?: number;
  number?: string;
  teamColor?: string;
};

export type Competition = {
  id: string;
  name: string;
  type?: string;
  category?: string;
  status?: string;
  color?: string;
  description?: string;
  sportType?: string;
  created_at?: string;
  start_date?: string;
  end_date?: string;
};

export type Notification = {
  id?: string;
  type?: string;
  message?: string;
  title?: string;
  body?: string;
  timestamp?: number;
  isRead?: boolean;
};

export type EventType = 'goal' | 'card' | 'substitution' | 'injury' | 'var' | 'other';

export interface LiveEvent {
  id: string;
  type: EventType;
  timestamp: number;
  matchId: string;
  teamId?: string;
  playerId?: string;
  data?: {
    score?: [number, number];
    cardType?: 'yellow' | 'red';
    injuryType?: string;
    description?: string;
    duration?: number;
  };
}

export default {};
