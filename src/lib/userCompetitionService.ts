// User Competition Service
// Provides integration with the Competition API endpoints for regular users
import { databaseService } from '@/lib/databaseService';

// Competition interface
export interface Competition {
  id: number;
  name: string;
  type: string;
  category: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

/**
 * Gets all competitions
 * @returns Promise resolving to array of competitions
 * @throws Error if failed to fetch competitions
 */
export const getCompetitions = async (): Promise<Competition[]> => {
  try {
    // Get competitions from database service
    const competitions = await databaseService.getCompetitions();
    return competitions;
  } catch (error) {
    console.error('Failed to fetch competitions:', error);
    throw (error instanceof Error ? error : new Error('Failed to fetch competitions'));
  }
};

/**
 * Gets a competition by ID
 * @param id Competition ID
 * @returns Promise resolving to competition if found
 */
export const getCompetitionById = async (id: string): Promise<Competition> => {
  try {
    // Convert string ID to number for the database service
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new Error('Invalid competition ID');
    }
    
    // Get competition from database service
    const competition = await databaseService.getCompetitionById(numericId);
    if (!competition) {
      throw new Error('Competition not found');
    }
    return competition;
  } catch (error) {
    console.error(`Failed to fetch competition with ID ${id}:`, error);
    throw (error instanceof Error ? error : new Error('Failed to fetch competition'));
  }
};

export default {
  getCompetitions,
  getCompetitionById
};