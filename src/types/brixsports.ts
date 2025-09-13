export interface BrixSportsHomeData {
  liveFootball: Match[];
  liveBasket: Match[];
  liveTrack: TrackEvent[];
  upcomingMatches: Match[];
  featuredContent: any; // Can be defined better
  userStats: any; // Can be defined better
}

export interface Match {
  id: any;
  competition_id: any;
  home_team_id: any;
  away_team_id: any;
  match_date: string;
  status?: 'live' | 'scheduled' | 'completed' | 'finished' | 'ended';
  home_score?: number | null;
  away_score?: number | null;
  sport?: string;
}

export interface TrackEvent {
  id: any;
  name?: string;
  status?: 'live' | 'scheduled' | 'completed' | 'finished' | 'ended';
  start_time?: string;
  results?: TrackResult[];
}

export interface TrackResult {
  position: number;
  team_id: any;
  team_name: string;
  time?: string; // For timed events
  distance?: number; // For field events
}