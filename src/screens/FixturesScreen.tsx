import React, { useState } from 'react';
import { Search, Bell, Clock, Play } from 'lucide-react';
import { useI18n } from '@/components/shared/I18nProvider';
import { useRouter } from 'next/navigation';
import MatchCard, { Match } from '@/components/shared/MatchCard';
import TrackEventCard, { TrackEvent } from '@/components/shared/TrackEventCard';

// No need to redefine the interfaces, we're using the exported ones

const FixturesScreen = () => {
  const { t } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'football' | 'basketball' | 'track'>('all');
  const [currentView, setCurrentView] = useState<'dashboard' | 'track'>('dashboard');

  // Using shared components instead of local implementations

  const footballMatches: Match[] = [
    {
      id: '1',
      homeTeam: 'Pirates FC',
      awayTeam: 'Joja FC',
      homeScore: 0,
      awayScore: 1,
      time: "71'",
      status: 'live'
    },
    {
      id: '2',
      homeTeam: 'Los Blancos',
      awayTeam: 'La Masia',
      time: '2:30',
      status: 'scheduled'
    },
    {
      id: '3',
      homeTeam: 'Spartans',
      awayTeam: 'Kings FC',
      time: '4:00',
      status: 'scheduled'
    }
  ];

  const basketballMatches: Match[] = [
    {
      id: '4',
      homeTeam: 'Pheonix',
      awayTeam: 'Blazers',
      homeScore: 18,
      awayScore: 38,
      quarter: '2nd Quarter',
      status: 'live'
    },
    {
      id: '5',
      homeTeam: 'Pheonix',
      awayTeam: 'Blazers',
      time: '1:30',
      status: 'scheduled'
    },
    {
      id: '6',
      homeTeam: 'Pheonix',
      awayTeam: 'Blazers',
      time: '2:30',
      status: 'scheduled'
    }
  ];

  const trackEvents: TrackEvent[] = [
    {
      id: '1',
      name: 'Sprint Relay - Male',
      time: '4:30pm',
      status: 'scheduled'
    },
    {
      id: '2',
      name: 'Sprint Relay - Female',
      time: '4:40pm',
      status: 'scheduled'
    },
    {
      id: '3',
      name: '100m Sprint - Male',
      time: '4:50pm',
      status: 'scheduled'
    },
    {
      id: '4',
      name: '100m Sprint - Female',
      time: '5:00pm',
      status: 'scheduled'
    },
    {
      id: '5',
      name: '400m Sprint - Male',
      time: '5:30pm',
      status: 'scheduled'
    },
    {
      id: '6',
      name: '400m Sprint - Female',
      time: '5:50pm',
      status: 'scheduled'
    },
    {
      id: '7',
      name: '1500m Sprint - Male',
      time: '6:00pm',
      status: 'scheduled'
    },
    {
      id: '8',
      name: '1500m Sprint - Female',
      time: '6:30pm',
      status: 'scheduled'
    }
  ];

  const endedTrackEvent: TrackEvent = {
    id: '9',
    name: 'Sprint Relay - Male',
    time: 'Ended',
    status: 'ended',
    results: [
      { position: '1st', team: 'Team B' },
      { position: '2nd', team: 'Team C' }
    ]
  };

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
            18th OCT
          </div>

          <div className="space-y-4">
            {trackEvents.map((event) => (
              <TrackEventCard key={event.id} event={event} />
            ))}
            <TrackEventCard event={endedTrackEvent} />
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
              {footballMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* Basketball Section */}
        {(activeTab === 'all' || activeTab === 'basketball') && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{t('basketball_section')}</h2>
            <div className="space-y-4">
              {basketballMatches.map((match) => (
                <MatchCard key={match.id} match={match} isBasketball={true} />
              ))}
            </div>
          </div>
        )}

        {/* Track Events Preview */}
        {activeTab === 'all' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">{t('track_events')}</h2>
            <TrackEventCard event={endedTrackEvent} />
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