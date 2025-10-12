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
  start_date: string; // Changed from string | null to string
  end_date: string;   // Changed from string | null to string
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
    // For now, we'll throw an error as this needs backend implementation
    throw new Error('Competition creation not implemented');
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Update competition
export async function updateCompetition(id: number, data: UpdateCompetitionData): Promise<Competition> {
  try {
    // For now, we'll throw an error as this needs backend implementation
    throw new Error('Competition update not implemented');
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Delete competition
export async function deleteCompetition(id: number): Promise<void> {
  try {
    // For now, we'll throw an error as this needs backend implementation
    throw new Error('Competition deletion not implemented');
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Get competitions by sport
export async function getCompetitionsBySport(sport: string): Promise<Competition[]> {
  try {
    // For now, we'll throw an error as this needs backend implementation
    throw new Error('Get competitions by sport not implemented');
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Get active competitions
export async function getActiveCompetitions(): Promise<Competition[]> {
  try {
    // For now, we'll throw an error as this needs backend implementation
    throw new Error('Get active competitions not implemented');
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}