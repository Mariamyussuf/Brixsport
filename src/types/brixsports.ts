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

export interface Player {
  id: number;
  name: string;
  position: string;
  jersey_number: number;
  team_id: number;
  age: number;
  nationality: string;
  photo_url: string | null;
  // Optional properties that may be included in some responses
  height?: number | null;
  weight?: number | null;
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
