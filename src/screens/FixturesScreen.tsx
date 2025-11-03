import React, { useState } from 'react';
import { Search, Bell, Clock, Play } from 'lucide-react';
import { useI18n } from '@/components/shared/I18nProvider';
import { useRouter } from 'next/navigation';
import MatchCard from '@/components/shared/MatchCard';
import TrackEventCard from '@/components/shared/TrackEventCard';
import { useHomeData, useSportMatches } from '@/hooks/useHomeData';
import { UI_Match } from '@/types/campus';
import BasketballSchedule from '@/components/BasketballSchedule';
import { useBasketballSchedule } from '@/hooks/useBasketballSchedule';

// No need to redefine the interfaces, we're using the exported ones

const FixturesScreen = () => {
  const { t } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'football' | 'basketball' | 'track'>('all');
  const [currentView, setCurrentView] = useState<'dashboard' | 'track'>('dashboard');
  
  // Data hooks
  const { homeData, loading: homeLoading, error: homeError } = useHomeData();
  // Only fetch sport matches when activeTab is not 'all'
  const { matches: sportMatches, loading: matchesLoading, error: matchesError } = 
    useSportMatches(activeTab !== 'all' ? activeTab : 'football', 'all');
  
  // Basketball schedule hook
  const { schedule: basketballSchedule, loading: basketballLoading, error: basketballError } = useBasketballSchedule();

  // Enhanced conversion functions
  const convertMatchToUI = (match: any): UI_Match => {
    // Handle API data structure
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
        team1Color: `bg-blue-600`,
        team2Color: `bg-red-600`,
        sportType: match.sportType || 'football'
      };
    }
    
    // Handle fallback data structure
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
      sportType: match.sportType
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
      event: trackEvent.event_name || trackEvent.name || `Track Event ${trackEvent.id}`,
      results: Array.isArray(trackEvent.results) ? trackEvent.results.map((result: any) => ({
        position: `${result.position}.`,
        team: result.team_name || `Team ${result.team_id}`
      })) : []
    };
  };

  // Get data with fallback logic
  const getFilteredMatches = (sportType: 'football' | 'basketball'): UI_Match[] => {
    let matches: UI_Match[] = [];
    
    // Try to use API data first
    if (homeData?.liveFootball || homeData?.upcomingFootball) {
      if (sportType === 'football') {
        matches = [
          ...(homeData?.liveFootball?.map(convertMatchToUI) || []),
          ...(homeData?.upcomingFootball?.map(convertMatchToUI) || [])
        ];
      } else if (sportMatches && sportMatches.length > 0) {
        matches = sportMatches.map(convertMatchToUI);
      }
    }
    
    return matches;
  };

  const getTrackEvents = (): any[] => {
    // Try API data first
    if (homeData?.trackEvents && homeData.trackEvents.length > 0) {
      return homeData.trackEvents.map(convertTrackEventToUI);
    }
    
    return [];
  };

  const footballMatches = getFilteredMatches('football');
  const basketballMatches = getFilteredMatches('basketball');
  const trackEvents = getTrackEvents();

  // Loading state
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

  if (currentView === 'track') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Track Events Content */}
        <div className="px-6 py-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{t('current_competition_fixtures')}</h2>
          
          <div className="text-center text-gray-600 dark:text-gray-400 font-medium mb-6">
            {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
          </div>

          <div className="space-y-4">
            {trackEvents.map((event: any, index: number) => (
              <TrackEventCard key={`track-${index}`} event={event} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="px-6 py-6 space-y-8">
        {/* Football Section */}
        {(activeTab === 'all' || activeTab === 'football') && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{t('football_section')}</h2>
            <div className="space-y-4">
              {footballMatches.map((match, index) => (
                <MatchCard key={`football-${index}`} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* Basketball Section */}
        {(activeTab === 'all' || activeTab === 'basketball') && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('basketball_section')}</h2>
              <button 
                onClick={() => router.push('/basketball-schedule')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center"
              >
                View Full Schedule
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            {activeTab === 'basketball' ? (
              // Show full basketball schedule when basketball tab is selected
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                {basketballLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : basketballError ? (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                    <p className="text-red-700 dark:text-red-300">{basketballError}</p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      Retry
                    </button>
                  </div>
                ) : basketballSchedule && basketballSchedule.length > 0 ? (
                  <BasketballSchedule rounds={basketballSchedule} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No basketball schedule available</p>
                  </div>
                )}
              </div>
            ) : (
              // Show preview of basketball matches when in "all" tab
              <div className="space-y-4">
                {basketballMatches.map((match, index) => (
                  <MatchCard key={`basketball-${index}`} match={match} isBasketball={true} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Track Events Preview */}
        {activeTab === 'all' && trackEvents.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{t('track_events')}</h2>
            {trackEvents.slice(0, 2).map((event: any, index: number) => (
              <TrackEventCard key={`track-preview-${index}`} event={event} />
            ))}
            <button
              onClick={() => setCurrentView('track')}
              className="mt-4 text-blue-600 dark:text-blue-500 hover:text-blue-800 dark:hover:text-blue-400 font-medium"
            >
              {t('view_all_track_events')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FixturesScreen;