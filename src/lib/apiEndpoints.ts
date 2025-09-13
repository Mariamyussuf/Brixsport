import { APIEndpoint } from '@/types/api';
import { BrixSportsHomeData, Match, TrackEvent } from '@/types/brixsports';

// Data transformation function for match data
const transformMatchData = (data: any): Match => ({
  id: data.id,
  competition_id: data.competition_id,
  home_team_id: data.home_team_id,
  away_team_id: data.away_team_id,
  match_date: data.match_date,
  status: data.status,
  home_score: data.home_score,
  away_score: data.away_score,
  sport: data.sport
});

// Data transformation function for track event data
const transformTrackEventData = (data: any): TrackEvent => ({
  id: data.id,
  name: data.name,
  status: data.status,
  start_time: data.start_time,
  results: Array.isArray(data.results) ? data.results.map((result: any) => ({
    position: result.position,
    team_id: result.team_id,
    team_name: result.team_name,
    time: result.time,
    distance: result.distance
  })) : []
});

// Data transformation function for home data
const transformHomeData = (data: any): BrixSportsHomeData => ({
  liveFootball: Array.isArray(data.liveFootball)
    ? data.liveFootball.map(transformMatchData)
    : [],
  liveBasketball: Array.isArray(data.liveBasketball)
    ? data.liveBasketball.map(transformMatchData)
    : [],
  trackEvents: Array.isArray(data.trackEvents)
    ? data.trackEvents.map(transformTrackEventData)
    : [],
  // Provide safe defaults for fields that may be missing from the upstream
  // API so TypeScript consumers have a stable shape to work with.
  upcomingFootball: Array.isArray(data.upcomingFootball)
    ? data.upcomingFootball.map(transformMatchData)
    : [],
  featuredContent: data.featuredContent || { title: '', description: '', image: '' },
  userStats: data.userStats || { favoriteTeams: 0, followedCompetitions: 0, upcomingMatches: 0 },
});

export const homeEndpoints = {
  getHomeData: {
    url: '/home',
    method: 'GET',
    transform: transformHomeData,
  } as APIEndpoint<BrixSportsHomeData>,

  getMatchesBySport: (sport: string) => ({
    url: `/home/matches/${sport}`,
    method: 'GET',
    transform: (data: any) => {
      // Handle the response format from the local API route
      if (data.data && Array.isArray(data.data.matches)) {
        return data.data.matches.map(transformMatchData);
      }
      // Fallback for direct array response
      if (Array.isArray(data)) {
        return data.map(transformMatchData);
      }
      // Empty array fallback
      return [];
    },
  } as APIEndpoint<Match[]>),
};