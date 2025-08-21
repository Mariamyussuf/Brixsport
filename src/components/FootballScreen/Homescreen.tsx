'use client';

import React, { useState } from 'react';
import { Search, Bell, Clock, Star, Calendar, Trophy } from 'lucide-react';
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

// Import the Favouritesscreen component
const Favouritesscreen: React.FC<{ activeSport: SportType | 'all' }> = ({ activeSport }) => {
  // Sample user's favourite teams
  const favouriteTeams = [
    { id: 'team-1', name: 'Los Blancos', color: '#1e3a8a' },
    { id: 'team-2', name: 'Pirates FC', color: '#dc2626' },
    { id: 'team-3', name: 'City Boys FC', color: '#f59e0b' },
    { id: 'team-4', name: 'JOG', color: '#2563eb' }
  ];

  const favouritePlayers = [
    { id: 'player-1', name: 'Yanko', number: '10', team: 'Los Blancos', teamColor: '#1e3a8a' },
    { id: 'player-2', name: 'McKintory', number: '7', team: 'Pirates FC', teamColor: '#dc2626' },
    { id: 'player-3', name: 'Animalshun', number: '9', team: 'City Boys FC', teamColor: '#f59e0b' }
  ];

  const favouriteCompetitions = [
    { id: 'comp-1', name: 'BUSA League', color: '#1e3a8a', sportType: 'football' as SportType },
    { id: 'comp-2', name: 'Inter-College Cup', color: '#dc2626', sportType: 'football' as SportType },
    { id: 'comp-3', name: 'Beta Friendlies', color: '#2563eb', sportType: 'football' as SportType },
    { id: 'comp-4', name: 'Play Hard Africa', color: '#f59e0b', sportType: 'basketball' as SportType }
  ];

  const getColorClass = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      '#1e3a8a': 'bg-blue-800', '#dc2626': 'bg-red-600', 
      '#2563eb': 'bg-blue-600', '#f59e0b': 'bg-amber-500'
    };
    return colorMap[color] || 'bg-gray-600';
  };

  const filteredCompetitions = activeSport === 'all' 
    ? favouriteCompetitions 
    : favouriteCompetitions.filter(comp => comp.sportType === activeSport);

  return (
    <div className="space-y-6">
      {/* Your Teams Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">YOUR TEAMS</h2>
            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
              {favouriteTeams.length}
            </span>
          </div>
          <button className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
            <span className="text-lg">+</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {favouriteTeams.map((team) => (
            <button
              key={team.id}
              className={`${getColorClass(team.color)} text-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all touch-manipulation active:scale-95`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-sm flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded-sm opacity-80"></div>
                </div>
                <span className="font-medium text-sm text-center">{team.name}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Your Players Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">YOUR PLAYERS</h2>
            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
              {favouritePlayers.length}
            </span>
          </div>
          <button className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
            <span className="text-lg">+</span>
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {favouritePlayers.map((player) => (
            <button
              key={player.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all touch-manipulation active:scale-95"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-10 h-10 ${getColorClass(player.teamColor)} rounded-full flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{player.number}</span>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-800 text-sm">{player.name}</p>
                  <p className="text-xs text-gray-500">{player.team}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Your Competitions Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">YOUR COMPETITIONS</h2>
            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
              {filteredCompetitions.length}
            </span>
          </div>
          <button className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
            <span className="text-lg">+</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {filteredCompetitions.map((competition) => (
            <button
              key={competition.id}
              className={`${getColorClass(competition.color)} text-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all touch-manipulation active:scale-95`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-sm flex items-center justify-center">
                  <div className="w-6 h-6 bg-white rounded-sm opacity-80"></div>
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{competition.name}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

const Homescreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Fixtures');
  const [activeSport, setActiveSport] = useState<SportType | 'all'>('all');

  const tabs: { name: TabType; icon: React.ReactNode }[] = [
    { name: 'Fixtures', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Live', icon: <Clock className="w-5 h-5" /> },
    { name: 'Favourites', icon: <Star className="w-5 h-5" /> },
    { name: 'Competition', icon: <Trophy className="w-5 h-5" /> }
  ];

  const sportTabs: (SportType | 'all')[] = ['all', 'football', 'basketball', 'track_events'];

  // Sample teams data
  const teams: Team[] = [
    {
      id: 'team-1',
      name: 'Pirates FC',
      color: '#2563eb', // blue-600
      players: []
    },
    {
      id: 'team-2',
      name: 'Joga FC',
      color: '#dc2626', // red-600
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

  // Sample matches data using the Match interface
  const matches: Match[] = [
    {
      id: 'match-1',
      sportType: 'football',
      teams: [
        teams.find(t => t.id === 'team-1')!,
        teams.find(t => t.id === 'team-2')!
      ],
      startTime: Date.now() - 4260000, // Started 71 minutes ago
      status: 'live',
      events: [
        {
          id: 'event-1',
          matchId: 'match-1',
          teamId: 'team-2',
          eventType: 'goal',
          timestamp: Date.now() - 1800000, // 30 minutes ago
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
      startTime: Date.now() + 9000000, // Starts in 2.5 hours
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
      startTime: Date.now() + 14400000, // Starts in 4 hours
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
      startTime: Date.now() - 1800000, // Started 30 minutes ago
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
      startTime: Date.now() + 5400000, // Starts in 1.5 hours
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
      startTime: Date.now() + 9000000, // Starts in 2.5 hours
      status: 'upcoming',
      events: []
    }
  ];

  // Sample track events data
  const trackEvents: UI_TrackEvent[] = [
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

  // Helper functions to convert Match data to UI format
  const convertMatchToUI = (match: Match): UI_Match => {
    const team1 = match.teams[0];
    const team2 = match.teams[1];
    
    // Calculate scores from events
    const team1Score = match.events
      .filter(e => e.teamId === team1.id && ['goal', 'field_goal', 'three_pointer'].includes(e.eventType))
      .reduce((sum, e) => sum + (typeof e.value === 'number' ? e.value : 1), 0);
    
    const team2Score = match.events
      .filter(e => e.teamId === team2.id && ['goal', 'field_goal', 'three_pointer'].includes(e.eventType))
      .reduce((sum, e) => sum + (typeof e.value === 'number' ? e.value : 1), 0);

    // Calculate time display
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
      team1Color: `bg-blue-600`, // Convert hex to Tailwind class
      team2Color: `bg-red-600`   // Convert hex to Tailwind class
    };
  };

  // Filter matches by sport
  const getFilteredMatches = (sportType: SportType): UI_Match[] => {
    return matches
      .filter(match => match.sportType === sportType)
      .map(convertMatchToUI);
  };

  const footballMatches = getFilteredMatches('football');
  const basketballMatches = getFilteredMatches('basketball');

  const TeamLogo: React.FC<UI_TeamLogoProps> = ({ color }) => (
    <div className={`w-8 h-8 ${color} rounded-sm flex items-center justify-center`}>
      <div className="w-6 h-6 bg-white rounded-sm opacity-80"></div>
    </div>
  );

  const MatchCard: React.FC<UI_MatchCardProps> = ({ match, isBasketball = false }) => (
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

  const TrackEventCard: React.FC<UI_TrackEventCardProps> = ({ event }) => (
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

  const handleSportClick = (sport: SportType | 'all'): void => {
    setActiveSport(sport);
  };

  const handleSearchClick = (): void => {
    alert('Search functionality coming soon!');
  };

  const handleNotificationClick = (): void => {
    alert('No new notifications');
  };

  // Helper function to get display name for sports
  const getSportDisplayName = (sport: SportType | 'all'): string => {
    const displayNames = {
      'all': 'All',
      'football': 'Football',
      'basketball': 'Basketball',
      'track_events': 'Track events',
      'volleyball': 'Volleyball',
      'table_tennis': 'Table Tennis',
      'badminton': 'Badminton'
    };
    return displayNames[sport];
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
              {getSportDisplayName(sport)}
            </button>
          ))}
        </div>

        {/* Fixtures Content - Shows ALL matches (Live + Upcoming) - Now Default */}
        {activeTab === 'Fixtures' && (
          <>
            {/* Football Section */}
            {(activeSport === 'all' || activeSport === 'football') && footballMatches.length > 0 && (
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
            {(activeSport === 'all' || activeSport === 'basketball') && basketballMatches.length > 0 && (
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
            {(activeSport === 'all' || activeSport === 'track_events') && (
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
                {(activeSport === 'all' || activeSport === 'football') && 
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
                {(activeSport === 'all' || activeSport === 'basketball') && 
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
                {(activeSport === 'all' || activeSport === 'track_events') && 
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

        {/* Favourites Content */}
        {activeTab === 'Favourites' && (
          <Favouritesscreen activeSport={activeSport} />
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
              <button className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation">
                <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">Volleyball Championship</h3>
                <p className="text-gray-600 text-xs sm:text-sm">Inter-campus volleyball tournament</p>
              </button>
              <button className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-100 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation">
                <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">Table Tennis League</h3>
                <p className="text-gray-600 text-xs sm:text-sm">Singles and doubles competitions</p>
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
                <div className="w-5 h-5 sm:w-6 sm:h-6">
                  {tab.icon}
                </div>
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

export default Homescreen;