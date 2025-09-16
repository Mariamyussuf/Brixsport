import { useState, useEffect } from 'react';
import { getHomeData, getMatchesBySport, getLiveMatches } from '@/lib/homeService';
import { BrixSportsHomeData, Match as BrixMatch, TrackEvent as BrixTrackEvent, LiveMatchesResponse } from '@/types/brixsports';
import { TokenManager } from '@/hooks/useAuth';

// Types for our home data
interface Match {
  id: number;
  competition_id: number;
  home_team_id: number;
  away_team_id: number;
  match_date: string;
  venue: string | null;
  status: 'live' | 'scheduled' | 'completed';
  home_score: number;
  away_score: number;
  current_minute: number;
  period: string | null;
  home_team_name: string;
  home_team_logo: string;
  away_team_name: string;
  away_team_logo: string;
  competition_name: string;
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
  competition_id: number;
  event_name: string;
  event_type: string;
  gender: string;
  scheduled_time: string;
  status: string;
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
  return {
    id: brixMatch.id,
    competition_id: brixMatch.competition_id,
    home_team_id: brixMatch.home_team_id,
    away_team_id: brixMatch.away_team_id,
    match_date: brixMatch.match_date,
    venue: brixMatch.venue,
    status: brixMatch.status as 'live' | 'scheduled' | 'completed',
    home_score: brixMatch.home_score,
    away_score: brixMatch.away_score,
    current_minute: brixMatch.current_minute,
    period: brixMatch.period,
    home_team_name: `Home Team ${brixMatch.home_team_id}`,
    home_team_logo: '',
    away_team_name: `Away Team ${brixMatch.away_team_id}`,
    away_team_logo: '',
    competition_name: 'Competition'
  };
};

// Helper function to convert BrixTrackEvent to TrackEvent
const convertBrixTrackEventToTrackEvent = (brixTrackEvent: BrixTrackEvent): TrackEvent => {
  return {
    id: brixTrackEvent.id,
    competition_id: brixTrackEvent.competition_id,
    event_name: brixTrackEvent.event_name,
    event_type: brixTrackEvent.event_type,
    gender: brixTrackEvent.gender,
    scheduled_time: brixTrackEvent.scheduled_time,
    status: brixTrackEvent.status
  };
};

export const useHomeData = () => {
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHomeData = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      // Get auth token from TokenManager
      const authToken = TokenManager.getToken();
      const response = await getHomeData({ signal, authToken: authToken || undefined });
      if (response.success && response.data) {
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

export const useSportMatches = (
  sport: 'football' | 'basketball' | 'track', 
  status: 'all' | 'live' | 'scheduled' | 'completed' = 'all'
) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [trackEvents, setTrackEvents] = useState<TrackEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async (signal?: AbortSignal) => {
    // Don't fetch if sport is empty
    if (!sport) {
      setMatches([]);
      setTrackEvents([]);
      setLoading(false);
      setError(null);
      return;
    }
    
    try {
      setLoading(true);
      // Get auth token from TokenManager
      const authToken = TokenManager.getToken();
      const response = await getMatchesBySport(sport, status, { signal, authToken: authToken || undefined });
      if (response.success && response.data) {
        // Handle different data types based on sport
        if (sport === 'track' && Array.isArray(response.data)) {
          // For track events, convert to TrackEvent[]
          const convertedEvents = (response.data || []).map((item: any) => convertBrixTrackEventToTrackEvent(item as BrixTrackEvent));
          setTrackEvents(convertedEvents);
          setMatches([]); // Clear matches
        } else if (Array.isArray(response.data)) {
          // For football/basketball, convert to Match[]
          const convertedMatches = (response.data || []).map((item: any) => convertBrixMatchToMatch(item as BrixMatch));
          setMatches(convertedMatches);
          setTrackEvents([]); // Clear track events
        } else {
          setMatches([]);
          setTrackEvents([]);
        }
        setError(null);
      } else {
        setError(response.error?.message || `Failed to fetch ${sport} matches`);
        console.error('API Error:', response.error || 'Unknown error occurred');
        // Clear data on error
        setMatches([]);
        setTrackEvents([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch ${sport} matches`;
      setError(errorMessage);
      console.error(`Error fetching ${sport} matches:`, err);
      // Clear data on error
      setMatches([]);
      setTrackEvents([]);
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

  return { matches, trackEvents, loading, error, refetch: fetchMatches };
};

export const useLiveMatches = () => {
  const [liveMatches, setLiveMatches] = useState<LiveMatchesResponse>({
    football: [],
    basketball: [],
    track: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveMatches = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      // Get auth token from TokenManager
      const authToken = TokenManager.getToken();
      const response = await getLiveMatches({ signal, authToken: authToken || undefined });
      if (response.success && response.data) {
        // Convert BrixLiveMatchesResponse to LiveMatchesResponse
        const convertedData: LiveMatchesResponse = {
          football: (response.data.football || []).map(convertBrixMatchToMatch),
          basketball: (response.data.basketball || []).map(convertBrixMatchToMatch),
          track: (response.data.track || []).map(convertBrixTrackEventToTrackEvent)
        };
        setLiveMatches(convertedData);
        setError(null);
      } else {
        setError(response.error?.message || 'Failed to fetch live matches');
        console.error('API Error:', response.error || 'Unknown error occurred');
        // Clear data on error
        setLiveMatches({
          football: [],
          basketball: [],
          track: []
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch live matches';
      setError(errorMessage);
      console.error('Error fetching live matches:', err);
      // Clear data on error
      setLiveMatches({
        football: [],
        basketball: [],
        track: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchLiveMatches(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  return { liveMatches, loading, error, refetch: fetchLiveMatches };
};