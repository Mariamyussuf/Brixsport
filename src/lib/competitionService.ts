import APIService from '@/services/APIService';
import { APIEndpoint } from '@/types/api';
import { handleApiError } from '@/types/apiError';

export interface Competition {
  id: string;
  name: string;
  sport: string;
  startDate: string;
  endDate: string;
  status: string;
  assignedLoggers: string[];
  location: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCompetitionData {
  name: string;
  sport: string;
  startDate: string;
  endDate: string;
  location: string;
}

export interface UpdateCompetitionData {
  name?: string;
  sport?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  assignedLoggers?: string[];
  location?: string;
}

// Define API endpoints for competitions
const competitionEndpoints = {
  getAll: {
    url: '/competitions',
    method: 'GET'
  } as APIEndpoint<Competition[]>,

  getById: (id: string) => ({
    url: `/competitions/${id}`,
    method: 'GET'
  } as APIEndpoint<Competition>),

  create: {
    url: '/competitions',
    method: 'POST'
  } as APIEndpoint<Competition>,

  update: (id: string) => ({
    url: `/competitions/${id}`,
    method: 'PATCH'
  } as APIEndpoint<Competition>),

  delete: (id: string) => ({
    url: `/competitions/${id}`,
    method: 'DELETE'
  } as APIEndpoint<void>),

  getBySport: (sport: string) => ({
    url: `/competitions?sport=${sport}`,
    method: 'GET'
  } as APIEndpoint<Competition[]>),

  getActive: {
    url: '/competitions?status=ongoing',
    method: 'GET'
  } as APIEndpoint<Competition[]>
};

// Get all competitions
export async function getCompetitions(): Promise<Competition[]> {
  try {
    const response = await APIService.request(competitionEndpoints.getAll);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch competitions');
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Get competition by ID
export async function getCompetitionById(id: string): Promise<Competition> {
  try {
    const response = await APIService.request(competitionEndpoints.getById(id));
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
    const response = await APIService.request(competitionEndpoints.create, data);
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
export async function updateCompetition(id: string, data: UpdateCompetitionData): Promise<Competition> {
  try {
    const response = await APIService.request(competitionEndpoints.update(id), data);
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
export async function deleteCompetition(id: string): Promise<void> {
  try {
    const response = await APIService.request(competitionEndpoints.delete(id));
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
    const response = await APIService.request(competitionEndpoints.getBySport(sport));
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
    const response = await APIService.request(competitionEndpoints.getActive);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch active competitions');
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}