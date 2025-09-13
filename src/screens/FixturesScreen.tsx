import React, { useState } from 'react';
import { Search, Bell, Clock, Play } from 'lucide-react';
import { useI18n } from '@/components/shared/I18nProvider';
import { useRouter } from 'next/navigation';
import MatchCard from '@/components/shared/MatchCard';
import TrackEventCard from '@/components/shared/TrackEventCard';
import { useHomeData, useSportMatches } from '@/hooks/useHomeData';
import { UI_Match } from '@/types/campus';

// No need to redefine the interfaces, we're using the exported ones

const FixturesScreen = () => {
  const { t } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'football' | 'basketball' | 'track'>('all');
  const [currentView, setCurrentView] = useState<'dashboard' | 'track'>('dashboard');
  
  // Data hooks
  const { homeData, loading: homeLoading, error: homeError } = useHomeData();
  const { matches: sportMatches, loading: matchesLoading, error: matchesError } = 
    useSportMatches(activeTab === 'all' ? '' : activeTab, 'all');

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
        team1: `Team ${match.home_team_id}`,
        team2: `Team ${match.away_team_id}`,
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
      event: trackEvent.name || `Track Event ${trackEvent.id}`,
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
        {/* Header */}
        <div className="bg-slate-800 dark:bg-slate-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-white text-2xl font-bold">{t('app_title')}</h1>
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Search className="w-6 h-6 text-white cursor-pointer" />
              <Bell className="w-6 h-6 text-white cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-4">
            {[t('track_events'), t('basketball'), t('football')].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (tab === t('track_events')) setCurrentView('track');
                  else setCurrentView('dashboard');
                }}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  tab === t('track_events')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

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
      {/* Header */}
      <div className="bg-slate-800 dark:bg-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-white text-2xl font-bold">{t('app_title')}</h1>
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Search className="w-6 h-6 text-white cursor-pointer" />
            <Bell className="w-6 h-6 text-white cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4">
          {[t('all'), t('football'), t('basketball'), t('track_events')].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === t('track_events')) {
                  setCurrentView('track');
                } else {
                  setActiveTab((tab === t('all') ? 'all' : tab === t('football') ? 'football' : tab === t('basketball') ? 'basketball' : 'track') as any);
                  setCurrentView('dashboard');
                }
              }}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                ((activeTab === 'all' && tab === t('all')) || (activeTab === 'football' && tab === t('football')) || (activeTab === 'basketball' && tab === t('basketball'))) && currentView === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

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
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{t('basketball_section')}</h2>
            <div className="space-y-4">
              {basketballMatches.map((match, index) => (
                <MatchCard key={`basketball-${index}`} match={match} isBasketball={true} />
              ))}
            </div>
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