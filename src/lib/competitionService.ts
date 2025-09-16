import APIService from '@/services/APIService';
import { APIEndpoint } from '@/types/api';
import { handleApiError } from '@/types/apiError';
import { TokenManager } from '@/hooks/useAuth';

// Updated Competition interface to match backend specification
export interface Competition {
  id: number;
  name: string;
  type: string;
  category: string;
  status: string;
  start_date: string; // ISO date
  end_date: string;   // ISO date
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
  home_team_name: string;
  home_team_logo: string;
  away_team_name: string;
  away_team_logo: string;
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

// Define API endpoints for competitions
const competitionEndpoints = {
  getAll: {
    url: '/competitions',
    method: 'GET'
  } as APIEndpoint<Competition[]>,

  getById: (id: number) => ({
    url: `/competitions/${id}`,
    method: 'GET'
  } as APIEndpoint<CompetitionDetailsResponse>),

  create: {
    url: '/competitions',
    method: 'POST'
  } as APIEndpoint<Competition>,

  update: (id: number) => ({
    url: `/competitions/${id}`,
    method: 'PATCH'
  } as APIEndpoint<Competition>),

  delete: (id: number) => ({
    url: `/competitions/${id}`,
    method: 'DELETE'
  } as APIEndpoint<void>),

  getBySport: (sport: string) => ({
    url: `/competitions?type=${sport}`,
    method: 'GET'
  } as APIEndpoint<Competition[]>),

  getActive: {
    url: '/competitions?status=active',
    method: 'GET'
  } as APIEndpoint<Competition[]>
};

// Get all competitions
export async function getCompetitions(): Promise<Competition[]> {
  try {
    // Get auth token from TokenManager
    const authToken = TokenManager.getToken();
    const response = await APIService.request(
      competitionEndpoints.getAll,
      undefined,
      undefined,
      { authToken: authToken || undefined }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch competitions');
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Get competition by ID with matches
export async function getCompetitionById(id: number): Promise<CompetitionDetailsResponse> {
  try {
    // Get auth token from TokenManager
    const authToken = TokenManager.getToken();
    const response = await APIService.request(
      competitionEndpoints.getById(id),
      undefined,
      undefined,
      { authToken: authToken || undefined }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch competition');
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Create a new competition
export async function createCompetition(data: CreateCompetitionData): Promise<Competition> {
  try {
    // Get auth token from TokenManager
    const authToken = TokenManager.getToken();
    const response = await APIService.request(
      competitionEndpoints.create,
      data,
      undefined,
      { authToken: authToken || undefined }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to create competition');
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Update competition
export async function updateCompetition(id: number, data: UpdateCompetitionData): Promise<Competition> {
  try {
    // Get auth token from TokenManager
    const authToken = TokenManager.getToken();
    const response = await APIService.request(
      competitionEndpoints.update(id),
      data,
      undefined,
      { authToken: authToken || undefined }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to update competition');
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Delete competition
export async function deleteCompetition(id: number): Promise<void> {
  try {
    // Get auth token from TokenManager
    const authToken = TokenManager.getToken();
    const response = await APIService.request(
      competitionEndpoints.delete(id),
      undefined,
      undefined,
      { authToken: authToken || undefined }
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete competition');
    }
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Get competitions by sport
export async function getCompetitionsBySport(sport: string): Promise<Competition[]> {
  try {
    // Get auth token from TokenManager
    const authToken = TokenManager.getToken();
    const response = await APIService.request(
      competitionEndpoints.getBySport(sport),
      undefined,
      undefined,
      { authToken: authToken || undefined }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch competitions by sport');
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Get active competitions
export async function getActiveCompetitions(): Promise<Competition[]> {
  try {
    // Get auth token from TokenManager
    const authToken = TokenManager.getToken();
    const response = await APIService.request(
      competitionEndpoints.getActive,
      undefined,
      undefined,
      { authToken: authToken || undefined }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch active competitions');
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}