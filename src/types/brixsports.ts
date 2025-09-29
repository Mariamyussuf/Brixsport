export interface BrixSportsHomeData {
  liveFootball: Match[];
  liveBasketball: Match[];
  trackEvents: TrackEvent[];
  upcomingFootball: Match[];
  featuredContent: any; // Can be defined better
  userStats: any; // Can be defined better
}

export interface Match {
  id: number;
  competition_id: number;
  home_team_id: number;
  away_team_id: number;
  match_date: string; // ISO datetime
  venue: string | null;
  status: string; // scheduled, live, completed
  home_score: number;
  away_score: number;
  current_minute: number;
  period: string | null;
  // Optional properties that may be included in some responses
  home_team_name?: string;
  home_team_logo?: string;
  away_team_name?: string;
  away_team_logo?: string;
  competition_name?: string;
  created_at?: string;
}

export interface TrackEvent {
  id: number;
  competition_id: number;
  event_name: string;
  event_type: string;
  gender: string; // male, female
  scheduled_time: string; // ISO datetime
  status: string; // scheduled, live, completed
}

export interface UpdateScorePayload {
  home_score: number;
  away_score: number;
  current_minute: number;
  period: string;
  status: string;
}

export interface LiveEvent {
  id: number;
  match_id: number;
  player_id: number;
  event_type: string;
  minute: number;
  description: string;
  created_at: string;
}

export interface LiveEventPayload {
  match_id: number;
  player_id: number;
  event_type: string;
  minute: number;
  description: string;
}

export interface TrackResult {
  position: number;
  team_id: any;
  team_name: string;
  time?: string; // For timed events
  distance?: number; // For field events
}

export interface LiveMatchesResponse {
  football: Match[];
  basketball: Match[];
  track: TrackEvent[];
}

export interface Team {
  id: number;
  name: string;
  logo_url: string;
  founded_year: number | null;
  stadium: string | null;
  city: string;
  country: string;
  color_primary: string;
  color_secondary: string;
}

export interface CreateTeamPayload {
  name: string;
  logo_url: string;
  founded_year?: number;
  stadium?: string;
  city?: string;
  country?: string;
  color_primary?: string;
  color_secondary?: string;
}

// Updated Player interface to match system requirements
export interface Player {
  id: string; // UUID
  firstName: string;
  lastName: string;
  displayName?: string; // Optional custom display name
  dateOfBirth: string; // ISO date format
  nationality: string; // ISO 3166-1 alpha-2 country code
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  sport: 'FOOTBALL' | 'BASKETBALL' | 'TRACK';
  position?: string; // Sport-specific position
  height?: number; // in cm
  weight?: number; // in kg
  teamId?: string; // Current team
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'RETIRED';
  profilePictureUrl?: string;
  biography?: string;
  socialMediaLinks?: { // Added social media links
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  careerStats?: CareerStats; // Added career stats
  createdAt: string; // ISO date format
  updatedAt: string; // ISO date format
}

// Sport-specific career statistics
export interface CareerStats {
  // Football stats
  football?: {
    goals?: number;
    assists?: number;
    matchesPlayed?: number;
    yellowCards?: number;
    redCards?: number;
    cleanSheets?: number; // For goalkeepers
  };
  
  // Basketball stats
  basketball?: {
    points?: number;
    rebounds?: number;
    assists?: number;
    steals?: number;
    blocks?: number;
    matchesPlayed?: number;
    fieldGoalPercentage?: number;
  };
  
  // Track stats
  track?: {
    personalBests?: {
      event: string; // e.g., "100m", "Marathon"
      time?: string; // For timed events
      distance?: number; // For distance events
      date?: string;
    }[];
    matchesParticipated?: number;
    medalsWon?: {
      gold: number;
      silver: number;
      bronze: number;
    };
  };
}

// Admin-only player management payloads
export interface CreatePlayerPayload {
  firstName: string;
  lastName: string;
  displayName?: string;
  dateOfBirth: string;
  nationality: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  sport: 'FOOTBALL' | 'BASKETBALL' | 'TRACK';
  position?: string;
  height?: number;
  weight?: number;
  teamId?: string;
  profilePictureUrl?: string;
  biography?: string;
  socialMediaLinks?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
}

export interface UpdatePlayerPayload {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  dateOfBirth?: string;
  nationality?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  sport?: 'FOOTBALL' | 'BASKETBALL' | 'TRACK';
  position?: string;
  height?: number;
  weight?: number;
  teamId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'RETIRED';
  profilePictureUrl?: string;
  biography?: string;
  socialMediaLinks?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
}

export interface UpdatePlayerStatsPayload {
  stats: CareerStats;
}

export interface AssignPlayerToTeamPayload {
  teamId: string;
}

export interface PlayerListParams {
  page?: number;
  limit?: number;
  sport?: 'FOOTBALL' | 'BASKETBALL' | 'TRACK';
  teamId?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'RETIRED';
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PlayerSearchParams {
  q?: string;
  sports?: string;
  positions?: string;
  minAge?: number;
  maxAge?: number;
  nationalities?: string;
}

export interface PlayerListResponse {
  players: Player[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PlayerSearchResponse {
  players: Player[];
  count: number;
}

// Public search interfaces for all authenticated users
export interface GlobalSearchParams {
  query: string;
  types?: ('players' | 'competitions' | 'teams')[];
  limit?: number;
}

export interface GlobalSearchResult {
  players?: Player[];
  competitions?: Match[]; // Using Match as competition type
  teams?: Team[];
}

export interface CreateTrackEventPayload {
  competition_id: number;
  event_name: string;
  event_type: string;
  gender: "male" | "female";
  scheduled_time: string;
}

export interface MatchWithEvents extends Match {
  events: LiveEvent[];
  home_team_name?: string;
  home_team_logo?: string;
  away_team_name?: string;
  away_team_logo?: string;
  competition_name?: string;
}
