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