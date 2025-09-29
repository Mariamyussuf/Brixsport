// User Match Service
// Provides integration with the Match API endpoints for regular users

import { databaseService } from '@/lib/databaseService';

// Match interface
export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  date: string;
  status: string;
  competitionId?: string;
  homeScore?: number;
  awayScore?: number;
  events?: MatchEvent[];
}

// Match Event interface
export interface MatchEvent {
  id: string;
  type: string;
  time: string;
  description: string;
  playerId?: string;
  teamId?: string;
}

/**
 * Gets all matches
 * @returns Promise resolving to array of matches
 */
export const getMatches = async (): Promise<Match[]> => {
  try {
    // Fetch matches from database service
    const dbMatches = await databaseService.getMatches();
    
    // Transform to Match type
    return dbMatches.map(match => ({
      id: match.id.toString(),
      homeTeam: match.home_team_name || `Home Team ${match.home_team_id}`,
      awayTeam: match.away_team_name || `Away Team ${match.away_team_id}`,
      venue: match.venue || '',
      date: match.match_date,
      status: match.status,
      competitionId: match.competition_id.toString(),
      homeScore: match.home_score,
      awayScore: match.away_score
    }));
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    return [];
  }
};

/**
 * Gets matches by competition ID
 * @param competitionId Competition ID
 * @returns Promise resolving to array of matches in the competition
 */
export const getMatchesByCompetition = async (competitionId: string): Promise<Match[]> => {
  try {
    // Fetch matches from database service
    const dbMatches = await databaseService.getMatchesByCompetition(parseInt(competitionId));
    
    // Transform to Match type
    return dbMatches.map(match => ({
      id: match.id.toString(),
      homeTeam: match.home_team_name || `Home Team ${match.home_team_id}`,
      awayTeam: match.away_team_name || `Away Team ${match.away_team_id}`,
      venue: match.venue || '',
      date: match.match_date,
      status: match.status,
      competitionId: match.competition_id.toString(),
      homeScore: match.home_score,
      awayScore: match.away_score
    }));
  } catch (error) {
    console.error(`Failed to fetch matches for competition ${competitionId}:`, error);
    return [];
  }
};

/**
 * Gets populated matches with competition and logger data
 * @returns Promise resolving to array of populated matches
 */
export const getPopulatedMatches = async (): Promise<any[]> => {
  try {
    // Fetch matches from database service
    const dbMatches = await databaseService.getMatches();
    
    // Transform to populated match format
    return dbMatches.map(match => ({
      id: match.id.toString(),
      homeTeam: match.home_team_name || `Home Team ${match.home_team_id}`,
      awayTeam: match.away_team_name || `Away Team ${match.away_team_id}`,
      venue: match.venue || '',
      date: match.match_date,
      status: match.status,
      competitionId: match.competition_id.toString(),
      homeScore: match.home_score,
      awayScore: match.away_score,
      competition: {
        id: match.competition_id,
        name: match.competition_name || 'Competition'
      }
    }));
  } catch (error) {
    console.error('Failed to fetch populated matches:', error);
    return [];
  }
};

/**
 * Gets a match by ID
 * @param id Match ID
 * @returns Promise resolving to match or null if not found
 */
export const getMatchById = async (id: string): Promise<Match | null> => {
  try {
    // Fetch matches from database service
    const dbMatches = await databaseService.getMatches();
    const dbMatch = dbMatches.find(m => m.id.toString() === id);
    
    if (!dbMatch) {
      return null;
    }
    
    // Transform to Match type
    return {
      id: dbMatch.id.toString(),
      homeTeam: dbMatch.home_team_name || `Home Team ${dbMatch.home_team_id}`,
      awayTeam: dbMatch.away_team_name || `Away Team ${dbMatch.away_team_id}`,
      venue: dbMatch.venue || '',
      date: dbMatch.match_date,
      status: dbMatch.status,
      competitionId: dbMatch.competition_id.toString(),
      homeScore: dbMatch.home_score,
      awayScore: dbMatch.away_score
    };
  } catch (error) {
    console.error(`Failed to fetch match with ID ${id}:`, error);
    return null;
  }
};

/**
 * Gets live matches
 * @returns Promise resolving to array of live matches
 */
export const getLiveMatches = async (): Promise<Match[]> => {
  try {
    // Fetch matches from database service
    const dbMatches = await databaseService.getMatches();
    
    // Filter for live matches
    const liveDbMatches = dbMatches.filter(match => match.status === 'live');
    
    // Transform to Match type
    return liveDbMatches.map(match => ({
      id: match.id.toString(),
      homeTeam: match.home_team_name || `Home Team ${match.home_team_id}`,
      awayTeam: match.away_team_name || `Away Team ${match.away_team_id}`,
      venue: match.venue || '',
      date: match.match_date,
      status: match.status,
      competitionId: match.competition_id.toString(),
      homeScore: match.home_score,
      awayScore: match.away_score
    }));
  } catch (error) {
    console.error('Failed to fetch live matches:', error);
    // Always return an empty array in case of error
    return [];
  }
};