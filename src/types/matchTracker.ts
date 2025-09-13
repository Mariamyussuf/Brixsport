export interface Match {
  id: string;
  name: string;
  competitionId: string;
  homeTeam: Team;
  awayTeam: Team;
  startTime: string;
  venue: string;
  status: 'scheduled' | 'live' | 'completed';
  events: MatchEvent[];
  sportType: string;
  homeScore: number;
  awayScore: number;
  date: string;
  location: string;
}

export interface MatchEvent {
  id: string;
  type: string;
  time: string;
  teamId: string;
  playerId: string;
  period: number;
  description?: string;
  x?: number;
  y?: number;
}

export interface Team {
    id: string;
    name: string;
    players: Player[];
}

export interface Player {
    id: string;
    name: string;
    jerseyNumber: number;
}

// Exported helper types used by other modules
export type MatchStatus = 'scheduled' | 'live' | 'completed';

export type ApiError = {
  message?: string;
  code?: number;
};
