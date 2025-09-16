// User Competition Service
// Provides integration with the Competition API endpoints for regular users

import APIService from '@/services/APIService';
import { APIEndpoint } from '@/types/api';
import { TokenManager } from '@/hooks/useAuth';

// Competition interface
export interface Competition {
  id: number;
  name: string;
  type: string;
  category: string;
  status: string;
  start_date: string;
  end_date: string;
}

// Define API endpoints for user competitions
const userCompetitionEndpoints = {
  getAll: {
    url: '/user/competitions',
    method: 'GET' as const
  } as APIEndpoint<Competition[]>,

  getById: (id: string) => ({
    url: `/user/competitions/${id}`,
    method: 'GET' as const
  } as APIEndpoint<Competition>),
};

/**
 * Gets all competitions
 * @returns Promise resolving to array of competitions
 */
export const getCompetitions = async (): Promise<Competition[]> => {
  try {
    // Get auth token from TokenManager
    const authToken = TokenManager.getToken();
    
    const response = await APIService.request(
      userCompetitionEndpoints.getAll,
      undefined,
      undefined,
      { authToken: authToken || undefined }
    );
    
    if (response.success && Array.isArray(response.data)) {
      return response.data || [];
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch competitions:', error);
    return [];
  }
};

/**
 * Gets a competition by ID
 * @param id Competition ID
 * @returns Promise resolving to competition or null if not found
 */
export const getCompetitionById = async (id: string): Promise<Competition | null> => {
  try {
    // Get auth token from TokenManager
    const authToken = TokenManager.getToken();
    
    const response = await APIService.request(
      userCompetitionEndpoints.getById(id),
      undefined,
      undefined,
      { authToken: authToken || undefined }
    );
    
    if (response.success && response.data) {
      return response.data || null;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch competition with ID ${id}:`, error);
    return null;
  }
};

export default {
  getCompetitions,
  getCompetitionById
};