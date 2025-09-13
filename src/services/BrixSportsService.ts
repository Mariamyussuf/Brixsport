import APIService from './APIService';
import { homeEndpoints } from '@/lib/apiEndpoints';
import { APIResponse } from '@/types/api';
import { BrixSportsHomeData, Match } from '@/types/brixsports';

class BrixSportsService {
  async getHomeData(options?: { signal?: AbortSignal; authToken?: string }): Promise<APIResponse<BrixSportsHomeData>> {
    return APIService.request(homeEndpoints.getHomeData, undefined, undefined, options);
  }

  async getMatchesBySport(
    sport: string,
    status?: string,
    options?: { signal?: AbortSignal; authToken?: string }
  ): Promise<APIResponse<Match[]>> {
    // Use the fallback approach directly since the specific endpoint is not working
    try {
      const homeResponse = await this.getHomeData(options);
      
      if (homeResponse.success && homeResponse.data) {
        let matches: Match[] = [];
        switch (sport) {
          case 'football':
            matches = homeResponse.data.liveFootball || [];
            break;
          case 'basketball':
            matches = homeResponse.data.liveBasketball || [];
            break;
          case 'track':
            // For track events, we need to convert TrackEvent[] to Match[]
            const trackEvents = homeResponse.data.trackEvents || [];
            matches = trackEvents.map(trackEvent => ({
              id: trackEvent.id,
              competition_id: 0, // Default value
              home_team_id: 0, // Default value
              away_team_id: 0, // Default value
              match_date: trackEvent.start_time || new Date().toISOString(),
              status: trackEvent.status,
              home_score: null,
              away_score: null,
              sport: 'track'
            }));
            break;
          default:
            matches = [];
        }
        return { success: true, data: matches };
      }
      
      return { success: false, error: { message: `Failed to fetch ${sport} matches` } };
    } catch (error) {
      return { success: false, error: { message: `Failed to fetch ${sport} matches: ${error}` } };
    }
  }
}

export default new BrixSportsService();