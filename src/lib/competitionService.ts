import { APIEndpoint } from '@/types/api';
import { handleApiError } from '@/types/apiError';
import { TokenManager } from '@/hooks/useAuth';
import { databaseService } from '@/lib/databaseService';

// Updated Competition interface to match backend specification
export interface Competition {
  id: number;
  name: string;
  type: string;
  category: string;
  status: string;
  start_date: string;
  end_date: string;
}

// New Match interface to match backend specification
export interface Match {
  id: number;
  competition_id: number;
  home_team_id: number;
  away_team_id: number;
  match_date: string;
  venue: string | null;
  status: string;
  home_score: number;
  away_score: number;
  current_minute: number;
  period: string | null;
  home_team_name?: string;
  home_team_logo?: string;
  away_team_name?: string;
  away_team_logo?: string;
}

export interface CompetitionDetailsResponse {
  competition: Competition;
  matches: Match[];
}

export interface CreateCompetitionData {
  name: string;
  type: string;
  category: string;
  status: string;
  start_date: string;
  end_date: string;
}

export interface UpdateCompetitionData {
  name?: string;
  type?: string;
  category?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

// Add new interfaces for group standings and knockout structure
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
    source: string;
  };
  away_team: {
    team_id: string;
    team_name: string;
    team_logo?: string;
    source: string;
  };
  match_date: string;
  venue: string;
  status: string;
  home_score?: number;
  away_score?: number;
  round: string;
}

export interface KnockoutStage {
  round_of_16: KnockoutMatch[];
  quarter_finals: KnockoutMatch[];
  semi_finals: KnockoutMatch[];
  final: KnockoutMatch | null;
}

// Get all competitions
export async function getCompetitions(): Promise<Competition[]> {
  try {
    // Try to get from database service first (Supabase)
    const competitions = await databaseService.getCompetitions();
    // Convert nullable dates to empty strings to match the interface
    return competitions.map(competition => ({
      ...competition,
      start_date: competition.start_date || '',
      end_date: competition.end_date || ''
    }));
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Get competition by ID with matches
export async function getCompetitionById(id: number): Promise<CompetitionDetailsResponse> {
  try {
    // Try to get from database service first (Supabase)
    const competition = await databaseService.getCompetitionById(id);
    const matches = await databaseService.getMatchesByCompetition(id);
    
    if (competition) {
      return {
        competition: {
          ...competition,
          start_date: competition.start_date || '',
          end_date: competition.end_date || ''
        },
        matches
      };
    }
    
    throw new Error('Failed to fetch competition');
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Create a new competition
export async function createCompetition(data: CreateCompetitionData): Promise<Competition> {
  try {
    // Use database service to create competition
    const competition = await databaseService.createCompetition(data);
    
    if (!competition) {
      throw new Error('Failed to create competition');
    }
    
    // Convert nullable dates to empty strings to match the interface
    return {
      id: competition.id,
      name: competition.name,
      type: competition.type,
      category: competition.category,
      status: competition.status,
      start_date: competition.start_date || '',
      end_date: competition.end_date || ''
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Update competition
export async function updateCompetition(id: number, data: UpdateCompetitionData): Promise<Competition> {
  try {
    // Use database service to update competition
    const competition = await databaseService.updateCompetition(id, data);
    
    if (!competition) {
      throw new Error('Failed to update competition');
    }
    
    // Convert nullable dates to empty strings to match the interface
    return {
      id: competition.id,
      name: competition.name,
      type: competition.type,
      category: competition.category,
      status: competition.status,
      start_date: competition.start_date || '',
      end_date: competition.end_date || ''
    };
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Delete competition
export async function deleteCompetition(id: number): Promise<void> {
  try {
    // Use database service to delete competition
    const success = await databaseService.deleteCompetition(id);
    
    if (!success) {
      throw new Error('Failed to delete competition');
    }
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Get competitions by sport
export async function getCompetitionsBySport(sport: string): Promise<Competition[]> {
  try {
    // Get all competitions and filter by sport
    const allCompetitions = await databaseService.getCompetitions();
    const filteredCompetitions = allCompetitions.filter(comp => comp.type === sport);
    
    // Convert nullable dates to empty strings to match the interface
    return filteredCompetitions.map(competition => ({
      id: competition.id,
      name: competition.name,
      type: competition.type,
      category: competition.category,
      status: competition.status,
      start_date: competition.start_date || '',
      end_date: competition.end_date || ''
    }));
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Get active competitions
export async function getActiveCompetitions(): Promise<Competition[]> {
  try {
    // Get all competitions and filter by active status
    const allCompetitions = await databaseService.getCompetitions();
    const activeCompetitions = allCompetitions.filter(comp => comp.status === 'active');
    
    // Convert nullable dates to empty strings to match the interface
    return activeCompetitions.map(competition => ({
      id: competition.id,
      name: competition.name,
      type: competition.type,
      category: competition.category,
      status: competition.status,
      start_date: competition.start_date || '',
      end_date: competition.end_date || ''
    }));
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Add new functions to fetch group standings and knockout structure
export async function getCompetitionGroupStandings(id: string): Promise<GroupWithStandings[]> {
  try {
    const response = await fetch(`/api/competitions/${id}/group-standings`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch group standings');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching group standings:', error);
    throw error;
  }
}

export async function getCompetitionKnockoutStructure(id: string): Promise<KnockoutStage> {
  try {
    const response = await fetch(`/api/competitions/${id}/knockout-structure`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch knockout structure');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching knockout structure:', error);
    throw error;
  }
}

// Add function to get competition teams
export async function getCompetitionTeams(id: string): Promise<any[]> {
  try {
    // This would typically be a separate endpoint, but for now we'll use the existing teams service
    // In a real implementation, you might want to fetch teams specific to this competition
    const response = await fetch(`/api/competitions/${id}/teams`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch competition teams');
    }
    
    return data.data || [];
  } catch (error) {
    console.error('Error fetching competition teams:', error);
    return [];
  }
}

// Add function to get group matches
export async function getGroupMatches(competitionId: string, groupId: string): Promise<Match[]> {
  return getCompetitionMatches(competitionId, { group_id: groupId, round: 'GROUP_STAGE' });
}

// Add function to get competition matches
export async function getCompetitionMatches(id: string, filters: { group_id?: string; round?: string } = {}): Promise<Match[]> {
  try {
    // Build query string with filters
    const queryParams = new URLSearchParams();
    if (filters.group_id) queryParams.append('group_id', filters.group_id);
    if (filters.round) queryParams.append('round', filters.round);
    
    const queryString = queryParams.toString();
    const url = `/api/competitions/${id}/matches${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch competition matches');
    }
    
    return data.data.map((match: any) => ({
      id: match.id,
      competition_id: match.competition_id,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      match_date: match.match_date,
      venue: match.venue,
      status: match.status,
      home_score: match.home_score,
      away_score: match.away_score,
      current_minute: match.current_minute,
      period: match.period,
      home_team_name: match.home_team_name,
      home_team_logo: match.home_team_logo,
      away_team_name: match.away_team_name,
      away_team_logo: match.away_team_logo
    }));
  } catch (error) {
    console.error('Error fetching competition matches:', error);
    return [];
  }
}
