import React from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from './I18nProvider';

export interface Match {
  id: string;
  // HomeScreen properties
  team1?: string;
  team2?: string;
  score1?: number;
  score2?: number;
  team1Color?: string;
  team2Color?: string;
  sportType?: string;
  // FixturesScreen properties
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  time?: string;
  status: 'live' | 'scheduled' | 'ended' | 'Live' | 'Upcoming';
  quarter?: string;
}

interface MatchCardProps {
  match: Match;
  isBasketball?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, isBasketball = false }) => {
  const router = useRouter();
  const { t } = useI18n();

  const getTeamIcon = (team: string, color?: string) => {
    const baseClasses = "w-6 h-6 sm:w-8 sm:h-8 rounded-sm flex items-center justify-center flex-shrink-0";
    
    // Use provided color or fallback to team-based color
    const bgColor = color ? color : 
      (team.includes('Pirates') || team.includes('Los Blancos') || team.includes('Phoenix') || team.includes('Kings')) 
        ? 'bg-blue-600' 
        : 'bg-red-600';
    
    return (
      <div className={`${baseClasses} ${bgColor}`}>
        <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white dark:bg-gray-800 rounded-sm opacity-80"></div>
      </div>
    );
  };

  return (
    <div 
      className="bg-white dark:bg-gray-900 rounded-lg p-3 sm:p-4 mb-3 shadow-sm border border-gray-200 dark:border-gray-700 touch-manipulation cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      onClick={() => {
        if (match.id) {
          router.push(`/match/${match.id}`);
        } else {
          router.push(`/match/1`);
        }
      }}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center space-x-2">
          {match.status === 'live' && (
            <span className="bg-green-500 text-white px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium animate-pulse">
              {t('live')}
            </span>
          )}
          <span className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm">{match.time}</span>
          {match.quarter && (
            <span className="text-gray-600 dark:text-gray-300 font-medium text-xs sm:text-sm">{match.quarter}</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1">
          {getTeamIcon(match.homeTeam || match.team1, match.team1Color)}
          <span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base truncate">
            {match.homeTeam || match.team1}
          </span>
        </div>
        
        <div className="px-2 sm:px-4 min-w-[80px] sm:min-w-[100px] flex justify-center">
          {(match.status === 'live' || match.status === 'Live') && 
           ((match.homeScore !== undefined && match.awayScore !== undefined) || 
            (match.score1 !== undefined && match.score2 !== undefined)) ? (
            <span className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
              {match.homeScore !== undefined ? match.homeScore : match.score1} - {match.awayScore !== undefined ? match.awayScore : match.score2}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 text-sm sm:text-base">{t('vs')}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3 justify-end flex-1">
          <span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base truncate">
            {match.awayTeam || match.team2}
          </span>
          {getTeamIcon(match.awayTeam || match.team2, match.team2Color)}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;