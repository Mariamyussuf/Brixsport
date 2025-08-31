// Competitions Service
// Provides integration with the Competitions API endpoints

import { CompetitionsAPI, Competition } from './api';
import { 
  filterCompetitionsByType, 
  filterCompetitionsByCategory,
  filterCompetitionsByStatus, 
  sortCompetitionsByNewest 
} from './apiUtils';

/**
 * Gets all competitions, optionally filtered and sorted
 * @param options Optional filtering and sorting options
 * @returns Promise resolving to array of competitions
 */
export const getCompetitions = async (options?: {
  type?: string;
  category?: string;
  status?: string;
  sortByNewest?: boolean;
}): Promise<Competition[]> => {
  try {
    // Get all competitions
    let competitions = await CompetitionsAPI.getAll();
    
    // Apply filters if provided
    if (options?.type) {
      competitions = filterCompetitionsByType(competitions, options.type);
    }
    
    if (options?.category) {
      competitions = filterCompetitionsByCategory(competitions, options.category);
    }
    
    if (options?.status) {
      competitions = filterCompetitionsByStatus(competitions, options.status);
    }
    
    // Apply sorting if requested
    if (options?.sortByNewest) {
      competitions = sortCompetitionsByNewest(competitions);
    }
    
    return competitions;
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
    return await CompetitionsAPI.getById(id);
  } catch (error) {
    console.error(`Failed to fetch competition with ID ${id}:`, error);
    return null;
  }
};

/**
 * Creates a new competition
 * @param competitionData Competition data
 * @returns Promise resolving to created competition
 */
export const createCompetition = async (
  competitionData: Omit<Competition, 'id' | 'created_at'>
): Promise<Competition> => {
  try {
    return await CompetitionsAPI.create(competitionData);
  } catch (error) {
    console.error('Failed to create competition:', error);
    throw error;
  }
};

/**
 * Gets active competitions
 * @returns Promise resolving to array of active competitions
 */
export const getActiveCompetitions = async (): Promise<Competition[]> => {
  return getCompetitions({ status: 'active', sortByNewest: true });
};