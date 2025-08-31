// Home Service
// Provides integration with the Home API endpoints

import { HomeAPI, HomeData, Match } from './api';

/**
 * Gets the home screen data including featured matches, upcoming matches, and recent results
 * @returns Promise resolving to HomeData object
 */
export const getHomeData = async (): Promise<HomeData> => {
  try {
    return await HomeAPI.getHomeData();
  } catch (error) {
    console.error('Failed to fetch home data:', error);
    
    // Return empty data structure on error
    return {
      featuredMatches: [],
      upcomingMatches: [],
      recentResults: []
    };
  }
};

/**
 * Gets matches filtered by sport type
 * @param sport Sport type to filter by
 * @returns Promise resolving to array of matches
 */
export const getMatchesBySport = async (sport: string): Promise<Match[]> => {
  try {
    return await HomeAPI.getMatchesBySport(sport);
  } catch (error) {
    console.error(`Failed to fetch matches for sport ${sport}:`, error);
    return [];
  }
};