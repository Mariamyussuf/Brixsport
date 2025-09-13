// Home Service
// Provides integration with the Home API endpoints

import BrixSportsService from '@/services/BrixSportsService';
import { APIResponse } from '@/types/api';
import { BrixSportsHomeData, Match } from '@/types/brixsports';

/**
 * Gets the home screen data including featured matches, upcoming matches, and recent results
 * @returns Promise resolving to HomeData object
 */
export const getHomeData = async (options?: { signal?: AbortSignal; authToken?: string }): Promise<APIResponse<BrixSportsHomeData>> => {
  return BrixSportsService.getHomeData(options);
};

/**
 * Gets matches filtered by sport type
 * @param sport Sport type to filter by
 * @returns Promise resolving to array of matches
 */
export const getMatchesBySport = async (sport: string, status?: string, options?: { signal?: AbortSignal; authToken?: string }): Promise<APIResponse<Match[]>> => {
  return BrixSportsService.getMatchesBySport(sport, status, options);
};