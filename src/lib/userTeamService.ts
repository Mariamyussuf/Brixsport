// User Team Service
// Provides integration with the Team API endpoints for regular users

import { databaseService } from '@/lib/databaseService';
import { Team as UserTeam } from '@/lib/api';

// Team interface (matching the one from matchEvents for consistency)
export interface Team {
  id: string;
  name: string;
  logoUrl: string;
  coachName: string;
  players: Player[];
}

// Player interface (matching the one from matchEvents for consistency)
export interface Player {
  id: string;
  teamId: string;
  name: string;
  jerseyNumber: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  status: 'on-field' | 'substituted' | 'injured';
}

/**
 * Gets all teams
 * @returns Promise resolving to array of teams
 */
export const getTeams = async (): Promise<UserTeam[]> => {
  try {
    // Fetch teams from database service
    const dbTeams = await databaseService.getTeams();
    
    // Transform to UserTeam type
    return dbTeams.map(team => ({
      id: team.id.toString(),
      name: team.name,
      logo: team.logo || ''
    }));
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return [];
  }
};

/**
 * Gets teams by competition ID
 * @param competitionId Competition ID
 * @returns Promise resolving to array of teams in the competition
 */
export const getTeamsByCompetition = async (competitionId: string): Promise<Team[]> => {
  try {
    // Fetch teams from database service
    const dbTeams = await databaseService.getTeams();
    
    // For now, return all teams since we don't have competition-team relationships in the database
    // In a real implementation, you would filter by competition
    return dbTeams.map(team => ({
      id: team.id.toString(),
      name: team.name,
      logoUrl: team.logo || '',
      coachName: 'Coach Name',
      players: [] // Empty players array for now
    }));
  } catch (error) {
    console.error(`Failed to fetch teams for competition ${competitionId}:`, error);
    return [];
  }
};

/**
 * Gets a team by ID
 * @param id Team ID
 * @returns Promise resolving to team or null if not found
 */
export const getTeamById = async (id: string): Promise<Team | null> => {
  try {
    // Fetch teams from database service
    const dbTeams = await databaseService.getTeams();
    const dbTeam = dbTeams.find(t => t.id.toString() === id);
    
    if (!dbTeam) {
      return null;
    }
    
    // Transform to Team type
    return {
      id: dbTeam.id.toString(),
      name: dbTeam.name,
      logoUrl: dbTeam.logo || '',
      coachName: 'Coach Name',
      players: [] // Empty players array for now
    };
  } catch (error) {
    console.error(`Failed to fetch team with ID ${id}:`, error);
    return null;
  }
};

export default {
  getTeams,
  getTeamsByCompetition,
  getTeamById
};