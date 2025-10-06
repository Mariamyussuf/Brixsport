// Team and Player type definitions
export interface Team {
  id: string; // UUID
  name: string;
  description?: string;
  foundedYear?: number;
  logoUrl?: string;
  stadium?: string;
  city: string;
  country: string;
  colorPrimary: string; // HEX color code
  colorSecondary: string; // HEX color code
  sport: 'FOOTBALL' | 'BASKETBALL' | 'TRACK';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  websiteUrl?: string;
  socialMediaLinks?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  coachName?: string;
  captainId?: string; // Player ID of team captain
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string; // UUID
  firstName: string;
  lastName: string;
  displayName?: string;
  dateOfBirth: Date;
  nationality: string; // ISO 3166-1 alpha-2 country code
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  sport: 'FOOTBALL' | 'BASKETBALL' | 'TRACK';
  position?: string;
  height?: number; // in cm
  weight?: number; // in kg
  teamId?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'RETIRED';
  profilePictureUrl?: string;
  biography?: string;
  socialMediaLinks?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  careerStats?: CareerStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface CareerStats {
  matchesPlayed: number;
  goals?: number; // For football
  assists?: number; // For football
  points?: number; // For basketball
  rebounds?: number; // For basketball
  steals?: number; // For basketball
  blocks?: number; // For basketball
  personalBests?: {
    event: string;
    timeOrDistance: string;
  }[]; // For track events
}

export interface Match {
  id: string;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  venue: string;
  startTime: Date;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'POSTPONED' | 'CANCELLED';
  homeScore?: number;
  awayScore?: number;
  sport: 'FOOTBALL' | 'BASKETBALL' | 'TRACK';
}

export interface Competition {
  id: string;
  name: string;
  description?: string;
  sport: 'FOOTBALL' | 'BASKETBALL' | 'TRACK';
  startDate: Date;
  endDate: Date;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamStats {
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedTeams {
  teams: Team[];
  pagination: Pagination;
}

export interface PaginatedMatches {
  matches: Match[];
  pagination: Pagination;
}

export interface PaginatedPlayers {
  players: Player[];
  pagination: Pagination;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: object;
  };
}