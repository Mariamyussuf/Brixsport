import React, { useState } from 'react';
import { Competition } from '@/lib/userFavoritesService';
import Link from 'next/link';

interface CompetitionCardProps {
  competition: Competition;
}

export const CompetitionCard: React.FC<CompetitionCardProps> = ({ competition }) => {
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

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'football':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2L3 7v11h4v-6h6v6h4V7l-7-5z"/>
          </svg>
        );
      case 'basketball':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 14a1 1 0 112 0v1a1 1 0 11-2 0v-1zm4 0a1 1 0 112 0v1a1 1 0 11-2 0v-1zm-1-5a1 1 0 100-2 1 1 0 000 2zm-3 1a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z"/>
          </svg>
        );
      case 'track':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 11-2 0v-1H8a1 1 0 110-2h1V9a1 1 0 112 0v1h1a1 1 0 110 2h-1v1z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Type guard to check if competition has color property
  const hasColor = (competition: Competition): competition is Competition & { color?: string } => {
    return 'color' in competition;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
      {/* Header with favorite toggle */}
      <div className="p-4 pb-2 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {competition.name}
          </h3>
          <div className="flex items-center mt-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
              {competition.type}
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

      {/* Competition logo or initials */}
      <div className="px-4 py-2 flex justify-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">
            {getInitials(competition.name)}
          </span>
        </div>
      </div>

      {/* Competition details */}
      <div className="px-4 py-3">
        <div className="space-y-2">
          {competition.country && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.919-2.737 5.998 5.998 0 003.597 1.27c.176.01.351.025.527.044.784.087 1.554.294 2.287.614a5.98 5.98 0 01-2.523 2.44 5.992 5.992 0 00-3.343-.81 6.004 6.004 0 01-3.02 1.004z" clipRule="evenodd" />
              </svg>
              <span>{competition.country}</span>
            </div>
          )}
          
          {competition.season && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>Season: {competition.season}</span>
            </div>
          )}
          
          {hasColor(competition) && competition.color && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
              </svg>
              <span>Color: 
                <span 
                  className="inline-block w-4 h-4 rounded-full ml-2 border border-gray-300 dark:border-gray-600" 
                  style={{ backgroundColor: competition.color }}
                />
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action button */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
        <Link 
          href={`/competition/${competition.id}`}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};