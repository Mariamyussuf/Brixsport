import React, { useState } from 'react';
import { Player } from '@/types/favorites';
import Link from 'next/link';

// Extended player type that includes optional number property
interface ExtendedPlayer extends Player {
  number?: string;
}

interface PlayerCardProps {
  player: Player;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = () => {
    // In a real implementation, this would make an API call
    setIsFavorite(!isFavorite);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getPositionColor = (position?: string) => {
    switch (position?.toLowerCase()) {
      case 'forward':
        return 'bg-red-100 text-red-800';
      case 'midfielder':
        return 'bg-blue-100 text-blue-800';
      case 'defender':
        return 'bg-green-100 text-green-800';
      case 'goalkeeper':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Type guard to check if player has number property
  const hasNumber = (player: Player): player is ExtendedPlayer => {
    return 'number' in player;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
      {/* Header with favorite toggle */}
      <div className="p-4 pb-2 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {player.name}
          </h3>
          <div className="flex items-center mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPositionColor(player.position)}`}>
              {player.position}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite();
          }}
          className={`p-1 rounded-full ${
            isFavorite 
              ? 'text-red-500 hover:text-red-600' 
              : 'text-gray-400 hover:text-red-500'
          }`}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <svg 
            className="w-5 h-5" 
            fill={isFavorite ? "currentColor" : "none"} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Player image or initials */}
      <div className="px-4 py-2 flex justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">
              {getInitials(player.name)}
            </span>
          </div>
          {hasNumber(player) && player.number && (
            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
              {player.number}
            </div>
          )}
        </div>
      </div>

      {/* Player details */}
      <div className="px-4 py-3">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 justify-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span>Team ID: {player.team_id}</span>
          </div>
          
          <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
            <span className="flex items-center mr-3">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.919-2.737 5.998 5.998 0 003.597 1.27c.176.01.351.025.527.044.784.087 1.554.294 2.287.614a5.98 5.98 0 01-2.523 2.44 5.992 5.992 0 00-3.343-.81 6.004 6.004 0 01-3.02 1.004z" clipRule="evenodd" />
              </svg>
              {player.nationality}
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {player.age} yrs
            </span>
          </div>
        </div>
      </div>

      {/* Action button */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
        <Link 
          href={`/player/${player.id}`}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
};