'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, Clock, Star, Calendar, Trophy, ArrowLeft, Menu, X, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Favouritesscreen from './Favouritesscreen';
import LiveMatchesScreen from './LiveMatchesScreen';
import { useI18n } from '../shared/I18nProvider';
import { FavoritesAuthDialog } from '../shared/FavoritesAuthDialog';
import { CompetitionsAuthDialog } from '../shared/CompetitionsAuthDialog';
import { useAuth } from '@/hooks/useAuth';
import MatchCard from '../shared/MatchCard';
import TrackEventCard from '../shared/TrackEventCard';
import NotificationsBadge from '../shared/NotificationsBadge';
import { useHomeData, useSportMatches } from '@/hooks/useHomeData';
import CompetitionScreen from './CompetitionScreen';

import { 
  Match, 
  Team, 
  Player, 
  Tournament, 
  SportType, 
  TabType, 
  UI_TeamLogoProps,
  UI_TrackEvent,
  UI_TrackResult
} from '../../types/campus';

// Enhanced match interface for LiveScore-like functionality
interface UI_Match {
  id: string;
  status: 'Live' | 'Upcoming' | 'Finished';
  time: string;
  team1: string;
  team2: string;
  score1?: number;
  score2?: number;
  team1Color?: string;
  team2Color?: string;
  sportType?: SportType;
  competition_id?: string;
  competition_name?: string;
}

interface EnhancedMatch extends UI_Match {
  minute?: number;
  period?: string;
  venue?: string;
  temperature?: string;
  attendance?: number;
  isBookmarked?: boolean;
  liveEvents?: Array<{
    type: 'goal' | 'card' | 'substitution' | 'corner' | 'offside';
    time: string;
    player: string;
    team: 'home' | 'away';
  }>;
  odds?: {
    home: number;
    draw?: number;
    away: number;
  };
}

const Homescreen: React.FC = () => {
  const { t } = useI18n();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  // State management - enhanced with status and date filtering
  const [activeTab, setActiveTab] = useState<TabType>('Fixtures');
  const [activeSport, setActiveSport] = useState<SportType | 'all'>('all');
  const [activeStatus, setActiveStatus] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLiveMatches, setShowLiveMatches] = useState(false);
  const [showFavoritesDialog, setShowFavoritesDialog] = useState(false);
  const [showCompetitionsDialog, setShowCompetitionsDialog] = useState(false);
  
  // Data hooks from File B
  const { homeData, loading: homeLoading, error: homeError } = useHomeData();
  
  // Map SportType to API sport type
  const mapSportTypeToApiSport = (sportType: SportType | 'all'): 'football' | 'basketball' | 'track' | null => {
    switch (sportType) {
      case 'football':
        return 'football';
      case 'basketball':
        return 'basketball';
      case 'track_events':
        return 'track';
      default:
        return null;
    }
  };
  const mapStatusForAPI = (status: 'all' | 'live' | 'upcoming' | 'completed'): 'all' | 'live' | 'scheduled' | 'completed' => {
    switch (status) {
      case 'upcoming':
        return 'scheduled';
      case 'completed':
        return 'completed';
      case 'live':
        return 'live';
      default:
        return 'all';
    }
  };

  // Get sport matches only when activeSport is a valid sport type
  const apiSportType = mapSportTypeToApiSport(activeSport);
  
  const { matches: sportMatches, trackEvents: sportTrackEvents, loading: matchesLoading, error: matchesError } = 
    useSportMatches(
      apiSportType || 'football', 
      mapStatusForAPI(activeStatus)
    );

  // Enhanced conversion functions from File B
  const convertMatchToUI = (match: any): UI_Match => {
    // Handle API data structure with new fields
    if (match.home_team_id !== undefined) {
      return {
        id: match.id.toString(),
        status: match.status === 'live' || match.status === 'Live' ? 'Live' : 
                match.status === 'finished' || match.status === 'ended' || match.status === 'completed' ? 'Finished' : 
                'Upcoming',
        time: new Date(match.match_date).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: false 
        }),
        team1: match.home_team_name || `Team ${match.home_team_id}`,
        team2: match.away_team_name || `Team ${match.away_team_id}`,
        score1: match.status === 'live' || match.status === 'Live' || 
                match.status === 'finished' || match.status === 'ended' || 
                match.status === 'completed' ? match.home_score : undefined,
        score2: match.status === 'live' || match.status === 'Live' || 
                match.status === 'finished' || match.status === 'ended' || 
                match.status === 'completed' ? match.away_score : undefined,
        team1Color: match.home_team_logo ? '' : `bg-blue-600`,
        team2Color: match.away_team_logo ? '' : `bg-red-600`,
        sportType: 'football', // Default to football for now
        competition_id: match.competition_id,
        competition_name: match.competition_name
      };
    }
    
    // Handle fallback data structure from File A
    const team1 = match.teams[0];
    const team2 = match.teams[1];
    
    const team1Score = match.events
      .filter((e: any) => e.teamId === team1.id && ['goal', 'field_goal', 'three_pointer'].includes(e.eventType))
      .reduce((sum: number, e: any) => sum + (typeof e.value === 'number' ? e.value : 1), 0);
    
    const team2Score = match.events
      .filter((e: any) => e.teamId === team2.id && ['goal', 'field_goal', 'three_pointer'].includes(e.eventType))
      .reduce((sum: number, e: any) => sum + (typeof e.value === 'number' ? e.value : 1), 0);

    let timeDisplay = '';
    if (match.status === 'live' || match.status === 'Live') {
      const elapsedMinutes = Math.floor((Date.now() - match.startTime) / 60000);
      if (match.sportType === 'football') {
        timeDisplay = `${elapsedMinutes}'`;
      } else if (match.sportType === 'basketball') {
        const quarter = Math.floor(elapsedMinutes / 12) + 1;
        timeDisplay = `${quarter}${quarter === 1 ? 'st' : quarter === 2 ? 'nd' : quarter === 3 ? 'rd' : 'th'} Quarter`;
      }
    } else {
      const startTime = new Date(match.startTime);
      timeDisplay = startTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: false 
      });
    }

    return {
      id: match.id,
      status: match.status === 'live' || match.status === 'Live' ? 'Live' : 'Upcoming',
      time: timeDisplay,
      team1: team1.name,
      team2: team2.name,
      score1: match.status === 'live' || match.status === 'Live' ? team1Score : undefined,
      score2: match.status === 'live' || match.status === 'Live' ? team2Score : undefined,
      team1Color: `bg-blue-600`,
      team2Color: `bg-red-600`,
      sportType: match.sportType,
      competition_id: match.competition_id,
      competition_name: match.competition_name
    };
  };

  const convertTrackEventToUI = (trackEvent: any): any => {
    // Handle API data structure and convert to TrackEvent format expected by TrackEventCard
    let status: 'live' | 'scheduled' | 'ended' | 'Live' | 'Ended';
    switch (trackEvent.status) {
      case 'live':
        status = 'live';
        break;
      case 'completed':
      case 'finished':
      case 'ended':
        status = 'ended';
        break;
      default:
        status = 'scheduled';
        break;
    }
    
    return {
      status: status,
      event: trackEvent.event_name || `Track Event ${trackEvent.id}`,
      results: [] // Track events don't have results in this implementation
    };
  };

  const sortMatches = (matches: UI_Match[]): UI_Match[] => {
    return [...matches].sort((a, b) => {
      if (a.status === 'Live' && b.status !== 'Live') return -1;
      if (b.status === 'Live' && a.status !== 'Live') return 1;
      if (a.status === 'Upcoming' && b.status !== 'Upcoming' && b.status !== 'Live') return -1;
      if (b.status === 'Upcoming' && a.status !== 'Upcoming' && a.status !== 'Live') return 1;
      return 0;
    });
  };

  // Group matches by league with proper typing
  const groupMatchesByLeague = (matches: UI_Match[]): [string, UI_Match[]][] => {
    const grouped = matches.reduce<Record<string, UI_Match[]>>((acc, match) => {
      const league = match.competition_name || match.competition_id || 'Other';
      if (!acc[league]) {
        acc[league] = [];
      }
      acc[league].push(match);
      return acc;
    }, {});
    
    return Object.entries(grouped);
  };

  // Get and sort matches with live matches first, then by league and time
  const getFilteredMatches = (sportType: SportType): UI_Match[] => {
    let matches: UI_Match[] = [];
    
    // Get all matches from API
    if (sportType === 'football' && (homeData?.liveFootball || homeData?.upcomingFootball)) {
      matches = [
        ...(homeData?.liveFootball?.map(convertMatchToUI) || []),
        ...(homeData?.upcomingFootball?.map(convertMatchToUI) || [])
      ];
    } else if (sportType === 'basketball' && sportMatches?.length) {
      matches = sportMatches.map(convertMatchToUI);
    } else if (sportType === 'track_events' && sportTrackEvents?.length) {
      // Track events are handled separately
      return [];
    }
    
    // Sort matches: Live > Upcoming > Finished, then by league, then by time
    return [...matches].sort((a, b) => {
      // Status priority: Live > Upcoming > Finished
      const statusOrder = { 'Live': 0, 'Upcoming': 1, 'Finished': 2 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      
      if (statusDiff !== 0) return statusDiff;
      
      // For same status, sort by league name (competition_name or competition_id)
      const leagueA = a.competition_name || a.competition_id || '';
      const leagueB = b.competition_name || b.competition_id || '';
      const leagueCompare = leagueA.localeCompare(leagueB);
      
      if (leagueCompare !== 0) return leagueCompare;
      
      // For same league, sort by time (earlier first for live/upcoming, most recent first for finished)
      const timeA = a.time;
      const timeB = b.time;
      
      if (a.status === 'Finished') {
        // For finished matches, most recent first within the same league
        return timeA > timeB ? -1 : timeA < timeB ? 1 : 0;
      } else {
        // For live/upcoming matches, soonest first within the same league
        return timeA < timeB ? -1 : timeA > timeB ? 1 : 0;
      }
    });
  };

  const getAllLiveMatches = (): UI_Match[] => {
    // Try API data first
    if (homeData?.liveFootball && homeData.liveFootball.length > 0) {
      return homeData.liveFootball.map(convertMatchToUI);
    }
    
    return [];
  };

  const getTrackEvents = (): any[] => {
    // Try API data first
    if (homeData?.trackEvents && homeData.trackEvents.length > 0) {
      return homeData.trackEvents.map(convertTrackEventToUI);
    }
    
    // Use data from the sport matches hook if available
    if (activeSport === 'track_events' && sportTrackEvents && sportTrackEvents.length > 0) {
      return sportTrackEvents.map(convertTrackEventToUI);
    }
    
    return [];
  };

  const footballMatches = getFilteredMatches('football');
  const basketballMatches = activeSport === 'basketball' && sportMatches.length > 0 ? 
    sportMatches.map(convertMatchToUI) : 
    getFilteredMatches('basketball');
  const liveMatches = getAllLiveMatches();
  const trackEvents = getTrackEvents();

  const TeamLogo: React.FC<UI_TeamLogoProps> = ({ color }) => (
    <div className={`w-6 h-6 sm:w-8 sm:h-8 ${color} rounded-sm flex items-center justify-center flex-shrink-0`}>
      <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white dark:bg-gray-800 rounded-sm opacity-80"></div>
    </div>
  );

  // Enhanced tabs with counters from File B
  const tabs: { name: TabType; icon: React.ReactNode; badge?: number }[] = [
    { 
      name: 'Fixtures', 
      icon: <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
    },
    { 
      name: 'Favourites', 
      icon: <Star className="w-4 h-4 sm:w-5 sm:h-5" />
    },
    { 
      name: 'Competition', 
      icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
    },
    { 
      name: 'Profile', 
      icon: <User className="w-4 h-4 sm:w-5 sm:h-5" />
    }
  ];

  const sportTabs: (SportType | 'all')[] = ['all', 'football', 'basketball', 'track_events'];

  const handleTabClick = (tab: TabType): void => {
    if (tab === 'Favourites' && !isAuthenticated) {
      setShowFavoritesDialog(true);
      return;
    }
    
    if (tab === 'Competition' && !isAuthenticated) {
      setShowCompetitionsDialog(true);
      return;
    }
    
    if (tab === 'Profile') {
      router.push('/profile');
      return;
    }

    // Instead of redirecting to /fixtures, just set the active tab
    setActiveTab(tab);
    setMobileMenuOpen(false); 
  };

  const handleDemoAccount = () => {
    setShowFavoritesDialog(false);
    setActiveTab('Favourites');
  };

  const handleCompetitionsDemoAccount = () => {
    setShowCompetitionsDialog(false);
    setActiveTab('Competition');
  };

  const handleSportClick = (sport: SportType | 'all'): void => {
    setActiveSport(sport);
  };

  const handleSearchClick = (): void => {
    router.push('/search');
  };

  const handleNotificationClick = (): void => {
    router.push('/notifications');
  };

  const handleLiveClick = (): void => {
    // Filter to show only live matches when the LIVE button is clicked
    const liveMatches = getFilteredMatches(activeSport).filter(match => match.status === 'Live');
    
    if (liveMatches.length > 0) {
      // If there are live matches, navigate to a filtered view
      router.push('/live-matches');
    } else {
      // If no live matches, show a message or scroll to upcoming matches
      const upcomingSection = document.getElementById('upcoming-matches');
      if (upcomingSection) {
        upcomingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleBackFromLive = (): void => {
    router.push('/');
  };

  const getSportDisplayName = (sport: SportType | 'all'): string => {
    const displayNames = {
      'all': t('all'),
      'football': t('football'),
      'basketball': t('basketball'),
      'track_events': t('track_events'),
      'volleyball': 'Volleyball',
      'table_tennis': 'Table Tennis',
      'badminton': 'Badminton'
    } as const;
    return displayNames[sport];
  };

  if (showLiveMatches) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Redirecting to live matches...</p>
        </div>
      </div>
    );
  }

  // Loading state from File B
  if (homeLoading || matchesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-neutral-900 dark:text-neutral-100 pb-24 sm:pb-28">
      {/* Favorites Auth Dialog */}
      <FavoritesAuthDialog 
        isOpen={showFavoritesDialog} 
        onClose={() => setShowFavoritesDialog(false)} 
        onDemoAccount={handleDemoAccount}
      />
      
      {/* Competitions Auth Dialog */}
      <CompetitionsAuthDialog 
        isOpen={showCompetitionsDialog} 
        onClose={() => setShowCompetitionsDialog(false)} 
        onDemoAccount={handleCompetitionsDemoAccount}
      />
      
      {/* Enhanced Mobile Header - keeping File A's structure but adding File B's features */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white sticky top-0 z-30">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              {activeTab !== 'Fixtures' && (
                <button
                  onClick={() => handleTabClick('Fixtures')}
                  aria-label="Back"
                  className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                  type="button"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
                </button>
              )}
              <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">{t('app_title')}</h1>
                <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <button 
                className="px-3 py-1 bg-white dark:bg-gray-800 border border-red-500 rounded-full flex items-center space-x-1 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                onClick={handleLiveClick}
                type="button"
              >
                <span className="text-red-500 font-bold text-xs">
                  LIVE {homeData?.liveFootball?.length || liveMatches.length}
                </span>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </button>
              <button 
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Search"
                onClick={handleSearchClick}
                type="button"
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
              </button>
              <NotificationsBadge onClick={handleNotificationClick} />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
        {activeTab === 'Fixtures' && (
          <div className="mb-4 sm:mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" 
                 style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                 role="tablist">
              {sportTabs.map((sport) => (
                <button
                  key={sport}
                  onClick={() => handleSportClick(sport)}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-medium transition-all text-xs sm:text-sm whitespace-nowrap flex-shrink-0 touch-manipulation active:scale-95 ${
                    activeSport === sport
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                  role="tab"
                  aria-selected={activeSport === sport}
                >
                  {getSportDisplayName(sport)}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Fixtures' && activeSport !== 'track_events' && (
          <div className="mb-4 sm:mb-6">
            {liveMatches.length > 0 ? (
              <>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
                  Live Matches
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({liveMatches.length} ongoing)
                  </span>
                </h2>
                
                {/* Render live matches */}
                {getFilteredMatches(activeSport)
                  .filter(match => match.status === 'Live')
                  .map((match, index) => (
                    <MatchCard key={`live-${index}`} match={match} />
                  ))}
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                No live matches at the moment
              </p>
            )}
            
            {getFilteredMatches(activeSport).some(m => m.status === 'Upcoming') && (
              <>
                <h2 id="upcoming-matches" className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-6 mb-3">
                  Upcoming Matches
                </h2>
                
                {/* Group upcoming matches by league */}
                {groupMatchesByLeague(
                  getFilteredMatches(activeSport)
                    .filter((match: UI_Match) => match.status === 'Upcoming')
                ).map(([league, leagueMatches]: [string, UI_Match[]]) => (
                  <div key={league} className="mb-4">
                    <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">{league}</h3>
                    {leagueMatches.map((match: UI_Match, index: number) => (
                      <MatchCard key={`${league}-${index}`} match={match} />
                    ))}
                  </div>
                ))}
              </>
            )}
            
            {getFilteredMatches(activeSport).some(m => m.status === 'Finished') && (
              <>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mt-6 mb-3">
                  Recent Matches
                </h2>
                
                {/* Group finished matches by league */}
                {groupMatchesByLeague(
                  getFilteredMatches(activeSport)
                    .filter((match: UI_Match) => match.status === 'Finished')
                    .slice(0, 10) // Show only recent 10 matches
                ).map(([league, leagueMatches]: [string, UI_Match[]]) => (
                  <div key={`recent-${league}`} className="mb-4">
                    <h3 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">{league}</h3>
                    {leagueMatches.map((match: UI_Match, index: number) => (
                      <MatchCard key={`recent-${league}-${index}`} match={match} />
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        )}


        {/* Show API error if exists but don't block UI */}
        {homeError && (
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {homeError}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'Fixtures' && (
          <div className="space-y-6 sm:space-y-8">
            {(activeSport === 'all' || activeSport === 'football') && footballMatches.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 px-1">{t('football_section')}</h2>
                <div className="space-y-2 sm:space-y-3">
                  {footballMatches.map((match, index) => (
                    <MatchCard key={`football-fixture-${index}`} match={match} />
                  ))}
                </div>
              </section>
            )}

            {(activeSport === 'all' || activeSport === 'basketball') && basketballMatches.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 px-1">{t('basketball_section')}</h2>
                <div className="space-y-2 sm:space-y-3">
                  {basketballMatches.map((match, index) => (
                    <MatchCard key={`basketball-fixture-${index}`} match={match} isBasketball={true} />
                  ))}
                </div>
              </section>
            )}

            {(activeSport === 'all' || activeSport === 'track_events') && trackEvents.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 px-1">{t('track_events')}</h2>
                <div className="space-y-2 sm:space-y-3">
                  {trackEvents.map((event, index) => (
                    <TrackEventCard key={`track-fixture-${index}`} event={event} />
                  ))}
                </div>
              </section>
            )}

            {/* Show empty state if no matches */}
            {footballMatches.length === 0 && basketballMatches.length === 0 && trackEvents.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No matches found
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  No matches found for the selected sport.
                </p>
                <button
                  onClick={() => setActiveSport('all')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Show All Sports
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Favourites' && (
          <div>
            <Favouritesscreen activeSport={activeSport} />
          </div>
        )}

        {/* Competition Tab */}
        {activeTab === 'Competition' && (
          <section>
            <CompetitionScreen />
          </section>
        )}
        {activeTab === 'Profile' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700 w-full max-w-md">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="w-10 h-10 text-gray-500 dark:text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Profile</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Access your profile settings and preferences
                </p>
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  View Full Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Featured Content from File B - only show if API data is available */}
        {homeData?.featuredContent && homeData.featuredContent.title && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Featured</h2>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-2xl font-bold mb-2">{homeData.featuredContent.title}</h3>
              <p className="mb-4 opacity-90">{homeData.featuredContent.description}</p>
              <button className="bg-white text-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors">
                Learn More
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Enhanced Bottom Navigation - all badge counts removed as requested */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 backdrop-blur supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-slate-900/90 border-t border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2 z-20">
        <div className="flex justify-around items-center w-full max-w-7xl mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => handleTabClick(tab.name)}
              className={`flex flex-col items-center py-2 px-1 sm:px-2 rounded-lg transition-all min-w-0 flex-1 max-w-16 sm:max-w-20 md:max-w-24 touch-manipulation active:scale-95 ${
                activeTab === tab.name
                  ? 'text-blue-600'
                  : 'text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-white active:text-blue-500'
              }`}
              role="tab"
              aria-selected={activeTab === tab.name}
              aria-controls={`${tab.name.toLowerCase()}-panel`}
            >
              <div className="mb-0.5 sm:mb-1 relative">
                <div className="w-5 h-5 sm:w-6 sm:h-6">
                  {tab.icon}
                </div>
                {activeTab === tab.name && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full"></div>
                )}
              </div>
              <span className="text-xs font-medium leading-tight text-center truncate">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -webkit-overflow-scrolling: touch;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @media (max-width: 640px) {
          .touch-manipulation {
            touch-action: manipulation;
          }
        }
      `}</style>
    </div>
  );
};

export default Homescreen;