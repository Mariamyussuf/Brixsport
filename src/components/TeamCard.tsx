import React, { useState } from 'react';
import { Team } from '@/types/favorites';
import Link from 'next/link';

interface TeamCardProps {
  team: Team;
  showDetails?: boolean;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, showDetails = true }) => {
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

  // Type guard to check if team has color property
  const hasColor = (team: Team): team is Team & { color?: string } => {
    return 'color' in team;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
      {/* Header with favorite toggle */}
      <div className="p-4 pb-2 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {team.name}
          </h3>
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

      <div className="px-4 py-2 flex justify-center">
        {(() => {
          const normalizeName = (name?: string) => name?.toLowerCase().replace(/\s+/g, ' ').trim();
          const TEAM_ASSET_LOGOS: Record<string, string> = {
            'vikings': require('@/assets/vikings.jpg').default?.src || require('@/assets/vikings.jpg').src,
            'titans': require('@/assets/titans.jpg').default?.src || require('@/assets/titans.jpg').src,
            'the storm': require('@/assets/the storm.jpg').default?.src || require('@/assets/the storm.jpg').src,
            'siberia': require('@/assets/siberia.jpg').default?.src || require('@/assets/siberia.jpg').src,
            'rim reapers': require('@/assets/rim-reapers.jpg').default?.src || require('@/assets/rim-reapers.jpg').src,
            'tbk': require('@/assets/tbk.jpg').default?.src || require('@/assets/tbk.jpg').src,
          };
          const key = normalizeName(team.name) || '';
          const assetLogo = TEAM_ASSET_LOGOS[key];
          const displayLogo = team.logo_url && /^https?:\/\//.test(team.logo_url) ? team.logo_url : assetLogo;
          return displayLogo ? (
            <img
              src={displayLogo}
              alt={team.name}
              className="w-20 h-20 rounded-full object-contain border-2 border-gray-200 dark:border-gray-700"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {getInitials(team.name)}
              </span>
            </div>
          );
        })()}
      </div>

      {/* Team details */}
      <div className="px-4 py-3">
        <div className="space-y-2">
          {team.founded_year && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>Founded: {team.founded_year}</span>
            </div>
          )}
          
          {(team.stadium || team.city) && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>{team.stadium}{team.stadium && team.city ? ', ' : ''}{team.city}</span>
            </div>
          )}
          
          {hasColor(team) && team.color && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
              </svg>
              <span>Team Color: 
                <span 
                  className="inline-block w-4 h-4 rounded-full ml-2 border border-gray-300 dark:border-gray-600" 
                  style={{ backgroundColor: team.color }}
                />
              </span>
            </div>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
          <Link 
            href={`/team/${team.id}`}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
          >
            View Details
          </Link>
        </div>
      )}
    </div>
  );
};