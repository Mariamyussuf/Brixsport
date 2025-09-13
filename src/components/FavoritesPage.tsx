
'use client';

import React, { useState } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { TeamCard } from './TeamCard';
import { PlayerCard } from './PlayerCard';
import { CompetitionCard } from './CompetitionCard';

// Tab types
type TabType = 'teams' | 'players' | 'competitions';

const FavoritesPage: React.FC = () => {
  const { favorites, loading, error, refreshFavorites } = useFavorites();
  const [activeTab, setActiveTab] = useState<TabType>('teams');

  // Handle retry button click
  const handleRetry = () => {
    refreshFavorites();
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render error state
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
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Render empty state
  if (!favorites || 
      (favorites.teams.length === 0 && 
       favorites.players.length === 0 && 
       favorites.competitions.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
        <div className="text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No Favorites Yet</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          You haven't added any favorites yet. Start exploring teams, players, and competitions to add them to your favorites.
        </p>
        <button
          onClick={() => {}}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Browse Competitions
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Favorites</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your favorite teams, players, and competitions
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('teams')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'teams'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Teams ({favorites.teams.length})
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'players'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Players ({favorites.players.length})
          </button>
          <button
            onClick={() => setActiveTab('competitions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'competitions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Competitions ({favorites.competitions.length})
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      <div>
        {activeTab === 'teams' && (
          <div>
            {favorites.teams.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">You haven't added any favorite teams yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {favorites.teams.map((team) => (
                  <TeamCard key={team.id} team={team} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'players' && (
          <div>
            {favorites.players.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">You haven't added any favorite players yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {favorites.players.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'competitions' && (
          <div>
            {favorites.competitions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">You haven't added any favorite competitions yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {favorites.competitions.map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;