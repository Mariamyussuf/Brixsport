'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { SportType } from '../../types/campus';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/shared/I18nProvider';
import { useFavoritesNew } from '@/hooks/useFavoritesNew';
import { Team as ApiTeam, Player as ApiPlayer } from '@/types/favorites';
import { Competition } from '@/lib/competitionService';

// Define interfaces for the component structure
interface Team {
  id: string;
  name: string;
  color: string;
  players: any[];
}

interface Player {
  id: string;
  name: string;
  teamId: string;
  number: string;
  position: string;
  team: string;
  teamColor: string;
}

interface Tournament {
  id: string;
  name: string;
  color: string;
  sportType: SportType;
  description: string;
}

interface FavouritesscreenProps {
  activeSport: SportType | 'all';
}

const Favouritesscreen: React.FC<FavouritesscreenProps> = ({ activeSport }) => {
  const router = useRouter();
  const { t } = useI18n();
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('token');
  
  // Use the new useFavoritesNew hook
  const { favorites, loading, error, refreshFavorites, addFavorite, removeFavorite } = useFavoritesNew();
  
  const [toast, setToast] = useState<{type: 'success' | 'info' | 'error', message: string} | null>(null);
  
  const requireAuth = (next: string = '/?tab=Favourites'): boolean => {
    if (!isAuthed) {
      router.push(`/auth/login?next=${encodeURIComponent(next)}`);
      return true;
    }
    return false;
  };

  const handleAddTeam = async (teamId: string): Promise<void> => {
    if (requireAuth()) return;
    
    try {
      const response = await addFavorite('team', parseInt(teamId, 10));
      showToast(response.success ? 'success' : 'info', response.message);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add team to favorites');
    }
  };

  const handleRemoveTeam = async (teamId: string): Promise<void> => {
    if (requireAuth()) return;
    
    try {
      const response = await removeFavorite('team', parseInt(teamId, 10));
      showToast(response.success ? 'success' : 'info', response.message);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to remove team from favorites');
    }
  };

  const handleAddPlayer = async (playerId: string): Promise<void> => {
    if (requireAuth()) return;
    
    try {
      const response = await addFavorite('player', parseInt(playerId, 10));
      showToast(response.success ? 'success' : 'info', response.message);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add player to favorites');
    }
  };

  const handleRemovePlayer = async (playerId: string): Promise<void> => {
    if (requireAuth()) return;
    
    try {
      const response = await removeFavorite('player', parseInt(playerId, 10));
      showToast(response.success ? 'success' : 'info', response.message);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to remove player from favorites');
    }
  };

  const handleAddCompetition = async (competitionId: number): Promise<void> => {
    if (requireAuth()) return;
    
    try {
      const response = await addFavorite('competition', competitionId);
      showToast(response.success ? 'success' : 'info', response.message);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add competition to favorites');
    }
  };

  const handleRemoveCompetition = async (competitionId: number): Promise<void> => {
    if (requireAuth()) return;
    
    try {
      const response = await removeFavorite('competition', competitionId);
      showToast(response.success ? 'success' : 'info', response.message);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to remove competition from favorites');
    }
  };

  const showToast = (type: 'success' | 'info' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
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
  const favouriteTeams = favorites?.teams.map((team: ApiTeam) => ({
    id: team.id,
    name: team.name,
    color: '#1e3a8a', // Default color since it's not in the API response
    players: []
  })) || [];

  const favouritePlayers = favorites?.players.map((player: ApiPlayer) => ({
    id: player.id,
    name: player.name,
    teamId: player.team_id,
    number: '10', // Default number since it's not in the API response
    position: player.position,
    team: '', // Would need to fetch team name separately
    teamColor: '#1e3a8a' // Default color since it's not in the API response
  })) || [];

  const favouriteCompetitions = favorites?.competitions.map((competition: Competition) => ({
    id: competition.id,
    name: competition.name,
    color: '#1e3a8a', // Default color since it's not in the API response
    sportType: 'football' as SportType, // Default sport type
    description: `${competition.type} - ${competition.category}`
  })) || [];

  // Filter competitions by sport if needed
  const filteredCompetitions = activeSport === 'all' 
    ? favouriteCompetitions 
    : favouriteCompetitions.filter(comp => comp.sportType === activeSport);

  return (
    <div className="space-y-6 text-neutral-900 dark:text-neutral-100">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg text-white ${
          toast.type === 'success' ? 'bg-green-500' : 
          toast.type === 'info' ? 'bg-blue-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}
      
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
            onClick={() => handleAddTeam('1')} // Example ID
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors touch-manipulation"
            aria-label={t('add_favourite_team')}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {favouriteTeams.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Favorite Teams</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You haven't added any teams to your favorites yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favouriteTeams.map((team) => (
              <div key={team.id} className="relative">
                <button
                  className={`${getColorClass(team.color)} text-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all touch-manipulation active:scale-95 w-full text-left`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-sm flex items-center justify-center">
                      <div className="w-6 h-6 bg-white rounded-sm opacity-80"></div>
                    </div>
                    <span className="font-medium text-sm text-center">{team.name}</span>
                  </div>
                </button>
                <button
                  onClick={() => handleRemoveTeam(team.id)}
                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-30 rounded-full hover:bg-opacity-50 transition-colors"
                  aria-label="Remove from favorites"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
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
            onClick={() => handleAddPlayer('1')} // Example ID
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors touch-manipulation"
            aria-label={t('add_favourite_player')}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {favouritePlayers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Favorite Players</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You haven't added any players to your favorites yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {favouritePlayers.map((player) => (
              <div key={player.id} className="relative">
                <button
                  className="bg-white dark:bg-slate-900/40 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-white/10 hover:shadow-md transition-all touch-manipulation active:scale-95 w-full"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`w-10 h-10 ${getColorClass(player.teamColor)} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">{player.number}</span>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{player.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">{player.team}</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleRemovePlayer(player.id)}
                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-30 rounded-full hover:bg-opacity-50 transition-colors"
                  aria-label="Remove from favorites"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
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
            onClick={() => handleAddCompetition(1)} // Example ID
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors touch-manipulation"
            aria-label={t('add_favourite_competition')}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {filteredCompetitions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Favorite Competitions</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You haven't added any competitions to your favorites yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredCompetitions.map((competition) => (
              <div key={competition.id} className="relative">
                <button
                  className={`${getColorClass(competition.color)} text-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all touch-manipulation active:scale-95 w-full`}
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
                <button
                  onClick={() => handleRemoveCompetition(competition.id)}
                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-30 rounded-full hover:bg-opacity-50 transition-colors"
                  aria-label="Remove from favorites"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Favouritesscreen;