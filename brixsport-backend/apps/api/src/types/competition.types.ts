// Competition Types with Group Stage Support

export type SportType = 'football' | 'basketball' | 'track';
export type CompetitionType = 'league' | 'tournament' | 'cup' | 'championship';
export type CompetitionCategory = 'school' | 'college' | 'community' | 'professional';
export type CompetitionStatus = 'draft' | 'registration' | 'group_stage' | 'knockout' | 'completed' | 'cancelled';
export type CompetitionFormat = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss' | 'group_knockout';
export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'postponed';

export interface Competition {
  id: string;
  name: string;
  description: string;
  sport: SportType;
  type: CompetitionType;
  category: CompetitionCategory;
  status: CompetitionStatus;
  start_date: string; // ISO timestamp
  end_date: string; // ISO timestamp
  registration_deadline: string; // ISO timestamp
  max_teams: number;
  current_teams: number;
  format: CompetitionFormat;
  prize_pool?: number;
  entry_fee?: number;
  organizer: string;
  location: string;
  rules?: string;
  has_group_stage: boolean;
  groups?: number;
  teams_per_group?: number;
  advance_per_group?: number;
  created_by: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
}

export interface CompetitionTeam {
  id: string;
  competition_id: string;
  team_id: string;
  team: Team;
  added_at: string; // ISO timestamp
}

export interface Group {
  id: string;
  competition_id: string;
  name: string;
  teams: GroupTeam[];
}

export interface GroupTeam {
  id: string;
  group_id: string;
  team_id: string;
  team: Team;
}

export interface GroupStanding {
  team_id: string;
  team_name: string;
  team_logo?: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface GroupWithStandings {
  group_id: string;
  group_name: string;
  standings: GroupStanding[];
}

export interface KnockoutMatch {
  match_id: string;
  home_team: {
    team_id: string;
    team_name: string;
    team_logo?: string;
    source: string; // e.g., "group_A_1", "group_B_2", "wildcard_1"
  };
  away_team: {
    team_id: string;
    team_name: string;
    team_logo?: string;
    source: string;
  };
  match_date: string; // ISO timestamp
  venue: string;
  status: MatchStatus;
  home_score?: number;
  away_score?: number;
}

export interface KnockoutStage {
  round_of_16: KnockoutMatch[];
  quarter_finals: KnockoutMatch[];
  semi_finals: KnockoutMatch[];
  final: KnockoutMatch;
}

export interface CompetitionStanding {
  position: number;
  team_id: string;
  team_name: string;
  team_logo?: string;
  group_stage: {
    group: string;
    group_position: number;
    points: number;
    goals_for: number;
    goals_against: number;
  };
  knockout_stage: {
    round_reached: 'round_of_16' | 'quarter_finals' | 'semi_finals' | 'final' | 'winner' | 'runner_up';
    matches_played: number;
    wins: number;
  };
}

export interface CompetitionStatistics {
  total_matches: number;
  completed_matches: number;
  total_goals: number;
  avg_attendance: number;
  top_scorers: Array<{
    player_id: string;
    player_name: string;
    team_id: string;
    team_name: string;
    goals: number;
  }>;
  most_clean_sheets: Array<{
    team_id: string;
    team_name: string;
    clean_sheets: number;
  }>;
}

export interface CompetitionMatch {
  id: string;
  competition_id: string;
  stage: 'group_stage' | 'knockout';
  group_id?: string; // if group stage
  round?: 'round_of_16' | 'quarter_finals' | 'semi_finals' | 'final'; // if knockout
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_team_logo?: string;
  away_team_logo?: string;
  match_date: string; // ISO timestamp
  venue: string;
  status: MatchStatus;
  home_score?: number;
  away_score?: number;
  current_minute?: number;
  period?: string;
}

export interface CompetitionTimelineEvent {
  date: string; // ISO timestamp
  event: string;
  description: string;
  type: 'milestone' | 'match' | 'announcement';
}