'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Team, Player, Tournament, SportType } from '../../types/campus';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/shared/I18nProvider';
import { useFavorites } from '@/hooks/useFavorites';

// Define interfaces for the new API data structure
interface ApiTeam {
  id: string;
  name: string;
  logo_url: string;
  founded_year: number;
  stadium: string;
  city: string;
  color?: string;
}

interface ApiPlayer {
  id: string;
  name: string;
  position: string;
  team_id: string;
  nationality: string;
  age: number;
  teamColor?: string;
  number?: string;
}

interface ApiCompetition {
  id: string;
  name: string;
  type: string;
  country: string;
  season: string;
  color?: string;
  description?: string;
  sportType?: SportType;
}

interface FavouritesscreenProps {
  activeSport: SportType | 'all';
}

const Favouritesscreen: React.FC<FavouritesscreenProps> = ({ activeSport }) => {
  const router = useRouter();
  const { t } = useI18n();
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('token');
  
  // Use the new useFavorites hook
  const { favorites, loading, error, refreshFavorites } = useFavorites();
  
  const requireAuth = (next: string = '/?tab=Favourites'): boolean => {
    if (!isAuthed) {
      router.push(`/auth/login?next=${encodeURIComponent(next)}`);
      return true;
    }
    return false;
  };

  const handleAddTeam = (): void => {
    if (requireAuth()) return;
    alert(t('coming_soon'));
  };

  const handleAddPlayer = (): void => {
    if (requireAuth()) return;
    alert(t('coming_soon'));
  };

  const handleAddCompetition = (): void => {
    if (requireAuth()) return;
    alert(t('coming_soon'));
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

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Error Loading Favorites</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={refreshFavorites}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Transform API data to match existing component structure
  const favouriteTeams = favorites?.teams.map(team => ({
    id: team.id,
    name: team.name,
    color: team.color || '#1e3a8a',
    players: []
  })) || [];

  const favouritePlayers = favorites?.players.map(player => ({
    id: player.id,
    name: player.name,
    teamId: player.team_id,
    number: player.number || '10',
    position: player.position,
    team: '', // Would need to fetch team name separately
    teamColor: player.teamColor || '#1e3a8a'
  })) || [];

  const favouriteCompetitions = favorites?.competitions.map(competition => ({
    id: competition.id,
    name: competition.name,
    color: competition.color || '#1e3a8a',
    sportType: competition.sportType || 'football' as SportType,
    description: competition.description || `${competition.type} - ${competition.country}`
  })) || [];

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
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-neutral-100">{t('your_teams')}</h2>
            <span className="bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
              {favouriteTeams.length}
            </span>
          </div>
          <button
            onClick={handleAddTeam}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors touch-manipulation"
            aria-label={t('add_favourite_team')}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {favouriteTeams.map((team) => (
            <button
              key={team.id}
              className={`${getColorClass(team.color || '#1e3a8a')} text-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all touch-manipulation active:scale-95`}
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
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-neutral-100">{t('your_players')}</h2>
            <span className="bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
              {favouritePlayers.length}
            </span>
          </div>
          <button
            onClick={handleAddPlayer}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors touch-manipulation"
            aria-label={t('add_favourite_player')}
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
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-neutral-100">{t('your_competitions')}</h2>
            <span className="bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
              {filteredCompetitions.length}
            </span>
          </div>
          <button
            onClick={handleAddCompetition}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors touch-manipulation"
            aria-label={t('add_favourite_competition')}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {filteredCompetitions.map((competition) => (
            <button
              key={competition.id}
              className={`${getColorClass(competition.color || '#1e3a8a')} text-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all touch-manipulation active:scale-95`}
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