'use client';

import React, { useState } from 'react';
import { Search, Bell, Clock, Star, Calendar, Trophy, ArrowLeft, Menu, X, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Favouritesscreen from './Favouritesscreen';
import LiveMatchesScreen from './LiveMatchesScreen';
import { useI18n } from '../shared/I18nProvider';
import { FavoritesAuthDialog } from '../shared/FavoritesAuthDialog';
import { CompetitionsAuthDialog } from '../shared/CompetitionsAuthDialog'; // Added import
import { useAuth } from '@/hooks/useAuth'; // Added import for useAuth

import { 
  Match, 
  Team, 
  Player, 
  Tournament, 
  SportType, 
  TabType, 
  UI_TeamLogoProps, 
  UI_MatchCardProps, 
  UI_TrackEventCardProps,
  UI_Match,
  UI_TrackEvent,
  UI_TrackResult
} from '../../types/campus';

const Homescreen: React.FC = () => {
  const { t } = useI18n();
  const router = useRouter();
  const { isAuthenticated } = useAuth(); // Using proper auth hook
  const [activeTab, setActiveTab] = useState<TabType>('Fixtures');
  const [activeSport, setActiveSport] = useState<SportType | 'all'>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLiveMatches, setShowLiveMatches] = useState(false);
  const [showFavoritesDialog, setShowFavoritesDialog] = useState(false);
  const [showCompetitionsDialog, setShowCompetitionsDialog] = useState(false); // Added state for competitions dialog
  // Removed the old isAuthed check since we're using the proper hook now

  const tabs: { name: TabType; icon: React.ReactNode }[] = [
    { name: 'Fixtures', icon: <Calendar className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { name: 'Favourites', icon: <Star className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { name: 'Competition', icon: <Trophy className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { name: 'Profile', icon: <User className="w-4 h-4 sm:w-5 sm:h-5" /> }
  ];

  const sportTabs: (SportType | 'all')[] = ['all', 'football', 'basketball', 'track_events'];

  const teams: Team[] = [
    {
      id: 'team-1',
      name: 'Pirates FC',
      color: '#2563eb',
      players: []
    },
    {
      id: 'team-2',
      name: 'Joga FC',
      color: '#dc2626',
      players: []
    },
    {
      id: 'team-3',
      name: 'Los Blancos',
      color: '#2563eb',
      players: []
    },
    {
      id: 'team-4',
      name: 'La Masia',
      color: '#dc2626',
      players: []
    },
    {
      id: 'team-5',
      name: 'Spartans',
      color: '#dc2626',
      players: []
    },
    {
      id: 'team-6',
      name: 'Kings FC',
      color: '#2563eb',
      players: []
    },
    {
      id: 'team-7',
      name: 'Phoenix',
      color: '#2563eb',
      players: []
    },
    {
      id: 'team-8',
      name: 'Blazers',
      color: '#dc2626',
      players: []
    }
  ];

  const matches: Match[] = [
    {
      id: 'match-1',
      sportType: 'football',
      teams: [
        teams.find(t => t.id === 'team-1')!,
        teams.find(t => t.id === 'team-2')!
      ],
      startTime: Date.now() - 4260000,
      status: 'live',
      events: [
        {
          id: 'event-1',
          matchId: 'match-1',
          teamId: 'team-2',
          eventType: 'goal',
          timestamp: Date.now() - 1800000,
          value: 1
        }
      ]
    },
    {
      id: 'match-2',
      sportType: 'football',
      teams: [
        teams.find(t => t.id === 'team-3')!,
        teams.find(t => t.id === 'team-4')!
      ],
      startTime: Date.now() + 9000000,
      status: 'upcoming',
      events: []
    },
    {
      id: 'match-3',
      sportType: 'football',
      teams: [
        teams.find(t => t.id === 'team-5')!,
        teams.find(t => t.id === 'team-6')!
      ],
      startTime: Date.now() + 14400000,
      status: 'upcoming',
      events: []
    },
    {
      id: 'match-4',
      sportType: 'basketball',
      teams: [
        teams.find(t => t.id === 'team-7')!,
        teams.find(t => t.id === 'team-8')!
      ],
      startTime: Date.now() - 1800000,
      status: 'live',
      events: [
        {
          id: 'event-2',
          matchId: 'match-4',
          teamId: 'team-7',
          eventType: 'field_goal',
          timestamp: Date.now() - 900000,
          value: 18
        },
        {
          id: 'event-3',
          matchId: 'match-4',
          teamId: 'team-8',
          eventType: 'field_goal',
          timestamp: Date.now() - 600000,
          value: 38
        }
      ]
    },
    {
      id: 'match-5',
      sportType: 'basketball',
      teams: [
        teams.find(t => t.id === 'team-7')!,
        teams.find(t => t.id === 'team-8')!
      ],
      startTime: Date.now() + 5400000,
      status: 'upcoming',
      events: []
    },
    {
      id: 'match-6',
      sportType: 'basketball',
      teams: [
        teams.find(t => t.id === 'team-7')!,
        teams.find(t => t.id === 'team-8')!
      ],
      startTime: Date.now() + 9000000,
      status: 'upcoming',
      events: []
    }
  ];

  const trackEvents: UI_TrackEvent[] = [
    {
      status: 'Ended',
      event: 'Sprint Relay - Male',
      results: [
        { position: '1st.', team: 'Team B' },
        { position: '2nd.', team: 'Team C' },
        { position: '3rd.', team: 'Team A' }
      ]
    },
    {
      status: 'Live',
      event: '100m Sprint - Male',
      results: []
    }
  ];

  const convertMatchToUI = (match: Match): UI_Match => {
    const team1 = match.teams[0];
    const team2 = match.teams[1];
    
    const team1Score = match.events
      .filter(e => e.teamId === team1.id && ['goal', 'field_goal', 'three_pointer'].includes(e.eventType))
      .reduce((sum, e) => sum + (typeof e.value === 'number' ? e.value : 1), 0);
    
    const team2Score = match.events
      .filter(e => e.teamId === team2.id && ['goal', 'field_goal', 'three_pointer'].includes(e.eventType))
      .reduce((sum, e) => sum + (typeof e.value === 'number' ? e.value : 1), 0);

    let timeDisplay = '';
    if (match.status === 'live') {
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
      status: match.status === 'live' ? 'Live' : 'Upcoming',
      time: timeDisplay,
      team1: team1.name,
      team2: team2.name,
      score1: match.status === 'live' ? team1Score : undefined,
      score2: match.status === 'live' ? team2Score : undefined,
      team1Color: `bg-blue-600`,
      team2Color: `bg-red-600`,
      sportType: match.sportType
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

  const getFilteredMatches = (sportType: SportType): UI_Match[] => {
    const filtered = matches
      .filter(match => match.sportType === sportType)
      .map(convertMatchToUI);
    return sortMatches(filtered);
  };

  const getAllLiveMatches = (): UI_Match[] => {
    return matches
      .filter(match => match.status === 'live')
      .map(convertMatchToUI);
  };

  const footballMatches = getFilteredMatches('football');
  const basketballMatches = getFilteredMatches('basketball');
  const liveMatches = getAllLiveMatches();

  const TeamLogo: React.FC<UI_TeamLogoProps> = ({ color }) => (
    <div className={`w-6 h-6 sm:w-8 sm:h-8 ${color} rounded-sm flex items-center justify-center flex-shrink-0`}>
      <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white dark:bg-gray-800 rounded-sm opacity-80"></div>
    </div>
  );

  const MatchCard: React.FC<UI_MatchCardProps> = ({ match, isBasketball = false }) => (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700 touch-manipulation">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center space-x-2">
          {match.status === 'Live' && (
            <span className="bg-green-500 text-white px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium animate-pulse">
              {t('live')}
            </span>
          )}
          <span className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm">{match.time}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
          <TeamLogo color={match.team1Color} />
          <span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base truncate">{match.team1}</span>
        </div>
        
        <div className="px-2 sm:px-4 min-w-[80px] sm:min-w-[100px] flex justify-center">
          {match.status === 'Live' && match.score1 !== undefined && match.score2 !== undefined ? (
            <span className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
              {match.score1} - {match.score2}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 text-sm sm:text-base">{t('vs')}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3 justify-end flex-1">
          <span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base truncate">{match.team2}</span>
          <TeamLogo color={match.team2Color} />
        </div>
      </div>
    </div>
  );

  const TrackEventCard: React.FC<UI_TrackEventCardProps> = ({ event }) => (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700 touch-manipulation">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium text-white w-fit ${
          event.status === 'Ended' ? 'bg-red-500' : 
          event.status === 'Live' ? 'bg-green-500' : 'bg-gray-500'
        }`}>
          {event.status}
        </span>
        <span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base">{event.event}</span>
      </div>
      
      <div className="space-y-1.5 sm:space-y-2">
        {event.results.map((result, index) => (
          <div key={index} className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-gray-600 dark:text-gray-300 font-medium w-8 sm:w-10 text-xs sm:text-sm">{result.position}</span>
            <span className="text-gray-800 dark:text-gray-100 text-xs sm:text-sm">{result.team}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // Event handlers
  const handleTabClick = (tab: TabType): void => {
    if (tab === 'Favourites' && !isAuthenticated) {
      // Show the favorites auth dialog instead of redirecting directly
      setShowFavoritesDialog(true);
      return;
    }
    
    if (tab === 'Competition' && !isAuthenticated) {
      // Show the competitions auth dialog instead of redirecting directly
      setShowCompetitionsDialog(true);
      return;
    }
    
    if (tab === 'Profile') {
      router.push('/profile');
      return;
    }
    
    setActiveTab(tab);
    setMobileMenuOpen(false); // Close mobile menu when tab is selected
  };

  // Function to handle demo account selection for favorites
  const handleDemoAccount = () => {
    setShowFavoritesDialog(false);
    setActiveTab('Favourites');
  };

  // Function to handle demo account selection for competitions
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
    alert('No new notifications');
  };

  const handleLiveClick = (): void => {
    setShowLiveMatches(true);
  };

  const handleBackFromLive = (): void => {
    setShowLiveMatches(false);
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
      <LiveMatchesScreen 
        liveMatches={liveMatches} 
        trackEvents={trackEvents} 
        onBack={handleBackFromLive} 
      />
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
      
      {/* Enhanced Mobile Header */}
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
                <span className="text-red-500 font-bold text-xs">LIVE</span>
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
              <button 
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors relative"
                aria-label="Notifications"
                onClick={handleNotificationClick}
                type="button"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-900 dark:text-white" />
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 max-w-7xl mx-auto">
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

            {(activeSport === 'all' || activeSport === 'track_events') && (
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 px-1">{t('track_events')}</h2>
                <div className="space-y-2 sm:space-y-3">
                  {trackEvents.map((event, index) => (
                    <TrackEventCard key={`track-fixture-${index}`} event={event} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'Favourites' && (
          <div className="space-y-6 sm:space-y-8">
            <Favouritesscreen activeSport={activeSport} />
          </div>
        )}

        {activeTab === 'Competition' && (
          <section>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4 px-1">{t('competitions')}</h2>
            <div className="space-y-2 sm:space-y-3">
              {[
                { title: t('football_section'), desc: 'University football championship' },
                { title: t('basketball_section'), desc: 'University basketball championship' },
                { title: t('track_events'), desc: 'Athletic competitions and relay events' },
                { title: 'Volleyball Championship', desc: 'Inter-campus volleyball tournament' },
                { title: 'Table Tennis League', desc: 'Singles and doubles competitions' }
              ].map((comp, index) => (
                <button 
                  key={index}
                  className="w-full bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-left hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 transition-colors touch-manipulation active:scale-[0.98]"
                >
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2 text-sm sm:text-base">{comp.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">{comp.desc}</p>
                </button>
              ))}
            </div>
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
      </div>

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