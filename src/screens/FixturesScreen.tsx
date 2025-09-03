import React, { useState } from 'react';
import { Search, Bell, Clock, Play } from 'lucide-react';
import { useI18n } from '@/components/shared/I18nProvider';
import { useRouter } from 'next/navigation';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  time?: string;
  status: 'live' | 'scheduled' | 'ended';
  quarter?: string;
}

interface TrackEvent {
  id: string;
  name: string;
  time: string;
  status: 'live' | 'scheduled' | 'ended';
  results?: { position: string; team: string }[];
}

const FixturesScreen = () => {
  const { t } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'football' | 'basketball' | 'track'>('all');
  const [currentView, setCurrentView] = useState<'dashboard' | 'track'>('dashboard');

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

  const getTeamIcon = (team: string, isHome: boolean = true) => {
    const baseClasses = "w-8 h-8 rounded-sm flex items-center justify-center text-white text-xs font-bold";
    
    // Team color mapping
    if (team.includes('Pirates') || team.includes('Los Blancos') || team.includes('Pheonix') || team.includes('Kings')) {
      return <div className={`${baseClasses} bg-blue-600`}>🛡️</div>;
    }
    if (team.includes('Joja') || team.includes('La Masia') || team.includes('Spartans') || team.includes('Blazers')) {
      return <div className={`${baseClasses} bg-red-600`}>🛡️</div>;
    }
    
    return <div className={`${baseClasses} bg-gray-600`}>🛡️</div>;
  };

  const MatchCard = ({ match }: { match: Match }) => (
    <div 
      className="flex items-center justify-between py-4 px-4 bg-white rounded-lg border border-gray-200 mb-3 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => {
        // Navigate to match details page
        router.push(`/match/${match.id}`);
      }}
    >
      <div className="flex items-center space-x-3">
        {match.status === 'live' && (
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            {t('live')}
          </div>
        )}
        {match.quarter && (
          <div className="text-gray-600 text-sm font-medium">
            {match.quarter}
          </div>
        )}
        {match.time && !match.quarter && (
          <div className="text-gray-600 text-sm font-medium">
            {match.time}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-gray-800 font-medium">{match.homeTeam}</span>
          {getTeamIcon(match.homeTeam, true)}
        </div>
        
        <div className="text-center min-w-[60px] px-2 sm:px-4">
          {match.homeScore !== undefined && match.awayScore !== undefined ? (
            <span className="text-lg font-bold text-gray-800">
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span className="text-gray-500">{t('vs')}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {getTeamIcon(match.awayTeam, false)}
          <span className="text-gray-800 font-medium">{match.awayTeam}</span>
        </div>
      </div>
    </div>
  );

  const TrackEventCard = ({ event }: { event: TrackEvent }) => (
    <div className="flex items-center justify-between py-4 px-4 bg-white rounded-lg border border-gray-200 mb-3">
      <div className="flex-1">
        <div className="flex items-center space-x-3">
          {event.status === 'live' && (
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {t('live')}
            </div>
          )}
          {event.status === 'ended' && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {t('ended')}
            </div>
          )}
          <span className="text-gray-800 font-medium">{event.name}</span>
        </div>
        
        {event.results && (
          <div className="mt-2 space-y-1">
            {event.results.map((result, idx) => (
              <div key={idx} className="text-sm text-gray-600">
                {result.position}. {result.team}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="text-gray-600 font-medium">
        {event.time}
      </div>
    </div>
  );

  if (currentView === 'track') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4">
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
        <div className="bg-white px-6 py-4 border-b border-gray-200">
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
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Track Events Content */}
        <div className="px-6 py-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">{t('current_competition_fixtures')}</h2>
          
          <div className="text-center text-gray-600 font-medium mb-6">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-800 px-6 py-4">
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
      <div className="bg-white px-6 py-4 border-b border-gray-200">
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
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
            <h2 className="text-xl font-bold text-gray-800 mb-6">{t('football_section')}</h2>
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
            <h2 className="text-xl font-bold text-gray-800 mb-6">{t('basketball_section')}</h2>
            <div className="space-y-4">
              {basketballMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* Track Events Preview */}
        {activeTab === 'all' && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-6">{t('track_events')}</h2>
            <TrackEventCard event={endedTrackEvent} />
            <button
              onClick={() => setCurrentView('track')}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
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