'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Team, Player, Tournament, SportType } from '../../types/campus';
import { useRouter } from 'next/navigation';

interface FavouritesscreenProps {
  activeSport: SportType | 'all';
}

const Favouritesscreen: React.FC<FavouritesscreenProps> = ({ activeSport }) => {
  const router = useRouter();
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('token');

  const requireAuth = (next: string = '/?tab=Favourites'): boolean => {
    if (!isAuthed) {
      router.push(`/auth/login?next=${encodeURIComponent(next)}`);
      return true;
    }
    return false;
  };

  // Sample user's favourite teams
  const favouriteTeams: Team[] = [
    {
      id: 'team-1',
      name: 'Los Blancos',
      color: '#1e3a8a', // blue-800
      players: []
    },
    {
      id: 'team-2', 
      name: 'Pirates FC',
      color: '#dc2626', // red-600
      players: []
    },
    {
      id: 'team-3',
      name: 'City Boys FC', 
      color: '#f59e0b', // amber-500
      players: []
    },
    {
      id: 'team-4',
      name: 'JOG',
      color: '#2563eb', // blue-600
      players: []
    }
  ];

  // Sample user's favourite players
  const favouritePlayers: Player[] = [
    {
      id: 'player-1',
      name: 'Yanko',
      teamId: 'team-1',
      number: '10',
      position: 'Forward',
      team: 'Los Blancos',
      teamColor: '#1e3a8a'
    },
    {
      id: 'player-2', 
      name: 'McKintory',
      teamId: 'team-2',
      number: '7',
      position: 'Midfielder',
      team: 'Pirates FC',
      teamColor: '#dc2626'
    },
    {
      id: 'player-3',
      name: 'Animalshun',
      teamId: 'team-3', 
      number: '9',
      position: 'Striker',
      team: 'City Boys FC',
      teamColor: '#f59e0b'
    }
  ];

  // Sample user's favourite competitions
  const favouriteCompetitions = [
    {
      id: 'comp-1',
      name: 'BUSA League',
      color: '#1e3a8a', // blue-800
      sportType: 'football' as SportType,
      description: 'University football championship'
    },
    {
      id: 'comp-2',
      name: 'Inter-College Cup', 
      color: '#dc2626', // red-600
      sportType: 'football' as SportType,
      description: 'Inter-campus tournament'
    },
    {
      id: 'comp-3',
      name: 'Beta Friendlies',
      color: '#2563eb', // blue-600
      sportType: 'football' as SportType,
      description: 'Friendly matches series'
    },
    {
      id: 'comp-4',
      name: 'Play Hard Africa',
      color: '#f59e0b', // amber-500
      sportType: 'basketball' as SportType,
      description: 'Continental basketball league'
    }
  ];

  const handleAddTeam = (): void => {
    if (requireAuth()) return;
    alert('Add favourite team functionality coming soon!');
  };

  const handleAddPlayer = (): void => {
    if (requireAuth()) return;
    alert('Add favourite player functionality coming soon!');
  };

  const handleAddCompetition = (): void => {
    if (requireAuth()) return;
    alert('Add favourite competition functionality coming soon!');
  };

  const getColorClass = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      '#1e3a8a': 'bg-blue-800',
      '#dc2626': 'bg-red-600', 
      '#2563eb': 'bg-blue-600',
      '#f59e0b': 'bg-amber-500'
    };
    return colorMap[color] || 'bg-gray-600';
  };

  const getTextColorClass = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      '#1e3a8a': 'text-blue-800',
      '#dc2626': 'text-red-600', 
      '#2563eb': 'text-blue-600',
      '#f59e0b': 'text-amber-500'
    };
    return colorMap[color] || 'text-gray-600';
  };

  // Filter competitions by sport if needed
  const filteredCompetitions = activeSport === 'all' 
    ? favouriteCompetitions 
    : favouriteCompetitions.filter(comp => comp.sportType === activeSport);

  return (
    <div className="space-y-6 text-neutral-900 dark:text-neutral-100">
      {/* Your Teams Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-neutral-100">YOUR TEAMS</h2>
            <span className="bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
              {favouriteTeams.length}
            </span>
          </div>
          <button
            onClick={handleAddTeam}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors touch-manipulation"
            aria-label="Add favourite team"
          >
            <Plus className="w-4 h-4" />
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
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-neutral-100">YOUR PLAYERS</h2>
            <span className="bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
              {favouritePlayers.length}
            </span>
          </div>
          <button
            onClick={handleAddPlayer}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors touch-manipulation"
            aria-label="Add favourite player"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {favouritePlayers.map((player) => (
            <button
              key={player.id}
              className="bg-white dark:bg-slate-900/40 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-white/10 hover:shadow-md transition-all touch-manipulation active:scale-95"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-10 h-10 ${getColorClass(player.teamColor || '#6b7280')} rounded-full flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{player.number}</span>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{player.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">{player.team}</p>
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
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-neutral-100">YOUR COMPETITIONS</h2>
            <span className="bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
              {filteredCompetitions.length}
            </span>
          </div>
          <button
            onClick={handleAddCompetition}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors touch-manipulation"
            aria-label="Add favourite competition"
          >
            <Plus className="w-4 h-4" />
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
                  <p className="text-xs opacity-80 mt-1">{competition.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Favouritesscreen;