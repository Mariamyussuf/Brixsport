// Home Service
// Provides integration with the Home API endpoints

import BrixSportsService from '@/services/BrixSportsService';
import { APIResponse } from '@/types/api';
import { BrixSportsHomeData, Match, TrackEvent, LiveMatchesResponse } from '@/types/brixsports';

/**
 * Gets the home screen data including featured matches, upcoming matches, and recent results
 * @returns Promise resolving to HomeData object
 */
export const getHomeData = async (options?: { signal?: AbortSignal; authToken?: string }): Promise<APIResponse<BrixSportsHomeData>> => {
  try {
    const response = await BrixSportsService.getHomeData(options);
    
    // Validate response structure
    if (response.success && response.data) {
      // Ensure all arrays default to empty arrays if missing
      const validatedData: BrixSportsHomeData = {
        liveFootball: Array.isArray(response.data.liveFootball) ? response.data.liveFootball : [],
        upcomingFootball: Array.isArray(response.data.upcomingFootball) ? response.data.upcomingFootball : [],
        liveBasketball: Array.isArray(response.data.liveBasketball) ? response.data.liveBasketball : [],
        trackEvents: Array.isArray(response.data.trackEvents) ? response.data.trackEvents : [],
        featuredContent: response.data.featuredContent || {},
        userStats: response.data.userStats || {}
      };
      
      return {
        success: true,
        data: validatedData
      };
    }
    
    return response;
  } catch (error) {
    console.error('Error in getHomeData:', error);
    // Include error code for better debugging
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch home data';
    
    return {
      success: false,
      error: {
        message: errorMessage,
        code: 'FETCH_HOME_DATA_ERROR'
      }
    };
  }
};

/**
 * Gets matches filtered by sport type and status
 * @param sport Sport type to filter by (football, basketball, track)
 * @param status Status to filter by (all, live, scheduled, completed)
 * @returns Promise resolving to array of matches or track events
 */
export const getMatchesBySport = async (
  sport: 'football' | 'basketball' | 'track', 
  status: 'all' | 'live' | 'scheduled' | 'completed' = 'all', 
  options?: { signal?: AbortSignal; authToken?: string }
): Promise<APIResponse<Match[] | TrackEvent[]>> => {
  try {
    const response = await BrixSportsService.getMatchesBySport(sport, status, options);
    
    // Validate response structure
    if (response.success && response.data) {
      // Return the data as-is since it's already properly typed
      return response as APIResponse<Match[] | TrackEvent[]>;
    }
    
    // Return empty array as fallback
    return {
      success: true,
      data: []
    };
  } catch (error) {
    console.error(`Error in getMatchesBySport for ${sport} with status ${status}:`, error);
    // Include error code for better debugging
    const errorMessage = error instanceof Error ? error.message : `Failed to fetch ${sport} matches`;
    
    return {
      success: false,
      error: {
        message: errorMessage,
        code: 'FETCH_MATCHES_BY_SPORT_ERROR'
      }
    };
  }
};

/**
 * Gets live matches grouped by sport
 * @returns Promise resolving to LiveMatchesResponse object with football, basketball, and track arrays
 */
export const getLiveMatches = async (options?: { signal?: AbortSignal; authToken?: string }): Promise<APIResponse<LiveMatchesResponse>> => {
  try {
    const response = await BrixSportsService.getLiveMatches(options);
    
    // Validate response structure
    if (response.success && response.data) {
      // Ensure all arrays default to empty arrays if missing
      const validatedData: LiveMatchesResponse = {
        football: Array.isArray(response.data.football) ? response.data.football : [],
        basketball: Array.isArray(response.data.basketball) ? response.data.basketball : [],
        track: Array.isArray(response.data.track) ? response.data.track : []
      };
      
      return {
        success: true,
        data: validatedData
      };
    }
    
    // Return empty groups as fallback
    return {
      success: true,
      data: {
        football: [],
        basketball: [],
        track: []
      }
    };
  } catch (error) {
    console.error('Error in getLiveMatches:', error);
    // Include error code for better debugging
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch live matches';
    
    return {
      success: false,
      error: {
        message: errorMessage,
        code: 'FETCH_LIVE_MATCHES_ERROR'
      }
    };
  }
};