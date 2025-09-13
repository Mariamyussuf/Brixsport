import { useState, useEffect } from 'react';
import { getHomeData, getMatchesBySport } from '@/lib/homeService';
import { BrixSportsHomeData, Match as BrixMatch, TrackEvent as BrixTrackEvent } from '@/types/brixsports';

// Types for our home data
interface Match {
  id: number;
  competition_id: number;
  home_team_id: number;
  away_team_id: number;
  match_date: string;
  status: 'live' | 'scheduled' | 'completed';
  home_score: number | null;
  away_score: number | null;
  sport?: string;
}

interface FeaturedContent {
  title: string;
  description: string;
  image: string;
}

interface UserStats {
  favoriteTeams: number;
  followedCompetitions: number;
  upcomingMatches: number;
}

interface TrackEvent {
  id: number;
  name: string;
  status: 'live' | 'scheduled' | 'completed';
  start_time: string;
  results?: TrackResult[];
}

interface TrackResult {
  position: number;
  team_id: number;
  team_name: string;
  time?: string; // For timed events
  distance?: number; // For field events
}

interface HomeData {
  liveFootball: Match[];
  liveBasketball: Match[];
  trackEvents: TrackEvent[];
  upcomingFootball: Match[];
  featuredContent: FeaturedContent;
  userStats: UserStats;
}

// Helper function to convert BrixMatch to Match
const convertBrixMatchToMatch = (brixMatch: BrixMatch): Match => {
  // Map status values from BrixMatch to local Match interface
  let status: 'live' | 'scheduled' | 'completed';
  switch (brixMatch.status) {
    case 'live':
      status = 'live';
      break;
    case 'scheduled':
      status = 'scheduled';
      break;
    case 'completed':
    case 'finished':
    case 'ended':
      status = 'completed';
      break;
    default:
      status = 'scheduled'; // default fallback
  }

  return {
    id: parseInt(brixMatch.id, 10) || 0,
    competition_id: parseInt(brixMatch.competition_id, 10) || 0,
    home_team_id: parseInt(brixMatch.home_team_id, 10) || 0,
    away_team_id: parseInt(brixMatch.away_team_id, 10) || 0,
    match_date: brixMatch.match_date,
    status: status,
    home_score: brixMatch.home_score,
    away_score: brixMatch.away_score,
    sport: brixMatch.sport
  };
};

// Helper function to convert BrixTrackEvent to TrackEvent
const convertBrixTrackEventToTrackEvent = (brixTrackEvent: BrixTrackEvent): TrackEvent => {
  // Map status values from BrixTrackEvent to local TrackEvent interface
  let status: 'live' | 'scheduled' | 'completed';
  switch (brixTrackEvent.status) {
    case 'live':
      status = 'live';
      break;
    case 'scheduled':
      status = 'scheduled';
      break;
    case 'completed':
    case 'finished':
    case 'ended':
      status = 'completed';
      break;
    default:
      status = 'scheduled'; // default fallback
  }

  return {
    id: parseInt(brixTrackEvent.id, 10) || 0,
    name: brixTrackEvent.name || `Track Event ${brixTrackEvent.id}`,
    status: status,
    start_time: brixTrackEvent.start_time || new Date().toISOString(),
    results: Array.isArray(brixTrackEvent.results) ? brixTrackEvent.results.map(result => ({
      position: result.position,
      team_id: parseInt(result.team_id, 10) || 0,
      team_name: result.team_name,
      time: result.time,
      distance: result.distance
    })) : []
  };
};

export const useHomeData = () => {
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHomeData = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await getHomeData({ signal });
      if (response.success && response.data) {
        // Convert BrixHomeData to HomeData with safety checks
        const convertedData: HomeData = {
          liveFootball: (response.data.liveFootball || []).map(convertBrixMatchToMatch),
          liveBasketball: (response.data.liveBasketball || []).map(convertBrixMatchToMatch),
          trackEvents: (response.data.trackEvents || []).map(convertBrixTrackEventToTrackEvent),
          upcomingFootball: (response.data.upcomingFootball || []).map(convertBrixMatchToMatch),
          featuredContent: response.data.featuredContent || { title: '', description: '', image: '' },
          userStats: response.data.userStats || { favoriteTeams: 0, followedCompetitions: 0, upcomingMatches: 0 }
        };
        setHomeData(convertedData);
        setError(null);
      } else {
        // Handle specific error cases
        if (response.error?.message.includes('401')) {
          setError('Authentication required. Please log in to view this content.');
        } else {
          setError(response.error?.message || 'Failed to fetch home data');
        }
        console.error('API Error:', response.error || 'Unknown error occurred');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch home data';
      setError(errorMessage);
      console.error('Error fetching home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchHomeData(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  return { homeData, loading, error, refetch: fetchHomeData };
};

export const useSportMatches = (sport: string, status: string = 'all') => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async (signal?: AbortSignal) => {
    // Don't fetch if sport is empty
    if (!sport) {
      setMatches([]);
      setLoading(false);
      setError(null);
      return;
    }
    
    try {
      setLoading(true);
      const response = await getMatchesBySport(sport, status, { signal });
      if (response.success && response.data) {
        // Convert BrixMatch[] to Match[] with safety checks
        const convertedMatches = (response.data || []).map(convertBrixMatchToMatch);
        setMatches(convertedMatches);
        setError(null);
      } else {
        setError(response.error?.message || `Failed to fetch ${sport} matches`);
        console.error('API Error:', response.error || 'Unknown error occurred');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch ${sport} matches`;
      setError(errorMessage);
      console.error(`Error fetching ${sport} matches:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchMatches(controller.signal);

    return () => {
      controller.abort();
    };
  }, [sport, status]);

  return { matches, loading, error, refetch: fetchMatches };
};