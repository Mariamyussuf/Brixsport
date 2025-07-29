'use client';

import React, { useState } from 'react';
import { Search, Bell, Clock, Star, Calendar, Trophy } from 'lucide-react';

// Type definitions
interface Match {
  status: 'Live' | 'Upcoming';
  time: string;
  team1: string;
  team2: string;
  score1?: number;
  score2?: number;
  team1Color: string;
  team2Color: string;
}

interface TrackResult {
  position: string;
  team: string;
}

interface TrackEvent {
  status: 'Ended' | 'Live' | 'Upcoming';
  event: string;
  results: TrackResult[];
}

type TabType = 'Fixtures' | 'Live' | 'Favourites' | 'Competition';
type SportType = 'All' | 'Football' | 'Basketball' | 'Track events';

// Component props interfaces
interface TeamLogoProps {
  color: string;
}

interface MatchCardProps {
  match: Match;
  isBasketball?: boolean;
}

interface TrackEventCardProps {
  event: TrackEvent;
}

const BrixSports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Fixtures');
  const [activeSport, setActiveSport] = useState<SportType>('All');

  const tabs: { name: TabType; icon: React.ReactNode }[] = [
    { name: 'Fixtures', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Live', icon: <Clock className="w-5 h-5" /> },
    { name: 'Favourites', icon: <Star className="w-5 h-5" /> },
    { name: 'Competition', icon: <Trophy className="w-5 h-5" /> }
  ];

  const sportTabs: SportType[] = ['All', 'Football', 'Basketball', 'Track events'];

  const footballMatches: Match[] = [
    {
      status: 'Live',
      time: "71'",
      team1: 'Pirates FC',
      team2: 'Joga FC',
      score1: 0,
      score2: 1,
      team1Color: 'bg-blue-600',
      team2Color: 'bg-red-600'
    },
    {
      status: 'Upcoming',
      time: '2:30',
      team1: 'Los Blancos',
      team2: 'La Masia',
      team1Color: 'bg-blue-600',
      team2Color: 'bg-red-600'
    },
    {
      status: 'Upcoming',
      time: '4:00',
      team1: 'Spartans',
      team2: 'Kings FC',
      team1Color: 'bg-red-600',
      team2Color: 'bg-blue-600'
    }
  ];

  const basketballMatches: Match[] = [
    {
      status: 'Live',
      time: '2nd Quarter',
      team1: 'Pheonix',
      team2: 'Blazers',
      score1: 18,
      score2: 38,
      team1Color: 'bg-blue-600',
      team2Color: 'bg-red-600'
    },
    {
      status: 'Upcoming',
      time: '1:30',
      team1: 'Pheonix',
      team2: 'Blazers',
      team1Color: 'bg-blue-600',
      team2Color: 'bg-red-600'
    },
    {
      status: 'Upcoming',
      time: '2:30',
      team1: 'Pheonix',
      team2: 'Blazers',
      team1Color: 'bg-blue-600',
      team2Color: 'bg-red-600'
    }
  ];

  const trackEvents: TrackEvent[] = [
    {
      status: 'Ended',
      event: 'Sprint Relay - Male',
      results: [
        { position: '1st.', team: 'Team B' },
        { position: '2nd.', team: 'Team C' },
        { position: '3rd.', team: 'Team A' }
      ]
    }
  ];

  const TeamLogo: React.FC<TeamLogoProps> = ({ color }) => (
    <div className={`w-8 h-8 ${color} rounded-sm flex items-center justify-center`}>
      <div className="w-6 h-6 bg-white rounded-sm opacity-80"></div>
    </div>
  );

  const MatchCard: React.FC<MatchCardProps> = ({ match, isBasketball = false }) => (
    <div className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100 touch-manipulation">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {match.status === 'Live' && (
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Live
            </span>
          )}
          <span className="text-gray-600 font-medium text-sm sm:text-base">{match.time}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <TeamLogo color={match.team1Color} />
          <span className="font-medium text-gray-800 text-sm sm:text-base truncate">{match.team1}</span>
        </div>
        
        <div className="px-3 sm:px-4 flex-shrink-0">
          {match.status === 'Live' && match.score1 !== undefined && match.score2 !== undefined ? (
            <span className="text-lg font-bold text-gray-800">
              {match.score1} - {match.score2}
            </span>
          ) : (
            <span className="text-gray-400 text-sm sm:text-base">vs</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 justify-end min-w-0">
          <span className="font-medium text-gray-800 text-sm sm:text-base truncate">{match.team2}</span>
          <TeamLogo color={match.team2Color} />
        </div>
      </div>
    </div>
  );

  const TrackEventCard: React.FC<TrackEventCardProps> = ({ event }) => (
    <div className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-100 touch-manipulation">
      <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
          event.status === 'Ended' ? 'bg-red-500' : 
          event.status === 'Live' ? 'bg-green-500' : 'bg-gray-500'
        }`}>
          {event.status}
        </span>
        <span className="font-medium text-gray-800 text-sm sm:text-base">{event.event}</span>
      </div>
      
      <div className="space-y-2">
        {event.results.map((result, index) => (
          <div key={index} className="flex items-center space-x-3">
            <span className="text-gray-600 font-medium w-8 text-sm sm:text-base">{result.position}</span>
            <span className="text-gray-800 text-sm sm:text-base">{result.team}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const handleTabClick = (tab: TabType): void => {
    setActiveTab(tab);
  };

  const handleSportClick = (sport: SportType): void => {
    setActiveSport(sport);
  };

  const handleSearchClick = (): void => {
    alert('Search functionality coming soon!');
  };

  const handleNotificationClick = (): void => {
    alert('No new notifications');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-slate-800 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold">BrixSports®</h1>
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button 
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              aria-label="Search"
              onClick={handleSearchClick}
              type="button"
            >
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button 
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors relative"
              aria-label="Notifications"
              onClick={handleNotificationClick}
              type="button"
            >
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">3</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 py-4 max-w-6xl mx-auto">
        {/* Sport Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2" role="tablist">
          {sportTabs.map((sport) => (
            <button
              key={sport}
              onClick={() => handleSportClick(sport)}
              className={`px-4 py-2.5 rounded-full font-medium transition-all text-sm whitespace-nowrap min-w-0 flex-shrink-0 touch-manipulation ${
                activeSport === sport
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 active:bg-gray-200 border border-gray-200'
              }`}
              role="tab"
              aria-selected={activeSport === sport}
            >
              {sport}
            </button>
          ))}
        </div>

        {/* Fixtures Content - Shows ALL matches (Live + Upcoming) - Now Default */}
        {activeTab === 'Fixtures' && (
          <>
            {/* Football Section */}
            {(activeSport === 'All' || activeSport === 'Football') && (
              <section className="mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">BUSA league - Football</h2>
                <div className="space-y-3">
                  {footballMatches.map((match, index) => (
                    <MatchCard key={`football-fixture-${index}`} match={match} />
                  ))}
                </div>
              </section>
            )}

            {/* Basketball Section */}
            {(activeSport === 'All' || activeSport === 'Basketball') && (
              <section className="mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">BUSA league - Basketball</h2>
                <div className="space-y-3">
                  {basketballMatches.map((match, index) => (
                    <MatchCard key={`basketball-fixture-${index}`} match={match} isBasketball={true} />
                  ))}
                </div>
              </section>
            )}

            {/* Track Events Section */}
            {(activeSport === 'All' || activeSport === 'Track events') && (
              <section className="mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Track events</h2>
                <div className="space-y-3">
                  {trackEvents.map((event, index) => (
                    <TrackEventCard key={`track-fixture-${index}`} event={event} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Live Content - Shows ONLY live matches */}
        {activeTab === 'Live' && (
          <>
            {/* Check if there are any live matches */}
            {footballMatches.some(match => match.status === 'Live') || 
             basketballMatches.some(match => match.status === 'Live') || 
             trackEvents.some(event => event.status === 'Live') ? (
              <>
                {/* Football Section */}
                {(activeSport === 'All' || activeSport === 'Football') && 
                 footballMatches.some(match => match.status === 'Live') && (
                  <section className="mb-8">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">BUSA league - Football</h2>
                    <div className="space-y-3">
                      {footballMatches.filter(match => match.status === 'Live').map((match, index) => (
                        <MatchCard key={`football-live-${index}`} match={match} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Basketball Section */}
                {(activeSport === 'All' || activeSport === 'Basketball') && 
                 basketballMatches.some(match => match.status === 'Live') && (
                  <section className="mb-8">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">BUSA league - Basketball</h2>
                    <div className="space-y-3">
                      {basketballMatches.filter(match => match.status === 'Live').map((match, index) => (
                        <MatchCard key={`basketball-live-${index}`} match={match} isBasketball={true} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Track Events Section */}
                {(activeSport === 'All' || activeSport === 'Track events') && 
                 trackEvents.some(event => event.status === 'Live') && (
                  <section className="mb-8">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Track events</h2>
                    <div className="space-y-3">
                      {trackEvents.filter(event => event.status === 'Live').map((event, index) => (
                        <TrackEventCard key={`track-live-${index}`} event={event} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : (
              /* No live matches message */
              <section className="mb-8">
                <div className="bg-white rounded-lg p-6 sm:p-8 text-center">
                  <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">No live matches at the moment</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">Check back later or view fixtures for upcoming matches</p>
                </div>
              </section>
            )}
          </>
        )}

        {/* Favourites Content - Placeholder */}
        {activeTab === 'Favourites' && (
          <section className="mb-8">
            <div className="bg-white rounded-lg p-6 sm:p-8 text-center">
              <Star className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm sm:text-base">No favourite matches yet</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-2">Star matches to add them to your favourites</p>
            </div>
          </section>
        )}

        {/* Competition Content */}
        {activeTab === 'Competition' && (
          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Competitions</h2>
            <div className="space-y-3">
              <button className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation">
                <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">BUSA League - Football</h3>
                <p className="text-gray-600 text-xs sm:text-sm">University football championship</p>
              </button>
              <button className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation">
                <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">BUSA League - Basketball</h3>
                <p className="text-gray-600 text-xs sm:text-sm">University basketball championship</p>
              </button>
              <button className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation">
                <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">Track & Field Events</h3>
                <p className="text-gray-600 text-xs sm:text-sm">Athletic competitions and relay events</p>
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 sm:px-4 py-2 z-20">
        <div className="flex justify-around items-center w-full max-w-6xl mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => handleTabClick(tab.name)}
              className={`flex flex-col items-center py-2 px-2 sm:px-3 rounded-lg transition-all min-w-0 flex-1 max-w-20 sm:max-w-24 touch-manipulation active:scale-95 ${
                activeTab === tab.name
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 active:text-blue-500'
              }`}
              role="tab"
              aria-selected={activeTab === tab.name}
              aria-controls={`${tab.name.toLowerCase()}-panel`}
            >
              <div className="mb-1 relative">
                {React.cloneElement(tab.icon as React.ReactElement, {
                  className: "w-5 h-5 sm:w-6 sm:h-6"
                })}
                {activeTab === tab.name && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </div>
              <span className="text-xs font-medium leading-tight text-center">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrixSports;